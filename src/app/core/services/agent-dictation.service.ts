import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Service for agent voice dictation in the no-consent flow.
 * The agent can record their own voice to add notes; audio is sent to the backend
 * where Whisper transcribes it. Audio is NEVER persisted (GDPR compliant).
 *
 * Audio pipeline:
 *   Browser mic → AudioWorklet (16kHz PCM, Int16) → ArrayBuffer[] collected locally
 *   → on stop: merged → POST /api/calls/{id}/agent-notes/transcribe → transcript text
 */
@Injectable({
  providedIn: 'root',
})
export class AgentDictationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/calls`;

  // Signals for reactive UI state
  readonly isDictating = signal(false);
  readonly isTranscribing = signal(false);

  private audioContext?: AudioContext;
  private mediaStream?: MediaStream;
  private workletNode?: AudioWorkletNode;
  private pcmChunks: ArrayBuffer[] = [];

  /**
   * Start recording agent dictation.
   * Captures microphone audio as 16kHz Int16 PCM chunks.
   */
  async startDictation(): Promise<void> {
    if (this.isDictating()) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    this.mediaStream = stream;
    this.audioContext = new AudioContext();
    this.pcmChunks = [];

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const nativeSampleRate = this.audioContext.sampleRate;
    const source = this.audioContext.createMediaStreamSource(stream);

    await this.audioContext.audioWorklet.addModule('/assets/audio-processor.js');
    this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-audio-processor');

    this.workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
      if (!this.isDictating()) return;
      const raw: Float32Array = event.data;
      const downsampled =
        nativeSampleRate === 16000
          ? raw
          : this.downsampleBuffer(raw, nativeSampleRate, 16000);
      const pcm = this.float32ToInt16(downsampled);
      this.pcmChunks.push(pcm);
    };

    source.connect(this.workletNode);
    this.isDictating.set(true);
  }

  /**
   * Stop recording and return a cold Observable that sends audio to the backend
   * and emits the transcribed text.
   */
  stopDictationAndTranscribe(callId: string): Observable<string> {
    this.isDictating.set(false);

    // Capture chunks before cleanup
    const chunks = [...this.pcmChunks];
    this.cleanup();

    return new Observable<string>((observer) => {
      if (chunks.length === 0) {
        observer.error(new Error('Keine Audiodaten aufgenommen'));
        return;
      }

      this.isTranscribing.set(true);

      // Merge all Int16 PCM chunks
      const totalBytes = chunks.reduce((sum, c) => sum + c.byteLength, 0);
      const merged = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }

      const blob = new Blob([merged], { type: 'application/octet-stream' });
      const formData = new FormData();
      formData.append('audio', blob, 'dictation.pcm');

      this.http
        .post<{ transcription: string }>(
          `${this.baseUrl}/${callId}/agent-notes/transcribe`,
          formData,
        )
        .subscribe({
          next: (res) => {
            this.isTranscribing.set(false);
            observer.next(res.transcription);
            observer.complete();
          },
          error: (err) => {
            this.isTranscribing.set(false);
            observer.error(err);
          },
        });
    });
  }

  /** Abort dictation without transcribing */
  cancelDictation(): void {
    this.isDictating.set(false);
    this.cleanup();
  }

  private cleanup(): void {
    this.workletNode?.port.close();
    this.workletNode?.disconnect();
    this.mediaStream?.getTracks().forEach((t) => t.stop());
    this.audioContext?.close();
    this.workletNode = undefined;
    this.mediaStream = undefined;
    this.audioContext = undefined;
    this.pcmChunks = [];
  }

  private downsampleBuffer(buffer: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate) return buffer;
    const ratio = fromRate / toRate;
    const result = new Float32Array(Math.round(buffer.length / ratio));
    let offset = 0;
    for (let i = 0; i < result.length; i++) {
      const nextOffset = Math.round((i + 1) * ratio);
      let accum = 0;
      let count = 0;
      for (let j = offset; j < nextOffset && j < buffer.length; j++) {
        accum += buffer[j];
        count++;
      }
      result[i] = count ? accum / count : 0;
      offset = nextOffset;
    }
    return result;
  }

  private float32ToInt16(buffer: Float32Array): ArrayBuffer {
    const int16 = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16.buffer;
  }
}

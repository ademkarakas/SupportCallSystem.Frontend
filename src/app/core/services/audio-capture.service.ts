import { Injectable } from '@angular/core';
import { SignalRService } from './signalr.service';

@Injectable({
  providedIn: 'root',
})
export class AudioCaptureService {
  private audioContext?: AudioContext;
  private mediaStream?: MediaStream;
  private processor?: ScriptProcessorNode;
  private isCapturing = false;
  private currentCallId?: string;

  constructor(private signalRService: SignalRService) {}

  /**
   * Start capturing audio from microphone and stream to backend
   * @param callId The call ID to associate with this audio stream
   */
  async startCapture(callId: string): Promise<void> {
    if (this.isCapturing) {
      console.warn('Audio capture already running');
      return;
    }

    try {
      console.log('Requesting microphone access...');
      
      // Request microphone access with specific constraints
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('Microphone access granted');

      // Create audio context with 16kHz sample rate (Vosk requirement)
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create script processor for audio data
      // Buffer size 4096 matches backend chunk size
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.isCapturing) return;

        const audioData = e.inputBuffer.getChannelData(0);

        // Convert Float32 to Int16 PCM (required by Vosk)
        const pcmData = this.float32ToInt16(audioData);

        // Stream to backend via SignalR
        this.signalRService.streamAudio(callId, pcmData);
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.isCapturing = true;
      this.currentCallId = callId;
      
      console.log(`Audio capture started for call ${callId}`);
    } catch (error) {
      console.error('Failed to start audio capture:', error);
      throw error;
    }
  }

  /**
   * Stop audio capture and release microphone
   */
  stopCapture(): void {
    if (!this.isCapturing) {
      return;
    }

    console.log('Stopping audio capture...');

    this.processor?.disconnect();
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.audioContext?.close();

    this.processor = undefined;
    this.mediaStream = undefined;
    this.audioContext = undefined;
    this.isCapturing = false;
    this.currentCallId = undefined;

    console.log('Audio capture stopped');
  }

  /**
   * Check if audio capture is currently active
   */
  get isCaptureActive(): boolean {
    return this.isCapturing;
  }

  /**
   * Get the current call ID being captured
   */
  get activeCallId(): string | undefined {
    return this.currentCallId;
  }

  /**
   * Convert Float32 audio samples to Int16 PCM format
   * @param buffer Float32Array of audio samples (-1.0 to 1.0)
   * @returns ArrayBuffer containing Int16 PCM data
   */
  private float32ToInt16(buffer: Float32Array): ArrayBuffer {
    const int16 = new Int16Array(buffer.length);
    
    for (let i = 0; i < buffer.length; i++) {
      // Clamp value between -1.0 and 1.0
      const s = Math.max(-1, Math.min(1, buffer[i]));
      
      // Convert to 16-bit signed integer
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    
    return int16.buffer;
  }
}

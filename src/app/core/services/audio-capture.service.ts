import { Injectable } from '@angular/core';
import { SignalRService } from './signalr.service';

@Injectable({
  providedIn: 'root',
})
export class AudioCaptureService {
  private audioContext?: AudioContext;
  private mediaStream?: MediaStream;
  private workletNode?: AudioWorkletNode;
  private isCapturing = false;
  private currentCallId?: string;
  private audioQueue: ArrayBuffer[] = [];
  private isSending = false;
  private consecutiveErrors = 0;
  private sentChunkCount = 0;
  private readonly MAX_CONSECUTIVE_ERRORS = 5;
  private selectedDeviceId?: string;

  constructor(private readonly signalRService: SignalRService) {}

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
      const constraints: MediaStreamConstraints = {
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          ...(this.selectedDeviceId && { deviceId: { exact: this.selectedDeviceId } }),
        },
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      const audioTrack = this.mediaStream.getAudioTracks()[0];
      console.log('Microphone access granted:', {
        label: audioTrack.label,
        deviceId: audioTrack.getSettings().deviceId,
        sampleRate: audioTrack.getSettings().sampleRate,
      });

      // Create audio context at the native sample rate (48kHz or 44.1kHz).
      // Forcing 16kHz caused browsers to feed silent/zero data in some configurations.
      this.audioContext = new AudioContext();
      const nativeSampleRate = this.audioContext.sampleRate;
      console.log('AudioContext created:', {
        state: this.audioContext.state,
        sampleRate: nativeSampleRate,
      });

      // Resume context if suspended (required by browser autoplay policies)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('AudioContext resumed');
      }

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      console.log('Media stream source created');

      // Load and create AudioWorkletNode (replaces deprecated ScriptProcessorNode)
      await this.audioContext.audioWorklet.addModule('/assets/audio-processor.js');
      this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-audio-processor');
      console.log('AudioWorkletNode created');

      let chunkCount = 0;
      this.workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
        if (!this.isCapturing) return;

        chunkCount++;
        if (chunkCount % 100 === 0) {
          console.log(`Audio chunks processed: ${chunkCount}`);
        }

        const rawData: Float32Array = event.data;

        // Downsample from native rate (e.g. 48kHz) to 16kHz required by Vosk
        const downsampled =
          nativeSampleRate === 16000
            ? rawData
            : this.downsampleBuffer(rawData, nativeSampleRate, 16000);

        // Check if we have actual audio data (not silence)
        const maxAmplitude = downsampled.reduce((max, s) => Math.max(max, Math.abs(s)), 0);
        const hasAudio = maxAmplitude > 0.01;

        if (chunkCount === 100 && !hasAudio) {
          console.warn('⚠️ No audio detected after 100 chunks — check microphone');
        }

        const pcmData = this.float32ToInt16(downsampled);
        this.audioQueue.push(pcmData);
        if (chunkCount === 1) {
          console.log(`First chunk added to queue. Queue length: ${this.audioQueue.length}`);
        }
        this.processAudioQueue();
      };

      source.connect(this.workletNode);
      // AudioWorkletNode does not need to be connected to destination to fire

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

    // Stop audio capture
    this.workletNode?.port.close();
    this.workletNode?.disconnect();
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.audioContext?.close();

    this.workletNode = undefined;
    this.mediaStream = undefined;
    this.audioContext = undefined;
    this.isCapturing = false;
    this.currentCallId = undefined;
    this.audioQueue = [];
    this.isSending = false;
    this.consecutiveErrors = 0;
    this.sentChunkCount = 0;
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
   * Process queued audio chunks and send to backend
   */
  private async processAudioQueue(): Promise<void> {
    if (this.isSending || this.audioQueue.length === 0 || !this.currentCallId) {
      return;
    }

    this.isSending = true;

    while (this.audioQueue.length > 0 && this.isCapturing) {
      const chunk = this.audioQueue.shift();
      if (!chunk) continue;

      this.sentChunkCount++;
      if (this.sentChunkCount === 1 || this.sentChunkCount % 20 === 0) {
        console.log(
          `Sending audio chunk #${this.sentChunkCount}, queue length: ${this.audioQueue.length}, chunk size: ${chunk.byteLength}`,
        );
      }

      try {
        await this.signalRService.streamAudio(this.currentCallId, chunk);
        this.consecutiveErrors = 0; // Reset error counter on success

        if (this.sentChunkCount === 1) {
          console.log('✓ First audio chunk sent successfully!');
        }
      } catch (error) {
        console.error('Error streaming audio chunk:', error);
        this.consecutiveErrors++;

        // Stop capture if too many consecutive errors
        if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
          console.error(
            `Too many consecutive errors (${this.consecutiveErrors}), stopping audio capture`,
          );
          this.stopCapture();
          break;
        }

        // Small delay before retrying
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    this.isSending = false;
  }

  /**
   * Downsample a Float32Array from one sample rate to another using averaging.
   */
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

  /**
   * Get list of available microphone devices
   */
  async getAvailableMicrophones(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === 'audioinput');
    } catch (error) {
      console.error('Failed to enumerate audio devices:', error);
      return [];
    }
  }

  /**
   * Set the preferred microphone device
   * @param deviceId The device ID of the microphone to use
   */
  setMicrophone(deviceId: string | undefined): void {
    this.selectedDeviceId = deviceId;
    console.log('Microphone device set to:', deviceId || 'default');
  }

  /**
   * Get the currently selected microphone device ID
   */
  getSelectedMicrophone(): string | undefined {
    return this.selectedDeviceId;
  }
}

import { Injectable } from '@angular/core';
import { SignalRService } from './signalr.service';

@Injectable({
  providedIn: 'root',
})
export class AudioCaptureService {
  private audioContext?: AudioContext;
  private mediaStream?: MediaStream;
  // Using deprecated ScriptProcessorNode until migration to AudioWorklet
  private processor?: ScriptProcessorNode;
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

      // Create audio context with 16kHz sample rate (Vosk requirement)
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      console.log('AudioContext created:', {
        state: this.audioContext.state,
        sampleRate: this.audioContext.sampleRate,
      });

      // Resume context if suspended (required by browser autoplay policies)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('AudioContext resumed');
      }

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      console.log('Media stream source created');

      // Create script processor for audio data (deprecated, will migrate to AudioWorklet)
      // Buffer size 4096 matches backend chunk size
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      console.log('Script processor created');

      let chunkCount = 0;
      this.processor.onaudioprocess = (e) => {
        if (!this.isCapturing) return;

        chunkCount++;
        if (chunkCount === 1 || chunkCount % 50 === 0) {
          console.log(`Audio processing chunk #${chunkCount}`);
        }

        const audioData = e.inputBuffer.getChannelData(0);

        // Check if we have actual audio data (not silence)
        const hasAudio = audioData.some((sample) => Math.abs(sample) > 0.01);
        const maxAmplitude = Math.max(...audioData.map((s) => Math.abs(s)));

        if (chunkCount <= 5 || chunkCount % 50 === 0) {
          console.log(
            `🎤 Chunk ${chunkCount} - hasAudio: ${hasAudio}, maxAmplitude: ${maxAmplitude.toFixed(4)}, samples: ${audioData.length}`,
          );
        }

        // Warn if consistently silent
        if (chunkCount === 100 && !hasAudio) {
          console.warn('⚠️ 100 chunks işlendi ama ses tespit edilmedi! Mikrofona konuşuyor musun?');
        }

        // Convert Float32 to Int16 PCM (required by Vosk)
        const pcmData = this.float32ToInt16(audioData);

        // Add to queue instead of sending immediately
        this.audioQueue.push(pcmData);
        if (chunkCount === 1) {
          console.log(`First chunk added to queue. Queue length: ${this.audioQueue.length}`);
        }

        // Process queue if not already sending
        this.processAudioQueue();
      };

      source.connect(this.processor);
      // Connect through a silent GainNode (gain=0) to destination.
      // This is REQUIRED: Chrome/Chromium will NOT fire onaudioprocess unless
      // the processor node is part of a fully connected audio graph.
      // GainNode with gain=0 ensures no audible output (no echo/feedback).
      const silentGain = this.audioContext.createGain();
      silentGain.gain.value = 0;
      this.processor.connect(silentGain);
      silentGain.connect(this.audioContext.destination);

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
    this.audioQueue = [];
    this.isSending = false;
    this.consecutiveErrors = 0;
    this.sentChunkCount = 0;

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

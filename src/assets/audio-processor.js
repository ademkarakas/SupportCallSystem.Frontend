/**
 * AudioWorklet processor for capturing raw PCM audio data.
 * Runs in the AudioWorklet thread and posts Float32Array chunks to the main thread.
 * Replaces the deprecated ScriptProcessorNode.
 */
class PcmAudioProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input?.[0]?.length > 0) {
      // Clone the data before posting — the buffer is not transferable in all browsers
      this.port.postMessage(input[0].slice());
    }
    return true; // keep processor alive
  }
}

registerProcessor('pcm-audio-processor', PcmAudioProcessor);

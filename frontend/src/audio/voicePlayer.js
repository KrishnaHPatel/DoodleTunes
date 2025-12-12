/**
 * Voice playback using Web Audio API
 */
export class VoicePlayer {
  constructor() {
    this.currentSources = [];
    this.onComplete = null;
  }

  async play(chunks, destination, onComplete) {
    if (!chunks || chunks.length === 0) {
      throw new Error('No audio chunks provided');
    }

    this.onComplete = onComplete;
    const audioContext = destination.context;

    if (!audioContext) {
      throw new Error('Audio context not available');
    }

    // Ensure context is running
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const now = audioContext.currentTime;
    let currentTime = now + 0.1; // Small delay for stability

    // Decode all chunks
    const audioBuffers = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        // Decode base64 to binary
        const binaryString = atob(chunk.audioBase64);
        const audioBytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          audioBytes[j] = binaryString.charCodeAt(j);
        }

        // Decode audio data
        const audioBuffer = await audioContext.decodeAudioData(audioBytes.buffer.slice(0));
        audioBuffers.push({ buffer: audioBuffer, pauseMs: chunk.pauseMs });
      } catch (error) {
        console.error(`Error decoding chunk ${i}:`, error);
        throw new Error(`Failed to decode audio chunk ${i + 1}: ${error.message}`);
      }
    }

    // Schedule playback
    for (let i = 0; i < audioBuffers.length; i++) {
      const { buffer, pauseMs } = audioBuffers[i];
      const source = audioContext.createBufferSource();
      source.buffer = buffer;

      // Fade in/out to prevent clicks
      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0, currentTime);
      gain.gain.linearRampToValueAtTime(1, currentTime + 0.01);
      gain.gain.setValueAtTime(1, currentTime + buffer.duration - 0.02);
      gain.gain.linearRampToValueAtTime(0, currentTime + buffer.duration);

      source.connect(gain);
      gain.connect(destination);

      source.start(currentTime);
      source.stop(currentTime + buffer.duration);

      this.currentSources.push({ source, gain });

      // Advance time for next chunk
      currentTime += buffer.duration + (pauseMs / 1000);
    }

    // Call onComplete when done
    const totalDuration = currentTime - now;
    setTimeout(() => {
      if (this.onComplete) {
        this.onComplete();
      }
    }, totalDuration * 1000);
  }

  stop() {
    for (const { source, gain } of this.currentSources) {
      try {
        source.stop();
        gain.gain.cancelScheduledValues(gain.context.currentTime);
        gain.gain.setValueAtTime(0, gain.context.currentTime);
      } catch (e) {
        // Already stopped
      }
    }
    this.currentSources = [];
  }
}


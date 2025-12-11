/**
 * Voice playback using Web Audio API
 */
export class VoicePlayer {
  constructor() {
    this.currentSources = [];
    this.onComplete = null;
  }

  async play(chunks, destination, onComplete) {
    this.onComplete = onComplete;
    const audioContext = destination.context;
    const now = audioContext.currentTime;
    let currentTime = now + 0.05; // Small delay for stability

    // Decode all chunks
    const audioBuffers = [];
    for (const chunk of chunks) {
      const audioBytes = Uint8Array.from(atob(chunk.audioBase64), c => c.charCodeAt(0));
      const audioBuffer = await audioContext.decodeAudioData(audioBytes.buffer);
      audioBuffers.push({ buffer: audioBuffer, pauseMs: chunk.pauseMs });
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


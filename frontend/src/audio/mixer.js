/**
 * Audio mixer for voice and music
 */
export class Mixer {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.voiceGain = null;
    this.musicGain = null;
  }

  init(audioContext) {
    this.audioContext = audioContext;
    
    // Create gain nodes
    this.masterGain = audioContext.createGain();
    this.voiceGain = audioContext.createGain();
    this.musicGain = audioContext.createGain();
    
    // Connect to master
    this.voiceGain.connect(this.masterGain);
    this.musicGain.connect(this.masterGain);
    this.masterGain.connect(audioContext.destination);
    
    // Set initial volumes
    this.setVoiceVolume(0.8);
    this.setMusicVolume(0.6);
  }

  getVoiceInput() {
    return this.voiceGain;
  }

  getMusicInput() {
    return this.musicGain;
  }

  setVoiceVolume(volume) {
    if (this.voiceGain) {
      this.voiceGain.gain.value = volume;
    }
  }

  setMusicVolume(volume) {
    if (this.musicGain) {
      this.musicGain.gain.value = volume;
    }
  }

  fadeOut(duration = 0.1) {
    if (this.masterGain) {
      const now = this.audioContext.currentTime;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0, now + duration);
    }
  }
}


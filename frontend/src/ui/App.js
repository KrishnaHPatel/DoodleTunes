/**
 * Main App Controller
 */
import { VoicePlayer } from '../audio/voicePlayer.js';
import { MelodyPlayer } from '../audio/melody.js';
import { Mixer } from '../audio/mixer.js';
import { ApiClient } from '../api/client.js';

export class App {
  constructor() {
    this.voicePlayer = new VoicePlayer();
    this.melodyPlayer = new MelodyPlayer();
    this.mixer = new Mixer();
    this.apiClient = new ApiClient();
    this.isPlaying = false;
    this.currentChunks = null;
  }

  init() {
    // Setup UI
    this.setupButtons();
    this.setupVolumeControls();
    this.updateStatus('Ready');
  }

  setupButtons() {
    const playBtn = document.getElementById('play-btn');
    const stopBtn = document.getElementById('stop-btn');

    playBtn.addEventListener('click', () => this.handlePlay());
    stopBtn.addEventListener('click', () => this.handleStop());
  }

  setupVolumeControls() {
    const voiceVol = document.getElementById('voice-volume');
    const musicVol = document.getElementById('music-volume');
    const voiceVolValue = document.getElementById('voice-volume-value');
    const musicVolValue = document.getElementById('music-volume-value');

    voiceVol.addEventListener('input', (e) => {
      const value = e.target.value;
      voiceVolValue.textContent = value + '%';
      this.mixer.setVoiceVolume(value / 100);
    });

    musicVol.addEventListener('input', (e) => {
      const value = e.target.value;
      musicVolValue.textContent = value + '%';
      this.mixer.setMusicVolume(value / 100);
      // Also update custom melody volume if playing
      this.melodyPlayer.setVolume(value / 100);
    });
  }

  async handlePlay() {
    if (this.isPlaying) return;

    try {
      this.isPlaying = true;
      this.updateStatus('Rendering voice...');

      // Get lyrics and mood (voice is automatically selected based on mood)
      const lyricsText = document.getElementById('lyrics-input').value;
      const lyricsLines = lyricsText.split('\n').filter(line => line.trim());
      const mood = document.getElementById('mood-select').value;

      if (lyricsLines.length === 0) {
        throw new Error('Please enter some lyrics');
      }

      // Disable play button
      document.getElementById('play-btn').disabled = true;
      document.getElementById('stop-btn').disabled = false;

      // Fetch TTS chunks from backend (voice is selected automatically by mood)
      const response = await this.apiClient.render(lyricsLines, mood);
      this.currentChunks = response.chunks;

      this.updateStatus('Starting playback...');

      // Start Tone.js first (creates audio context) - this must happen from user gesture
      await Tone.start();

      // Get the native AudioContext from Tone
      // Tone.context has a 'rawContext' property in newer versions
      const toneContext = Tone.context;
      let audioContext = toneContext.rawContext ||
        toneContext._context ||
        (toneContext instanceof (window.AudioContext || window.webkitAudioContext) ? toneContext : null);

      // If we couldn't get it from Tone, create our own
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!audioContext || !(audioContext instanceof AudioContextClass)) {
        audioContext = new AudioContextClass();
      }

      // Ensure audio context is running - critical for first play
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Wait for context to actually be running
      let attempts = 0;
      while (audioContext.state !== 'running' && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 10));
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        attempts++;
      }

      if (audioContext.state !== 'running') {
        throw new Error('Audio context failed to start. Please try again.');
      }

      // Setup mixer with native AudioContext
      if (!this.mixer.audioContext) {
        this.mixer.init(audioContext);
      }

      // Verify mixer is ready
      const voiceInput = this.mixer.getVoiceInput();
      const musicInput = this.mixer.getMusicInput();

      if (!voiceInput || !musicInput) {
        throw new Error('Mixer not properly initialized');
      }

      // Get mood profile for melody
      const moodProfile = this.getMoodProfile(mood);
      moodProfile.mood = mood; // Add mood name for melody selection

      // Start melody (will use custom file if available, otherwise Tone.js)
      await this.melodyPlayer.start(moodProfile, musicInput);

      // Start voice playback
      await this.voicePlayer.play(response.chunks, voiceInput, () => {
        this.handleStop();
      });

      this.updateStatus('Playing...');

    } catch (error) {
      console.error('Playback error:', error);
      console.error('Error stack:', error.stack);
      this.updateStatus('Error: ' + (error.message || 'Unknown error. Check console for details.'));
      this.isPlaying = false;
      document.getElementById('play-btn').disabled = false;
      document.getElementById('stop-btn').disabled = true;
    }
  }

  handleStop() {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.voicePlayer.stop();
    this.melodyPlayer.stop();

    document.getElementById('play-btn').disabled = false;
    document.getElementById('stop-btn').disabled = true;
    this.updateStatus('Stopped');
  }

  getMoodProfile(mood) {
    const profiles = {
      "Calm": { bpm: 80 },
      "Sad": { bpm: 70 },
      "Romantic": { bpm: 85 },
      "Happy": { bpm: 120 },
      "Energetic": { bpm: 150 },
      "Angry": { bpm: 140 }
    };
    return profiles[mood] || profiles["Calm"];
  }

  updateStatus(message) {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

}


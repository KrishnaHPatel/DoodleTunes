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
    const generateBtn = document.getElementById('generate-btn');

    playBtn.addEventListener('click', () => this.handlePlay());
    stopBtn.addEventListener('click', () => this.handleStop());
    generateBtn.addEventListener('click', () => this.handleGenerate());
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
    });
  }

  async handleGenerate() {
    // TODO: Call your lyric generator API
    // For now, just use the textarea content
    this.updateStatus('Lyrics ready (using textarea content)');
  }

  async handlePlay() {
    if (this.isPlaying) return;

    try {
      this.isPlaying = true;
      this.updateStatus('Rendering voice...');
      
      // Get lyrics and mood
      const lyricsText = document.getElementById('lyrics-input').value;
      const lyricsLines = lyricsText.split('\n').filter(line => line.trim());
      const mood = document.getElementById('mood-select').value;

      if (lyricsLines.length === 0) {
        throw new Error('Please enter some lyrics');
      }

      // Disable play button
      document.getElementById('play-btn').disabled = true;
      document.getElementById('stop-btn').disabled = false;

      // Fetch TTS chunks from backend
      const response = await this.apiClient.render(lyricsLines, mood);
      this.currentChunks = response.chunks;

      this.updateStatus('Starting playback...');
      
      // Initialize audio context
      await Tone.start();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Setup mixer
      this.mixer.init(audioContext);

      // Get mood profile for melody
      const moodProfile = this.getMoodProfile(mood);
      moodProfile.mood = mood; // Add mood name for melody selection

      // Start melody
      this.melodyPlayer.start(moodProfile, this.mixer.getMusicInput());

      // Start voice playback
      await this.voicePlayer.play(response.chunks, this.mixer.getVoiceInput(), () => {
        this.handleStop();
      });

      this.updateStatus('Playing...');
      this.showProgress(response.chunks.length);

    } catch (error) {
      console.error('Playback error:', error);
      this.updateStatus('Error: ' + error.message);
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
    this.hideProgress();

    document.getElementById('play-btn').disabled = false;
    document.getElementById('stop-btn').disabled = true;
    this.updateStatus('Stopped');
  }

  getMoodProfile(mood) {
    const profiles = {
      "Calm": { bpm: 80 },
      "Sad": { bpm: 70 },
      "Mysterious": { bpm: 90 },
      "Romantic": { bpm: 85 },
      "Hopeful": { bpm: 105 },
      "Happy": { bpm: 120 },
      "Excited": { bpm: 150 },
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

  showProgress(totalLines) {
    const progressEl = document.getElementById('progress');
    if (progressEl) {
      progressEl.style.display = 'block';
    }
    // TODO: Update progress as lines play
  }

  hideProgress() {
    const progressEl = document.getElementById('progress');
    if (progressEl) {
      progressEl.style.display = 'none';
    }
  }
}


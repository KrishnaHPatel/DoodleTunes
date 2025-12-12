/**
 * Playback Page Controller
 */
import { VoicePlayer } from './audio/voicePlayer.js';
import { MelodyPlayer } from './audio/melody.js';
import { Mixer } from './audio/mixer.js';
import { ApiClient } from './api/client.js';

class PlaybackApp {
  constructor() {
    this.voicePlayer = new VoicePlayer();
    this.melodyPlayer = new MelodyPlayer();
    this.mixer = new Mixer();
    this.apiClient = new ApiClient();
    this.isPlaying = false;
    this.currentChunks = null;
  }

  init() {
    // Load lyrics from localStorage
    this.loadLyrics();
    
    // Setup UI
    this.setupButtons();
    this.setupVolumeControls();
    this.updateStatus('Ready');
  }

  loadLyrics() {
    const stored = localStorage.getItem('doodletunes_lyrics');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const lyricsInput = document.getElementById('lyrics-input');
        if (lyricsInput && data.lyrics) {
          lyricsInput.value = data.lyrics;
        }
        
        // Set mood if available and disable the selector
        const moodSelect = document.getElementById('mood-select');
        if (moodSelect && data.emotion) {
          // Map emotion from first page to mood format for second page
          const emotionToMood = {
            'happy': 'Happy',
            'sad': 'Sad',
            'calm': 'Calm',
            'angry': 'Angry',
            'energetic': 'Energetic',
            'romantic': 'Romantic'
          };
          
          const mood = emotionToMood[data.emotion.toLowerCase()] || 
                       data.emotion.charAt(0).toUpperCase() + data.emotion.slice(1);
          
          if (moodSelect.querySelector(`option[value="${mood}"]`)) {
            moodSelect.value = mood;
          }
          
          // Disable the mood selector
          moodSelect.disabled = true;
        }
      } catch (e) {
        console.error("Failed to load lyrics from storage", e);
        this.updateStatus('Error loading lyrics. Please go back and generate new ones.');
      }
    } else {
      this.updateStatus('No lyrics found. Please go back and generate lyrics first.');
    }
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
      this.melodyPlayer.setVolume(value / 100);
    });
  }

  async handlePlay() {
    if (this.isPlaying) return;

    try {
      this.isPlaying = true;
      this.updateStatus('Rendering voice...');

      const lyricsText = document.getElementById('lyrics-input').value;
      const lyricsLines = lyricsText.split('\n').filter(line => line.trim());
      const mood = document.getElementById('mood-select').value;

      if (lyricsLines.length === 0) {
        throw new Error('Please enter some lyrics');
      }

      document.getElementById('play-btn').disabled = true;
      document.getElementById('stop-btn').disabled = false;

      const response = await this.apiClient.render(lyricsLines, mood);
      this.currentChunks = response.chunks;

      this.updateStatus('Starting playback...');

      await Tone.start();

      const toneContext = Tone.context;
      let audioContext = toneContext.rawContext ||
        toneContext._context ||
        (toneContext instanceof (window.AudioContext || window.webkitAudioContext) ? toneContext : null);

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!audioContext || !(audioContext instanceof AudioContextClass)) {
        audioContext = new AudioContextClass();
      }

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

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

      if (!this.mixer.audioContext) {
        this.mixer.init(audioContext);
      }

      const voiceInput = this.mixer.getVoiceInput();
      const musicInput = this.mixer.getMusicInput();

      if (!voiceInput || !musicInput) {
        throw new Error('Mixer not properly initialized');
      }

      const moodProfile = this.getMoodProfile(mood);
      moodProfile.mood = mood;

      await this.melodyPlayer.start(moodProfile, musicInput);

      await this.voicePlayer.play(response.chunks, voiceInput, () => {
        this.handleStop();
      });

      this.updateStatus('Playing...');

    } catch (error) {
      console.error('Playback error:', error);
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new PlaybackApp();
    app.init();
  });
} else {
  const app = new PlaybackApp();
  app.init();
}


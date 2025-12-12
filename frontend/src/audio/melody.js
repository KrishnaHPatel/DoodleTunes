/**
 * Mood-based melody using custom audio files or Tone.js fallback
 */
export class MelodyPlayer {
  constructor() {
    this.synth = null;
    this.reverb = null;
    this.filter = null;
    this.delay = null;
    this.isPlaying = false;
    this.repeatId = null;
    this.audioSource = null;
    this.audioBuffer = null;
    this.gainNode = null;
  }

  async start(moodProfile, destination) {
    if (this.isPlaying) {
      this.stop();
    }

    this.isPlaying = true;

    // Get mood from profile
    const mood = moodProfile.mood || 'Calm';

    // Try to load custom melody file first
    const customMelodyLoaded = await this.loadCustomMelody(mood, destination);

    if (customMelodyLoaded) {
      // Custom melody is playing, we're done
      return;
    }

    // Fallback to Tone.js generated melody
    Tone.Transport.bpm.value = moodProfile.bpm;

    // Create synth with mood-specific settings
    const synthSettings = this.getSynthSettings(mood);
    this.synth = new Tone.PolySynth({
      maxPolyphony: 4,
      voice: Tone.Synth,
      options: synthSettings
    });

    // Reverb with mood-specific settings
    const reverbTime = this.getReverbTime(mood);
    this.reverb = new Tone.Reverb(reverbTime);

    // Add effects based on mood
    if (mood === "Sad") {
      // Low-pass filter for sad mood to make it softer
      this.filter = new Tone.Filter({
        frequency: 2000,
        type: "lowpass"
      });
      this.synth.chain(this.filter, this.reverb, destination);
    } else if (mood === "Energetic") {
      // Add a bit of delay for pop feel
      this.delay = new Tone.PingPongDelay({
        delayTime: "8n",
        feedback: 0.2,
        wet: 0.1
      });
      this.synth.chain(this.delay, this.reverb, destination);
    } else {
      // Connect: synth -> reverb -> destination
      this.synth.chain(this.reverb, destination);
    }

    // Build mood-based chord progression and melody
    const { chords, melody } = this.buildMoodLoop(mood);

    // Schedule repeating pattern with mood-specific rhythm
    let beat = 0;
    const rhythmPattern = this.getRhythmPattern(mood);

    this.repeatId = Tone.Transport.scheduleRepeat((time) => {
      // Play chord based on rhythm pattern
      if (rhythmPattern.chordBeats.includes(beat % rhythmPattern.loopLength)) {
        const chordIndex = Math.floor((beat / rhythmPattern.chordInterval) % chords.length);
        const chordDuration = rhythmPattern.chordDuration || '2n';
        this.synth.triggerAttackRelease(chords[chordIndex], chordDuration, time);
      }

      // Play melody note based on rhythm pattern
      if (rhythmPattern.melodyBeats.includes(beat % rhythmPattern.loopLength)) {
        const melodyIndex = beat % melody.length;
        const melodyDuration = rhythmPattern.melodyDuration || '8n';
        // For Energetic, add slight staccato feel
        const offset = (mood === "Energetic" && beat % 2 === 0) ? 0.02 : 0.05;
        this.synth.triggerAttackRelease(melody[melodyIndex], melodyDuration, time + offset);
      }

      beat++;
    }, '8n'); // More granular timing

    Tone.Transport.start();
  }

  async loadCustomMelody(mood, destination) {
    // Try to load custom melody file (WAV first, then M4A)
    const audioContext = destination.context;
    const formats = ['wav', 'm4a'];
    const fileName = `${mood}_Melody`;

    for (const format of formats) {
      try {
        const url = `melodies/${fileName}.${format}`;
        const response = await fetch(url);

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          this.audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          // Create gain node for volume control
          this.gainNode = audioContext.createGain();
          this.gainNode.gain.value = 0.6; // Default music volume
          this.gainNode.connect(destination);

          // Create and start audio source
          this.audioSource = audioContext.createBufferSource();
          this.audioSource.buffer = this.audioBuffer;
          this.audioSource.loop = true; // Loop the melody
          this.audioSource.connect(this.gainNode);
          this.audioSource.start(0);

          console.log(`Loaded custom melody: ${fileName}.${format}`);
          return true;
        }
      } catch (error) {
        // File doesn't exist or can't be decoded, try next format
        continue;
      }
    }

    // No custom melody found
    return false;
  }

  stop() {
    // Stop custom audio file if playing
    if (this.audioSource) {
      try {
        this.audioSource.stop();
      } catch (e) {
        // Already stopped
      }
      this.audioSource = null;
      this.audioBuffer = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    // Stop Tone.js generated melody
    if (this.synth) {
      this.synth.releaseAll();
      this.synth.dispose();
      this.synth = null;
    }
    if (this.reverb) {
      this.reverb.dispose();
      this.reverb = null;
    }
    if (this.filter) {
      this.filter.dispose();
      this.filter = null;
    }
    if (this.delay) {
      this.delay.dispose();
      this.delay = null;
    }
    if (this.repeatId !== null) {
      Tone.Transport.clear(this.repeatId);
      this.repeatId = null;
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
    this.isPlaying = false;
  }

  setVolume(volume) {
    // Set volume for custom melody
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    }
    // Volume for Tone.js melody is handled by mixer
  }

  buildMoodLoop(mood) {
    // Distinct mood-based patterns with different scales and progressions
    const patterns = {
      "Calm": {
        chords: [["C3", "E3", "G3"], ["A3", "C4", "E4"], ["F3", "A3", "C4"], ["G3", "B3", "D4"]],
        melody: ["C4", "E4", "G4", "A4", "C5", "A4", "G4", "E4", "C4", "D4", "E4", "G4"]
      },
      "Sad": {
        chords: [["Am3", "C4", "E4"], ["F3", "A3", "C4"], ["C3", "E3", "G3"], ["G3", "B3", "D4"]],
        melody: ["A4", "G4", "E4", "C4", "A3", "G3", "E3", "C3", "A3", "C4", "E4", "G4"]
      },
      "Happy": {
        chords: [["C3", "E3", "G3"], ["F3", "A3", "C4"], ["G3", "B3", "D4"], ["C4", "E4", "G4"]],
        melody: ["C5", "E5", "G5", "C6", "G5", "E5", "C5", "G4", "E4", "G4", "C5", "E5"]
      },
      "Energetic": {
        chords: [["C3", "E3", "G3"], ["F3", "A3", "C4"], ["G3", "B3", "D4"], ["Am3", "C4", "E4"]],
        melody: ["C5", "E5", "G5", "C6", "E6", "G6", "E6", "C6", "G5", "E5", "C5", "E5", "G5", "C6", "E6", "C6"]
      },
      "Angry": {
        chords: [["D3", "F#3", "A3"], ["G3", "Bb3", "D4"], ["A3", "C4", "E4"], ["D3", "F#3", "A3"]],
        melody: ["D4", "F#4", "A4", "D5", "A4", "F#4", "D4", "A3", "F#3", "A3", "D4", "F#4"]
      },
      "Romantic": {
        chords: [["Eb3", "G3", "Bb3"], ["Ab3", "C4", "Eb4"], ["Bb3", "D4", "F4"], ["Eb4", "G4", "Bb4"]],
        melody: ["Eb4", "G4", "Bb4", "Eb5", "G5", "Eb5", "Bb4", "G4", "Eb4", "G4", "Bb4", "Eb5"]
      }
    };

    return patterns[mood] || patterns["Calm"];
  }

  getRhythmPattern(mood) {
    // Different rhythm patterns for different moods
    const rhythms = {
      "Calm": {
        chordBeats: [0, 8, 16, 24],
        melodyBeats: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22],
        loopLength: 32,
        chordInterval: 2,
        chordDuration: '2n',
        melodyDuration: '8n'
      },
      "Sad": {
        chordBeats: [0, 16],
        melodyBeats: [0, 4, 8, 12, 16, 20],
        loopLength: 32,
        chordInterval: 4,
        chordDuration: '2n',
        melodyDuration: '4n'
      },
      "Happy": {
        chordBeats: [0, 4, 8, 12],
        melodyBeats: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        loopLength: 16,
        chordInterval: 1,
        chordDuration: '4n',
        melodyDuration: '16n'
      },
      "Energetic": {
        chordBeats: [0, 2, 4, 6, 8, 10, 12, 14],
        melodyBeats: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        loopLength: 16,
        chordInterval: 1,
        chordDuration: '8n',
        melodyDuration: '16n'
      },
      "Angry": {
        chordBeats: [0, 3, 6, 9],
        melodyBeats: [0, 1, 3, 4, 6, 7, 9, 10],
        loopLength: 12,
        chordInterval: 1,
        chordDuration: '4n',
        melodyDuration: '16n'
      },
      "Romantic": {
        chordBeats: [0, 8, 16],
        melodyBeats: [0, 2, 4, 6, 8, 10, 12, 14],
        loopLength: 24,
        chordInterval: 2,
        chordDuration: '2n',
        melodyDuration: '8n'
      }
    };

    return rhythms[mood] || rhythms["Calm"];
  }

  getSynthSettings(mood) {
    // Different synth settings for different moods
    const settings = {
      "Calm": { oscillator: { type: "sine" }, envelope: { attack: 0.5, decay: 0.3, sustain: 0.7, release: 1.2 } },
      "Sad": { oscillator: { type: "sine" }, envelope: { attack: 1.0, decay: 0.8, sustain: 0.5, release: 2.0 } },
      "Happy": { oscillator: { type: "triangle" }, envelope: { attack: 0.1, decay: 0.2, sustain: 0.8, release: 0.5 } },
      "Energetic": { oscillator: { type: "triangle" }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.95, release: 0.2 } },
      "Angry": { oscillator: { type: "sawtooth" }, envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.4 } },
      "Romantic": { oscillator: { type: "sine" }, envelope: { attack: 0.3, decay: 0.4, sustain: 0.6, release: 1.0 } }
    };

    return settings[mood] || settings["Calm"];
  }

  getReverbTime(mood) {
    // Different reverb times for different moods
    const reverbTimes = {
      "Calm": 3.0,
      "Sad": 5.0,
      "Happy": 1.5,
      "Energetic": 0.8,
      "Angry": 2.0,
      "Romantic": 3.5
    };

    return reverbTimes[mood] || 2.0;
  }
}


/**
 * Mood-based melody using Tone.js
 */
export class MelodyPlayer {
  constructor() {
    this.synth = null;
    this.reverb = null;
    this.isPlaying = false;
  }

  start(moodProfile, destination) {
    if (this.isPlaying) {
      this.stop();
    }

    this.isPlaying = true;
    Tone.Transport.bpm.value = moodProfile.bpm;

    // Create synth with reverb
    this.synth = new Tone.PolySynth(Tone.Synth).connect(destination);
    this.reverb = new Tone.Reverb(2).connect(destination);
    this.synth.connect(this.reverb);

    // Build mood-based chord progression and melody
    // moodProfile should have a 'mood' property, or we can pass it separately
    const mood = moodProfile.mood || 'Calm';
    const { chords, melody } = this.buildMoodLoop(mood);

    // Schedule repeating pattern
    let beat = 0;
    Tone.Transport.scheduleRepeat((time) => {
      // Play chord every 2 beats
      if (beat % 2 === 0) {
        const chordIndex = Math.floor((beat / 2) % chords.length);
        this.synth.triggerAttackRelease(chords[chordIndex], '2n', time);
      }
      
      // Play melody note every beat
      const melodyIndex = beat % melody.length;
      this.synth.triggerAttackRelease(melody[melodyIndex], '8n', time + 0.1);
      
      beat++;
    }, '4n');

    Tone.Transport.start();
  }

  stop() {
    if (this.synth) {
      this.synth.releaseAll();
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
    this.isPlaying = false;
  }

  buildMoodLoop(mood) {
    // Simple mood-based patterns
    const patterns = {
      "Calm": {
        chords: [["C3", "E3", "G3"], ["A3", "C4", "E4"], ["F3", "A3", "C4"], ["G3", "B3", "D4"]],
        melody: ["C4", "E4", "G4", "A4", "C5", "A4", "G4", "E4"]
      },
      "Sad": {
        chords: [["A3", "C4", "E4"], ["D4", "F4", "A4"], ["G3", "B3", "D4"], ["E4", "G4", "B4"]],
        melody: ["A4", "G4", "F4", "E4", "D4", "C4", "B3", "A3"]
      },
      "Happy": {
        chords: [["C3", "E3", "G3"], ["F3", "A3", "C4"], ["G3", "B3", "D4"], ["C3", "E3", "G3"]],
        melody: ["C5", "E5", "G5", "C6", "G5", "E5", "C5", "G4"]
      },
      "Excited": {
        chords: [["C3", "E3", "G3"], ["F3", "A3", "C4"], ["G3", "B3", "D4"], ["C3", "E3", "G3"]],
        melody: ["C5", "E5", "G5", "C6", "E6", "C6", "G5", "E5"]
      }
    };

    return patterns[mood] || patterns["Calm"];
  }
}


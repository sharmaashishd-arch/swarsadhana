# Acceptance Criteria: Sample-Based Audio Overhaul

## Feature: Replace synthesized vocal swaras with sample-based instruments

### Success Criteria

1. **Tanpura drone plays audible sound on iOS simulator**
   - Peak volume > -20dB on any tanpura drone file
   - All 24 key-specific drones load and play without errors

2. **Tanpura key change is seamless**
   - Crossfade between keys with no audible gap or click
   - New drone starts within 500ms of key change

3. **Swara demo plays harmonium tones (Flutter)**
   - Each swar (Sa through Ni, .Sa, Sa.) produces a distinct pitched tone
   - Tones are from the Wetthasinghe Harmonium SF2 (not synthesis)
   - Notes play in correct sequence during exercise demo

4. **Swar-to-MIDI mapping is correct**
   - Sa at key=C maps to MIDI 60
   - Re at key=C maps to MIDI 62
   - .Sa (upper) at key=C maps to MIDI 72
   - Sa. (lower) at key=C maps to MIDI 48
   - Key changes shift all mappings correctly

5. **Swara playback is deterministic**
   - Same swar name + key produces identical PCM output (no random vibrato, no Math.random())

6. **Web swara playback uses WebAudioFont Reed Organ**
   - SampleSwarSynth class replaces VocalSwarSynth in robot-guruji.js
   - RealisticSwarSynth in realistic-audio-engine.js uses WebAudioFont
   - Fallback to triangle oscillator if WebAudioFont fails to load

7. **Pitch detection and grading pipeline unchanged**
   - GradingEngine class unchanged (same weights: 40/20/20/20)
   - RobotListener grading unchanged (same weights: 40/20/30/10)
   - PitchDetector YIN algorithm unchanged
   - freqToSwar mapping unchanged

8. **assets/licenses.md exists and is complete**
   - Lists all 24 tanpura drones with source URLs and Ragajunglism open-access note
   - Lists harmonium SF2 with CC-BY 4.0 and author credit
   - Lists tabla samples with MIT license
   - Notes Yamaha exclusion

### Failure Criteria

1. Tanpura produces silence on iOS (peak < -60dB)
2. App crashes during tanpura key change
3. Swara demo produces no sound during exercise playback
4. MIDI mapping off by more than 1 semitone
5. Grading weights or pitch detection algorithm modified
6. Yamaha-sourced audio assets present in repo
7. Missing license attribution for any bundled audio asset

9. **Web tanpura uses recorded samples (not synthesis)**
   - Inline tanpura in index.html loads MP3 from `assets/audio/tanpura/`
   - RealisticTanpuraEngine in realistic-audio-engine.js loads MP3 samples
   - Crossfade on key change and string config change
   - All 24 MP3 files present in `web/assets/audio/tanpura/`

10. **Flutter app has Exercises navigation**
    - Bottom navigation bar with "Instruments" and "Exercises" tabs
    - Tapping "Exercises" shows the RobotRiyaazScreen
    - Tapping "Instruments" returns to instruments view

### Out of Scope

- Ni-Sa tanpura tuning (Ragajunglism does not provide these; falls back to Pa-Sa)
- Real microphone pitch detection on Flutter (still simulation)
- SelfTestHarness score recalibration for new timbre

# Saptak (Octave) Selection — Acceptance Criteria

## Success Criteria

### Data Model
- Global PracticeSettings has a `saptak` field with values MANDRA, MADHYA, TAAR.
- Default saptak is MADHYA (0 semitone shift).
- Exercise defaults include `recommended_saptak` (default MADHYA).
- Per-exercise override can set saptak when override is enabled.

### Pitch Semantics
- MANDRA applies −12 semitones to all swar playback and grading.
- MADHYA applies 0 semitones (baseline).
- TAAR applies +12 semitones.
- Robot swar playback uses the effective saptak shift for all scheduled notes.
- Grading/pitch detection uses the same saptak shift when comparing detected frequency to expected swar.
- Tanpura drone is NOT shifted by saptak (stays in the chosen Sa key).

### UI — Web
- Practice Setup modal shows a segmented control: Mandra | Madhya | Taar.
- Current saptak is shown in the main header strip (compact text).
- Exercise detail Accompaniment card shows effective saptak.
- Selection persists in localStorage.

### UI — Flutter
- Practice Setup bottom sheet shows a segmented Saptak selector.
- Current saptak displayed in top bar or setup section.
- Exercise detail shows effective saptak.

### Playback
- Web: `RealisticSwarSynth._swarToMidi()` and `getSwarFreq()` apply saptak shift.
- Flutter: `SwarPlayer.swarToMidi()` applies saptak shift; pre-rendered notes shift accordingly.
- Teentaal exercise at Sa=C, Saptak=Taar produces first Sa at ~523 Hz (C5).
- Same exercise at Saptak=Mandra produces first Sa at ~131 Hz (C3).

### Grading
- Web: `PitchDetector.calibratedSaFreq` is shifted by saptak before swar comparison.
- Flutter: `PitchDetector._baseSaFreq` is shifted by saptak.
- Expected frequency tables match playback frequencies.

### Mid-Session Change
- Changing saptak during playback fades out robot swar and restarts cleanly.
- Tanpura and tabla can continue unaffected.

## Failure Criteria
- Tanpura drone jumps octave when saptak changes → FAIL.
- Robot plays notes in wrong octave relative to selected saptak → FAIL.
- Grading expects different octave than what robot plays → FAIL.
- Saptak selection not persisted across page reload (web) → FAIL.
- Any existing test suite regresses → FAIL.

## Out of Scope
- No UI redesign beyond adding the selector and displaying effective saptak.
- No per-swar octave override (only global saptak shift).
- No Carnatic-style sthayi/octave conventions.

# Sadhana - Acceptance Criteria

## Feature Overview
Automated practice system for Hindustani classical music exercises with:
- Exercise Library
- Robot Player (auto-play)
- Robot Listener (pitch detection + grading)
- Session Flow (demo → practice → score)

---

## Success Criteria

### 1. Exercise Library
- [ ] Exercises load from JSON file successfully
- [ ] Exercise browser displays all categories
- [ ] Clicking category filters exercises correctly
- [ ] Clicking exercise opens detail view
- [ ] Swar patterns display in Devanagari
- [ ] Taal grid shows beats with Sam/Tali/Khali markers

### 2. Robot Player
- [ ] Play button starts tanpura drone
- [ ] Tabla plays correct taal pattern at specified tempo
- [ ] Swars play in sequence with correct timing
- [ ] Visual cursor highlights current swar
- [ ] Taal grid highlights current beat
- [ ] Stop button stops all audio immediately
- [ ] Tempo slider changes playback speed (30-200 BPM)

### 3. Robot Listener
- [ ] Microphone permission requested on practice start
- [ ] Pitch detection identifies Sa correctly (±50 cents)
- [ ] All 12 swaras detected within tolerance
- [ ] Timing detection within 200ms window
- [ ] Live feedback shows green for correct pitch
- [ ] Live feedback shows red for incorrect pitch

### 4. Grading System
- [ ] Pitch score calculated (correct swar %)
- [ ] Tuning score calculated (within 50 cents %)
- [ ] Rhythm score calculated (within timing window %)
- [ ] Completion score calculated (swars attempted %)
- [ ] Overall score is weighted average
- [ ] Mistakes list shows incorrect swars

### 5. Session Flow
- [ ] Demo mode plays exercise without listening
- [ ] Practice mode plays and listens simultaneously
- [ ] Count-in plays before exercise starts
- [ ] Session report displays after completion
- [ ] Recommendation provided based on score
- [ ] "Practice Again" restarts same exercise

---

## Failure Criteria (Safe Behavior)

### Audio Failures
- [ ] No audio context: Shows "Tap to enable audio" message
- [ ] Audio init fails: Shows friendly error, app remains usable
- [ ] Audio playback fails: Logs error, stops session gracefully

### Microphone Failures
- [ ] Permission denied: Shows clear message, allows demo-only mode
- [ ] Mic not available: Shows error, suggests checking settings
- [ ] Pitch detection fails: Skips grading, shows partial results

### Data Failures
- [ ] Exercise JSON fails to load: Shows error, retry button
- [ ] Invalid exercise data: Skips invalid, shows available exercises
- [ ] Corrupted taal data: Falls back to basic taal or no taal

### Browser Compatibility
- [ ] Web Audio not supported: Shows browser upgrade message
- [ ] MediaDevices not supported: Allows demo-only mode

---

## Out of Scope (v1)
- Recording and playback of user sessions
- Multiple exercise selection for playlist
- Cloud sync of progress
- Social features (sharing scores)
- Custom exercise creation
- Komal/Tivra swar variations in grading (treated as separate swaras)
- Support for taals beyond Teentaal, Dadra, Keharwa
- Flutter/mobile implementation (separate acceptance doc)

---

## Test Coverage Requirements

### Unit Tests
- `ExerciseManager.flattenExercise()` - produces correct swar sequence
- `PitchDetector.freqToSwar()` - maps frequencies to swaras correctly
- `RobotListener.generateReport()` - calculates scores correctly
- Swar frequency ratios match Just Intonation

### Integration Tests
- Exercise JSON loads and parses correctly
- Audio engine initializes in test environment
- Pitch detection with synthetic sine waves

### E2E Tests (Playwright)
- Navigate to Sadhana section
- Browse exercises by category
- Open exercise detail
- Start demo mode
- Start practice mode (with mocked mic)
- View session report
- Verify score display

---

## Test Data
- Synthetic sine waves at known frequencies for pitch tests
- Mock exercise JSON with minimal valid structure
- Deterministic random seed for audio synthesis tests

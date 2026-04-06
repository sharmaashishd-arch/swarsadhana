# Sadhana - Developer Guide

## Overview

Sadhana is an automated practice system for Hindustani classical music. It includes:

1. **Exercise Library** - Structured JSON-based exercise definitions
2. **Robot Player** - Auto-plays exercises with tanpura + tabla + swar synthesis
3. **Robot Listener** - Pitch detection and grading system
4. **Session Flow** - Demo → Practice → Score workflow
5. **Guruji** - AI Tutor Mode with vocal synthesis and self-test harness

## Guruji (Tutor Mode)

Guruji extends Sadhana with an AI tutor that **sings** the exercises:

### Features
- **Vocal Swar Synthesis** - Voice-like singing using formant synthesis + vibrato
- **Tutor Flow** - Robot Demo → User Repeat → Grade → Report
- **Self-Test Harness** - Robot grades its own audio for automated testing

### User Flow
1. Select an exercise from the library
2. Click **"Start Tutor Mode"** or **"🎵 Robot Demo"**
3. Robot sings the swar sequence with tanpura + tabla accompaniment
4. After demo, click **"🎤 Your Turn"** to sing along
5. Robot listens, detects pitch, and grades performance
6. View detailed results with per-swar analysis

### Self-Test (Developer Mode)
Click **"🧪 Self-Test"** to:
1. Render robot audio offline using OfflineAudioContext
2. Feed rendered audio through pitch detection pipeline
3. Grade detected pitches against expected swars
4. Assert ≥95% score (verifies end-to-end correctness)

This enables automated testing without human singing.

## Architecture

### Web Version
```
web/
├── js/
│   ├── realistic-audio-engine.js   # Tanpura, Tabla, Swar synthesis
│   ├── robot-riyaaz.js             # Core logic (ExerciseManager, RobotPlayer, PitchDetector)
│   ├── robot-riyaaz-ui.js          # UI components
│   └── robot-guruji.js             # Tutor Mode (VocalSwarSynth, GradingEngine, SelfTestHarness)
├── css/
│   ├── robot-riyaaz.css            # Sadhana styles
│   └── robot-guruji.css            # Tutor Mode styles
├── tests/
│   ├── unit/
│   │   ├── grading-engine.test.js  # Grading logic tests
│   │   └── pitch-detector.test.js  # Pitch detection tests
│   ├── integration/
│   │   └── self-test-harness.test.js  # Loopback self-test
│   └── e2e/
│       └── tutor-mode.spec.js      # E2E Tutor Mode tests
└── assets/exercises/
    └── hindustani_class1.json      # Exercise definitions
```

### Flutter Version
```
lib/features/robot_riyaaz/
├── models/
│   ├── exercise.dart               # Exercise, Taal, Swar models
│   └── grading.dart                # GradeResult, SessionReport models
├── providers/
│   └── robot_riyaaz_provider.dart  # State management
├── services/
│   └── pitch_detector.dart         # Pitch detection service
└── screens/
    └── robot_riyaaz_screen.dart    # UI screens
```

## Adding New Exercises

### Exercise JSON Format

Exercises are stored in `assets/exercises/hindustani_class1.json`:

```json
{
  "version": "1.0",
  "title": "My Exercise Collection",
  "categories": ["Basic Sargam", "Alankar", "Custom"],
  "taals": {
    "TEENTAAL_16": {
      "id": "TEENTAAL_16",
      "name": "Teentaal",
      "nameHindi": "तीनताल",
      "beats": 16,
      "vibhag": [4, 4, 4, 4],
      "sam_beat": 1,
      "tali_beats": [1, 5, 13],
      "khali_beats": [9],
      "bols": ["धा", "धिं", "धिं", "धा", ...]
    }
  },
  "swaras": {
    "Sa": { "semitone": 0, "hindi": "सा" },
    "Re": { "semitone": 2, "hindi": "रे" },
    ...
  },
  "exercises": [...]
}
```

### Exercise Structure

```json
{
  "id": "UNIQUE_ID",
  "title": "Exercise Title",
  "category": "Basic Sargam",
  "description": "Optional description",
  "raga_mode": "neutral",
  "taal_id": "TEENTAAL_16",
  "tempo_bpm": 60,
  "swars_per_beat": 1,
  "playback_plan": {
    "repeat_count": 2,
    "direction": "both",
    "count_in_beats": 4
  },
  "aaroh": ["Sa", "Re", "Ga", "Ma", "Pa", "Dha", "Ni", ".Sa"],
  "avroh": [".Sa", "Ni", "Dha", "Pa", "Ma", "Ga", "Re", "Sa"]
}
```

### Swar Notation

| Swar | Notation | Description |
|------|----------|-------------|
| Sa | `Sa` | Shadja (tonic) |
| Re (komal) | `re` | Komal Rishabh (flat 2nd) |
| Re (shuddh) | `Re` | Shuddh Rishabh |
| Ga (komal) | `ga` | Komal Gandhar (flat 3rd) |
| Ga (shuddh) | `Ga` | Shuddh Gandhar |
| Ma (shuddh) | `Ma` | Shuddh Madhyam |
| Ma (tivra) | `ma` | Tivra Madhyam (sharp 4th) |
| Pa | `Pa` | Pancham (perfect 5th) |
| Dha (komal) | `dha` | Komal Dhaivat |
| Dha (shuddh) | `Dha` | Shuddh Dhaivat |
| Ni (komal) | `ni` | Komal Nishad |
| Ni (shuddh) | `Ni` | Shuddh Nishad |
| Upper Sa | `.Sa` | Upper octave Sa |
| Lower Sa | `Sa.` | Lower octave Sa |
| Rest | `-` | Silence/rest |

### Exercise Variations

**Simple aaroh/avroh:**
```json
{
  "aaroh": ["Sa", "Re", "Ga", "Ma", "Pa", "Dha", "Ni", ".Sa"],
  "avroh": [".Sa", "Ni", "Dha", "Pa", "Ma", "Ga", "Re", "Sa"]
}
```

**Phrase-based:**
```json
{
  "aaroh_phrases": [
    ["Sa", "Re", "Ga", "Ma"],
    ["Pa", "Dha", "Ni", ".Sa"]
  ]
}
```

**Group-based (Janti):**
```json
{
  "aaroh_groups": [
    ["Sa", "Sa", "Re", "Re", "Ga", "Ga", "Ma", "Ma"],
    ["Re", "Re", "Ga", "Ga", "Ma", "Ma", "Pa", "Pa"]
  ]
}
```

## Adding New Taals

```json
{
  "MY_CUSTOM_TAAL": {
    "id": "MY_CUSTOM_TAAL",
    "name": "Custom Taal",
    "nameHindi": "कस्टम ताल",
    "beats": 7,
    "vibhag": [3, 2, 2],
    "sam_beat": 1,
    "tali_beats": [1, 4],
    "khali_beats": [6],
    "bols": ["धा", "धी", "ना", "धा", "धी", "ना", "धा"]
  }
}
```

## Audio Synthesis

### Tanpura (realistic-audio-engine.js)
- Karplus-Strong synthesis with jivari effect
- Rich harmonic series (12 harmonics)
- Sympathetic resonance simulation
- LFO modulation for characteristic buzz

### Tabla (realistic-audio-engine.js)
- Physical modeling for bayan (bass) and dayan (treble)
- Pitch bend for characteristic sound
- Noise burst for attack transient
- Separate synthesis per bol type

### Swar Synthesis (realistic-audio-engine.js)
- Formant synthesis for vocal-like sound
- Harmonium mode with reed simulation
- Vibrato and tremolo effects

### Vocal Swar Synthesis (robot-guruji.js)
Guruji uses `VocalSwarSynth` for deterministic, voice-like singing:

```javascript
// Glottal pulse source with custom periodic wave
const harmonics = 12;
const real = new Float32Array(harmonics + 1);
for (let h = 1; h <= harmonics; h++) {
    real[h] = 1 / Math.pow(h, 1.2);  // Harmonic rolloff
}
const wave = ctx.createPeriodicWave(real, imag);

// Formant filters (vocal tract)
const formants = { f1: 800, f2: 1200, f3: 2500 };  // "आ" vowel

// Deterministic vibrato (for testing)
const vibratoRate = 5.5;  // Hz
const vibratoDepth = 0.006;  // % of fundamental
```

## Self-Test Harness

The `SelfTestHarness` class enables automated testing without human input:

### How It Works
1. **Render Offline**: Use `OfflineAudioContext` to render robot's swar sequence
2. **Detect Pitches**: Run YIN algorithm on rendered buffer
3. **Grade**: Compare detected pitches against expected events
4. **Assert**: Verify ≥95% score

### Usage
```javascript
const harness = new SelfTestHarness();
const events = [
    { swar: 'Sa', beatIndex: 0 },
    { swar: 'Re', beatIndex: 1 },
    { swar: 'Ga', beatIndex: 2 },
    { swar: 'Ma', beatIndex: 3 }
];

const result = await harness.runSelfTest(events, 60, 261.63);
console.log(result.passed);  // true if score >= 95%
console.log(result.results.scores.overall);  // e.g., 100
```

### Running Self-Test in Browser
1. Open exercise detail view
2. Click **"🧪 Self-Test"** button
3. Watch progress: Rendering → Detecting → Grading
4. View PASS/FAIL result with detailed breakdown

## Pitch Detection

### Web (robot-riyaaz.js)
- YIN algorithm for accurate pitch detection
- Just Intonation frequency ratios
- Cents error calculation
- Sa calibration support

### Flutter (pitch_detector.dart)
- Same YIN algorithm
- Platform-agnostic implementation
- Microphone permission handling
- Simulation mode for testing

## Grading System

### Metrics
- **Pitch Score**: % of correct swars detected
- **Tuning Score**: % within 50 cents of target
- **Rhythm Score**: % within 200ms timing window
- **Completion Score**: % of exercise attempted

### Overall Score
```
overall = pitch * 0.4 + tuning * 0.2 + rhythm * 0.3 + completion * 0.1
```

## Testing

### Run Web Tests
```bash
cd web
npm install

# Unit & Integration tests (Vitest)
npm test                    # All tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only

# E2E tests (Playwright)
npm run e2e                # Run in headless mode
npm run e2e:headed         # Run with browser visible
npm run e2e:ui             # Interactive UI mode
```

### Test Files
- `web/tests/unit/exercise-manager.test.js` - Exercise parsing tests
- `web/tests/unit/pitch-detector.test.js` - Pitch detection tests
- `web/tests/unit/grading-engine.test.js` - Grading logic tests
- `web/tests/integration/self-test-harness.test.js` - Loopback self-test
- `web/tests/e2e/tutor-mode.spec.js` - E2E Tutor Mode flow

### Self-Test Validation
The integration tests verify that the robot can detect its own singing:

```bash
npm run test:integration
```

Expected output:
- Tone generation and detection tests
- Sequence rendering and detection (≥75% score)
- Negative test: detuned audio should score lower

## Customization

### Changing Synthesis Parameters

In `realistic-audio-engine.js`:
- `jivariAmount`: 0-1, tanpura buzz intensity
- `tanpuraVolume`: 0-1, drone volume
- `tablaVolume`: 0-1, percussion volume
- `swarSynth.voiceType`: 'vocal' or 'harmonium'

### Grading Thresholds

In `robot-riyaaz.js` or `robot_riyaaz_provider.dart`:
- `centsThreshold`: 50 cents default (in-tune tolerance)
- `timingWindowMs`: 200ms default (rhythm tolerance)

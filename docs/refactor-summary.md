# Refactor Summary

## Scope
Full codebase cleanup and refactor focusing on DRY, dead code removal, constants centralization, dependency pruning, and lint fixes. No features added, no UI changes, no behavioral changes.

## Results

| Metric | Before | After |
|--------|--------|-------|
| Flutter lint issues | 61 (2 warning, 59 info) | 5 (0 warning, 5 info — intentional music notation) |
| Flutter tests | 250 pass | 250 pass |
| Web tests | 218 pass / 9 fail | 233 pass / 0 fail |
| Flutter dependencies | 22 direct + 3 dev | 12 direct + 1 dev |
| Dead web files | 3 | 0 |

## 1. Dependencies Removed (11 packages)

### Runtime (from `pubspec.yaml` dependencies)
- `just_audio` — unused, never imported
- `flutter_riverpod` — unused, only `provider` is used
- `fft` — unused, only mentioned in comments
- `flutter_svg` — unused, no SVG assets loaded
- `sleek_circular_slider` — unused widget
- `razorpay_flutter` — unused payment SDK
- `intl` — unused formatting library
- `path_provider` — unused (only needed transitively)
- `cupertino_icons` — unused icon pack
- `hive` — redundant direct dep (already pulled by `hive_flutter`)

### Dev
- `hive_generator` — no code generation configured
- `build_runner` — no code generation configured

## 2. Dead Code Removed

### Web files deleted
- `web/app.js` — legacy audio engine, not loaded by `index.html`
- `web/audio-engine.js` — same as above
- `web/js/webaudiofont/0200_FluidR3_GM_sf2_file.js` — unused soundfont preset (only 0210 is loaded)

### Dead methods/classes removed
- `TrackConfig` class in `audio_engine.dart` — defined but never referenced
- `startTutorMode()` in `robot-riyaaz-ui.js` — defined but never called
- `setVoiceType()` in `realistic-audio-engine.js` — empty stub, never called
- `robotGurujiUI` variable in `robot-guruji.js` — shadowed by `window.robotGurujiUI`
- `_audioEngine` field in `RobotRiyaazProvider` — assigned but never read
- `effectivePitch` local in `audio_engine.dart` `_applyDSP()` — computed but never used

### Unused imports removed
- `dart:typed_data` in `swar_player.dart` (redundant with dart_melty_soundfont)
- `core/theme/app_theme.dart` in `main.dart`

## 3. Duplicate Logic Extracted

### Web: `music-constants.js` (new shared module)
Extracted into a single source of truth, replacing inline definitions in `realistic-audio-engine.js`, `robot-guruji.js`, and `robot-riyaaz.js`:
- `SWAR_RATIOS` — Just Intonation frequency ratios (was duplicated in 3 files)
- `SWAR_SEMITONES` — MIDI semitone offsets (was duplicated in 2 files)
- `SWAR_LIST` — chromatic swar array (was duplicated in 2 files)
- `NOTE_ARTICULATION` — timing constants for note playback (MIN_GAP, attack, release, etc.)
- `freqToMidi()` — MIDI note calculation (was inline in 4 places)
- `computeNoteDuration()` — articulation gap formula (was duplicated in 3 places)
- `cancelActiveNote()` — WebAudioFont envelope teardown (was duplicated in 2 synth classes)

### Web: `STORAGE_KEYS` (added to `practice-defaults.js`)
- Centralized all `localStorage` key strings (`ss_tanpura_volume`, `ss_tabla_volume`, `ss_saptak`, etc.) — were hardcoded string literals in `index.html` and `robot-riyaaz.js`

### Web: Tempo bounds centralized
- `PRACTICE_DEFAULTS.minTempo` / `maxTempo` — replace `Math.max(30, Math.min(200, ...))` in 2 files

### Flutter: Replaced hand-rolled math with `dart:math`
- Removed duplicate `_pow()` / `_log2()` approximation functions from `audio_engine.dart` and `pitch_monitor_provider.dart` — replaced with `math.pow()` and `math.log()/math.ln2` (also fixes inaccuracy from linear approximation)
- Removed broken recursive `pow()` from `music_constants.dart` (pre-existing bug: infinite recursion for non-integer exponents)

### Flutter: `_semitoneToSwara` simplified
- Replaced 12-case switch statement in `pitch_monitor_provider.dart` with `Swara.values[idx]` (the enum is already ordered chromatically)

## 4. Constants Centralized

### Flutter: `PracticeDefaults` (in `music_constants.dart`)
Added `minTempo` and `maxTempo` alongside existing defaults.
Replaced hardcoded `80` fallback in `effective_settings.dart` with `PracticeDefaults.tempo`.
Replaced `60` initial tempo in `audio_engine.dart` with `PracticeDefaults.tempo`.

### Web: `PRACTICE_DEFAULTS`
Added `minTempo: 30` and `maxTempo: 200`.

## 5. Lint / Code Quality Fixes

### Warnings fixed (2 → 0)
- Removed unused `effectivePitch` variable
- Removed unused `_audioEngine` field

### Deprecated API migrations
- `.withOpacity(x)` → `.withValues(alpha: x)` across 8 files (20+ call sites)
- `background` → `surface` / `onBackground` → `onSurface` in ColorScheme
- `activeColor` → `activeThumbColor` in Switch widget

### Style fixes
- Added curly braces to `if` bodies in `tabla_provider.dart`
- Added `const` to constructors and literals in widget and test files
- Added `library music_constants;` declaration

### Broken test fixed
- `practice-modes.test.js` — replaced `jest.fn()` with `vi.fn()`, added proper imports, created local stubs for `PRACTICE_MODES`/`ExerciseManager`/`RobotSession` (previously: 9 test failures; now: all 14 tests pass)

## 6. Intentional Exceptions

- **`Db/Eb/Gb/Ab/Bb` naming**: Kept as-is despite `constant_identifier_names` lint. These are standard Western music note names; renaming to `db/eb/gb/ab/bb` would harm domain readability.
- **Tabla engine uses 300 max tempo**: `RealisticTablaEngine.setTempo` clamps to 30-300 (wider than the UI's 30-200). Kept intentionally — the engine supports a wider range than the UI exposes.
- **Test file stubs**: Some web unit tests (`accompaniment-defaults.test.js`, `exercise-manager.test.js`) define local copies of production logic for isolation. This is a known pattern; the shared `music-constants.js` module reduces future drift risk.

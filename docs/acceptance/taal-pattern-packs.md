# Taal Pattern Packs — Acceptance Criteria

## Success Criteria

### Registry
- `taal_definitions` registry exists on both web (JS) and Flutter (Dart) with fields: beats, vibhag, sam, tali beats, khali beats
- `theka_patterns` registry maps taal_id → bol sequence per beat
- Registries are the single source of truth for all taal data

### Taals Implemented
- Teentaal: 16 beats, vibhag [4,4,4,4], sam=1, tali=[1,5,13], khali=[9]
- Keharwa: 8 beats, vibhag [4,4], sam=1, tali=[1], khali=[5]
- Dadra: 6 beats, vibhag [3,3], sam=1, tali=[1], khali=[4]
- Rupak: 7 beats, vibhag [3,2,2], sam=1, tali=[4,6], khali=[1]
- Jhaptaal: 10 beats, vibhag [2,3,2,3], sam=1, tali=[1,3,8], khali=[6]

### Accent Model
- Sam beat (beat 0) gets strongest accent (gain 1.3×)
- Tali beats get medium accent (gain 1.1×)
- Khali beats get lighter accent (gain 0.85×)
- Normal beats get neutral accent (gain 1.0×)

### Audio Engine
- Existing one-shot WAV sample sequencer unchanged
- Scheduling mechanism (look-ahead pump on web, drift-corrected Timer on Flutter) unchanged
- Only the taal data fed into the engine changes

### UI (both web and Flutter)
- Dropdown/selector to choose taal
- Vibhag grid displays each beat grouped by vibhag
- Sam beats marked (X or special color)
- Tali beats marked (beat number or indicator)
- Khali beats marked (० or wave indicator)
- Active beat highlighted during playback

### Tests
- Pattern length (bols.length) matches beats for every taal
- Sam/tali/khali beat indices are valid (1-based, within beat count)
- No duplicate indices across tali and khali arrays
- Sequencer produces correct number of beat events per avartan (one per matra)
- All theka bols resolve to valid sample names

## Failure Criteria

- Any taal whose bols array length differs from its beats count
- Sam/tali/khali indices outside [1, beats] range
- Audio engine scheduling changed (must remain one-shot sample based)
- A taal plays but the accent model does not differentiate sam/tali/khali
- UI does not show vibhag groupings or markers
- Web and Flutter registries have different taal definitions

## Out of Scope

- Adding new tabla WAV samples
- Changing the tabla audio engine from samples to synthesis
- Custom/user-defined taals
- Tabla recording or playback features

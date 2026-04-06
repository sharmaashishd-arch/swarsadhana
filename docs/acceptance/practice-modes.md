# Practice Modes — Acceptance Criteria

## Feature
Three user-facing practice modes replacing old Watch Demo / Practice / Guruji buttons.

## Modes

### Sing Along (DEFAULT)
- Robot plays swar sequence in continuous loop
- User sings along
- Grading runs optionally in background
- Report shown when user taps Stop

### Guided Practice
- Count-in (1 avartan)
- Robot demo (1 avartan — "Watch & Listen")
- User practice (graded — "Your turn!")
- Grading report auto-generated on completion

### Self Practice
- Accompaniment only (tanpura + tabla)
- Beat cursor advances visually
- No robot swar playback
- No grading

## Success Criteria

1. **Default mode is Sing Along** — on exercise detail, "Sing Along" is pre-selected in the mode segmented control.
2. **Default BPM is 80** — all exercises default to 80 BPM.
3. **Mode selector visible** — three-button segmented control appears on exercise detail (Web + Flutter).
4. **Old buttons removed** — "Watch Demo", "Practice with Robot", and "Guruji Tutor Mode" buttons are no longer visible.
5. **Single Start button** — one start button replaces old dual buttons.
6. **Accompaniment toggles** — Tanpura ON/OFF and Tabla ON/OFF chips are interactive and control audio.
7. **Tabla OFF keeps beat cursor** — turning tabla off still shows visual beat advancement.
8. **Tanpura OFF stops drone only** — other audio continues.
9. **Sing Along loops** — swar playback loops until user stops.
10. **Sing Along report on stop** — if grading data available, report shown on stop.
11. **Guided Practice flow** — count-in → demo → practice → report in sequence.
12. **Self Practice: no swar** — no robot swar playback, accompaniment only.
13. **Exercise defaults JSON** — every exercise has a `defaults` block with `default_mode`, `recommended_taal_id`, `recommended_bpm`, `recommended_notes_per_beat`.
14. **Resolution function** — `resolveSettings()` merges exercise defaults (future: global + overrides).
15. **Cross-platform parity** — all features work identically on Web, iOS, and Android.

## Failure Criteria

1. Default mode is not Sing Along.
2. BPM defaults to 60 instead of 80.
3. Old buttons (Watch Demo, Practice with Robot, Guruji) still appear.
4. Accompaniment toggles are not interactive.
5. Self Practice mode plays robot swar.
6. Guided Practice skips demo phase or practice phase.
7. Exercise JSON is missing `defaults` block.

## Out of Scope

- Practice Setup global settings page (separate feature)
- Per-exercise override persistence
- New instruments
- Payment/pro gating

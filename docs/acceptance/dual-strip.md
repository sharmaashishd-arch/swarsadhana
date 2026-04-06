# Dual Strip (Beat + Swar) — Acceptance Criteria

## Feature Summary

Replace the single unified swar strip with two synchronized strips:
1. **Beat/Taal Strip** (top) — shows the unchanging rhythm grid (matras)
2. **Swar Strip** (bottom) — shows notes subdivided within each beat

## Success Criteria

### Beat Strip
- [ ] Renders one cell per matra for the exercise's taal (e.g., 16 for Teentaal)
- [ ] Each cell displays: beat number, Sam/Tali/Khali marker, bol label
- [ ] Sam marked with "X", Tali with "|", Khali with "०"
- [ ] A beat-level playhead highlights the current beat cell during playback
- [ ] Beat strip does NOT change when subdivision changes

### Swar Strip
- [ ] For each beat, renders N subcells where N = subdivision (1, 2, or 4)
- [ ] Swars placed sequentially into subcells
- [ ] Swar-level playhead highlights the current subcell during playback
- [ ] When subdivision changes, subcell count per beat updates accordingly
- [ ] Empty trailing subcells rendered as rest placeholders

### Synchronization
- [ ] Both strips driven by the same transport clock (AudioContext timing)
- [ ] Strips scroll together horizontally
- [ ] Beat playhead advances once per beat; swar playhead advances once per subdivision
- [ ] At BPM=60, subdivision=2: swar playhead visits 2 subcells per beat (500ms each)
- [ ] Phase alignment: both strips start at Sam (t0)

### Controls
- [ ] BPM slider (30–120) controls beat speed for both strips
- [ ] Notes-per-beat selector (1x / 2x / 4x) controls subdivision
- [ ] Subdivision selector available on detail and session screens
- [ ] Changing BPM reschedules both strips equally
- [ ] Changing subdivision only changes swar strip layout (beat strip unchanged)

### Count-in
- [ ] Count-in plays 1 avartan of beat strip + tabla + tanpura
- [ ] Swar demo starts exactly on Sam after count-in

## Failure Criteria
- [ ] Changing subdivision must NOT change beat strip length or beat cursor timing
- [ ] Changing subdivision must NOT desync tabla from beat grid
- [ ] BPM change must NOT cause strips to go out of sync
- [ ] Missing taal data must not crash — degrade gracefully to a simple strip

## Out of Scope
- Theme redesign
- New features beyond the two-strip system
- Flutter/mobile implementation (web only for now)
- Changes to Guruji strip (separate component)

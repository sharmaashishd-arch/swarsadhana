# TablaKit — Acceptance Criteria

## Summary
Replace synthesized tabla sounds with sample-based one-shot playback using physically-modeled WAV samples. Zero attribution required.

## Success Criteria

### Samples & Licensing
- [ ] 7 bols × 2 variants = 14 WAV files exist at `assets/audio/tabla/oneshots/<bol>/v{1,2}.wav`
- [ ] All bols covered: dha, dhin, tin, na, ta, ge, ke
- [ ] manifest.json validates: every entry has `attribution_required: false`
- [ ] manifest.json validates: every license is in allowed set (CC0, generated-no-license-needed, pixabay-content-license, samplefocus-royalty-free)
- [ ] Web assets mirror Flutter assets (identical files in `web/assets/audio/tabla/oneshots/`)
- [ ] Validation script exits 0

### Web Engine
- [ ] `RealisticTablaEngine` loads 14 WAV samples on `start()`
- [ ] Bols are mapped correctly: Devanagari and ASCII strings resolve to the right sample
- [ ] Round-robin alternates v1/v2 per bol across successive beats
- [ ] Accent gain: sam=1.3×, tali=1.1×, normal=1.0×, khali=0.85×
- [ ] Look-ahead scheduling with AudioContext.currentTime (25ms pump, 100ms lookahead)
- [ ] No setInterval-based sound generation (only pump interval for scheduler)

### Flutter Engine
- [ ] TablaProvider loads 14 WAV one-shots via SoLoud
- [ ] Drift-corrected Stopwatch + Timer scheduling (no Timer.periodic)
- [ ] Round-robin v1/v2 per bol
- [ ] Accent gain: sam=1.3×, tali=1.1×, normal=1.0×, khali=0.85×
- [ ] Public API unchanged: play/stop/toggle/setTempo/setVolume/setTaal all preserved

### Audio Quality
- [ ] Teentaal theka is clearly recognizable as tabla by ear
- [ ] Does not sound like a metronome (has timbral variation per bol)
- [ ] Works at BPM 60–120 without time-stretch artifacts
- [ ] Natural resonance tail preserved (no hard cuts)

## Failure Criteria
- Any sample has `attribution_required: true` → validation fails
- Missing WAV file for any bol/variant → validation fails
- Unknown license in manifest → validation fails
- Beat timing drifts audibly at BPM 120 over 4 avartans → sequencer broken
- Samples clip or distort at sam accent → gain too high

## Out of Scope
- UI redesign
- New instruments
- Time-stretching individual samples for pitch/tempo
- Recording real tabla (using synthesis)
- Pro/payment gating

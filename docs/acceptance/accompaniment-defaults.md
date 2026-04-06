# Accompaniment Defaults - Acceptance Criteria

## Success Criteria

1. Exercise JSON includes `accompaniment_defaults` with tanpura + tabla settings
2. Both web and Flutter parsers correctly read and expose these defaults
3. Opening any exercise detail shows accompaniment badges (Tanpura ON, Taal ON)
4. Starting Watch Demo / Practice / Tutor Mode automatically starts:
   - Tanpura at configured volume (0.55)
   - Tabla at configured volume (0.65) with exercise's taal
5. Accompaniment starts during count-in, continues through demo/practice
6. Stopping a session cleanly stops tanpura + tabla (no overlapping audio)
7. Starting a new session while one is running first stops the previous one
8. BPM from exercise defaults is applied to tabla
9. Behavior is consistent across web, iOS, and Android

## Failure Criteria

1. Session starts without tanpura/tabla when defaults say enabled=true
2. Volume levels don't match configured defaults
3. Audio overlaps between sessions (old session audible when new starts)
4. Parser crashes on missing `accompaniment_defaults` (must use fallbacks)

## Out of Scope

- Per-exercise accompaniment overrides (future)
- Tanpura pattern switching (always PaSa for now)
- New tanpura samples
- UI controls to toggle accompaniment on/off during session

# Audio Quality Parity (Flutter ↔ Web)

## Success Criteria

- **SC-1**: Flutter AudioEngine applies a global FreeverbFilter reverb on initialization.
- **SC-2**: Flutter master volume is 0.8, matching the web's `masterGain.gain.value = 0.8`.
- **SC-3**: SwarPlayer renders stereo (2-channel) WAV instead of mono.
- **SC-4**: SwarPlayer note volume is 0.6, matching the web's `RealisticSwarSynth.volume`.
- **SC-5**: Tabla default volume is ~0.55, producing an effective level close to the web's 0.448 (0.8 * 0.7 * 0.8).
- **SC-6**: Tanpura default volume (0.7) remains unchanged; effective level matches web's 0.56 (0.7 * 0.8).

## Failure Criteria

- **FC-1**: Reverb fails to activate silently without crashing the app; audio still plays dry.
- **FC-2**: `flutter analyze` reports no new errors after changes.
- **FC-3**: iOS simulator build succeeds (`flutter build ios --simulator --no-codesign`).

## Out of Scope

- Per-source reverb routing (web uses dry bus for tabla vs wet for swar/tanpura)
- Independent pitch/tempo control (requires platform channels to AVAudioEngine)
- Just Intonation tuning (both platforms already use equal-temperament MIDI)
- Web-side changes (web audio is the quality reference)

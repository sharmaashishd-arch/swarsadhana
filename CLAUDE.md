# SwarSadhana — Claude Code guidance

Indian classical music education — ships as **three apps from one repo**:
- **Flutter** (iOS + Android): `lib/`, assets in `assets/`
- **Standalone web** (PWA): `web/` — vanilla HTML/JS/CSS, **not** Flutter-web

## Commands

```bash
# Flutter
flutter analyze
flutter test
flutter test integration_test/                    # all integration
flutter test integration_test/foo_test.dart       # single
flutter build ios --simulator --no-codesign
flutter build apk --debug

# Web
cd web && npx vitest run
cd web && npx playwright test                     # headless
cd web && npx playwright test --headed
```

Playwright `webServer` auto-starts `python3 -m http.server 8080`.

## Cross-platform parity (non-negotiable)

- Every user-facing feature must work on **all three platforms** — implement in both Flutter code AND web JS.
- Swara look-ahead strip, tanpura controls, exercise UI must behave consistently.
- Tanpura MP3 drones live in **both** `assets/audio/tanpura/` (Flutter) **and** `web/assets/audio/tanpura/` (web). When adding/modifying audio assets, update both locations. Verify: `diff <(ls assets/audio/tanpura/) <(ls web/assets/audio/tanpura/)`. Document every audio asset in `assets/licenses.md`.

## Sound engine mapping

| Feature | Flutter (iOS/Android) | Web (standalone) |
|---------|----------------------|-------------------|
| Swar demo | `dart_melty_soundfont` + `harmonium.sf2` | WebAudioFont Accordion preset |
| Tanpura drone | MP3 loops via `flutter_soloud` | MP3 loops via Web Audio API |
| Tabla | Sample-based via `flutter_soloud` | Synthesized via Web Audio API |

## Flutter conventions

- **Provider** for state management.
- **Hive** for local persistence; **shared_preferences** for simple KV.
- **flutter_soloud** for audio playback; **dart_melty_soundfont** for MIDI rendering.

## Web sub-app

- Vanilla JS — TypeScript is **explicitly opted out**.
- Separate `package.json` with Vitest + Playwright + ESLint.
- Dev server: `python3 -m http.server` or any static server.

## E2E selectors

- **Web (Playwright)** in `web/tests/e2e/<feature>.spec.js`: `getByRole` / `getByLabel` / `getByText` → `locator('text=...')` → CSS class (last resort).
- **Flutter** in `integration_test/<feature>_test.dart`: `find.byKey(Key('...'))` → `find.text('...')` → `find.byType(WidgetType)`.

Web test setup pattern — wait for `.main-nav` + click `#audio-status` before user interaction. Flutter: `IntegrationTestWidgetsFlutterBinding.ensureInitialized()`, then `app.main()` + `tester.pumpAndSettle()`.

## When to write which E2E

| Change touches… | Web E2E | Flutter E2E |
|---|---|---|
| `web/` only | Yes | No |
| `lib/` only | No | Yes |
| Both (feature parity) | Yes | Yes |
| Shared assets only | Yes | Yes |

## Fail-safe requirement

On dependency failure: friendly toast, app stays usable, log with error ID. Add tests for each scenario.

## Operating mode

User is a product person, not a tester. Define success/failure criteria and write automated tests — never ask the user to manually verify UI.

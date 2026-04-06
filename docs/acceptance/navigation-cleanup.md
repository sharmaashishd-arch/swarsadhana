# Navigation Cleanup — Acceptance Criteria

## Success Criteria

1. **Exercise-first home screen**: App opens directly to the exercise browser (Sadhana) on both web and Flutter.
2. **No Instruments tab/page visible**: There is no "Instruments" tab, button, or navigation item in the UI on any platform.
3. **Practice Setup accessible via gear icon**: Tapping the gear/settings icon in the header opens a Practice Setup page/modal with:
   - Sa (Key) picker
   - Default BPM slider (defaults to 80)
   - Tanpura pattern selector (Pa-Sa / Ma-Sa / Ni-Sa)
   - Tanpura volume control
   - Jivari (Buzz) control (web only)
   - Tabla default taal selector
   - Tabla volume control
   - Collapsed Diagnostics section containing Test Audio (web) or info text (Flutter)
4. **Settings affect sessions**: Changing Sa/key or BPM in Practice Setup is reflected when starting an exercise session.
5. **All existing exercises work**: Browsing, selecting, and starting exercises (all modes) still works correctly.

## Failure Criteria

1. "Instruments" tab or page is visible anywhere in the UI.
2. Practice Setup is inaccessible (gear icon missing or non-functional).
3. Any previously-working exercise flow breaks (cannot start session, cannot play swar, cannot hear tanpura/tabla).
4. Audio diagnostics (Test Audio) is exposed as a main page element instead of inside a collapsed Diagnostics section.

## Out of Scope

- Saptak selector (not implemented on either platform yet)
- First-run onboarding flow
- Persisting Practice Setup settings across sessions (future)
- Pro feature gating inside Practice Setup

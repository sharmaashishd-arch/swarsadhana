# Audio Asset Licenses

## Tanpura Drones

**Source:** [Raga Junglism - Tanpura Samples](https://ragajunglism.org/ragas/tanpuras/)
**Author:** George Howlett (Raga Junglism)
**License:** Open-access ("Like everything on my site, these tanpuras will always remain 100% open-access and ad-free.")
**Note:** No formal SPDX/CC license specified. Contact the author via [ragajunglism.org](https://ragajunglism.org/ragas/feedback/) for explicit redistribution terms before commercial distribution.

### Sa-Pa (Perfect 5th) Drones — Pa-Sa-Sa-Sa tuning

| File | Key | Source URL |
|------|-----|-----------|
| `pa_sa_c.mp3` | C (~130.8 Hz) | https://ragajunglism.org/wp-content/uploads/2020/03/c-tanpura-thick.mp3 |
| `pa_sa_db.mp3` | C# (~138.6 Hz) | https://ragajunglism.org/wp-content/uploads/2020/03/db-tanpura-thick.mp3 |
| `pa_sa_d.mp3` | D (~146.8 Hz) | https://ragajunglism.org/wp-content/uploads/2020/03/d-tanpura-thick.mp3 |
| `pa_sa_eb.mp3` | D# (~155.6 Hz) | https://ragajunglism.org/wp-content/uploads/2020/03/eb-tanpura-thick.mp3 |
| `pa_sa_e.mp3` | E (~164.8 Hz) | https://ragajunglism.org/wp-content/uploads/2020/03/e-tanpura-thick.mp3 |
| `pa_sa_f.mp3` | F (~174.6 Hz) | https://ragajunglism.org/wp-content/uploads/2020/03/f-tanpura-thick.mp3 |
| `pa_sa_gb.mp3` | F# (~92.5 Hz) | https://ragajunglism.org/wp-content/uploads/2020/03/gb-tanpura-thick.mp3 |
| `pa_sa_g.mp3` | G (~98 Hz) | https://ragajunglism.org/wp-content/uploads/2020/03/g-tanpura-thick.mp3 |
| `pa_sa_ab.mp3` | G# (~103.8 Hz) | https://ragajunglism.org/wp-content/uploads/2020/03/ab-tanpura-thick.mp3 |
| `pa_sa_a.mp3` | A (=110 Hz) | https://ragajunglism.org/wp-content/uploads/2020/03/a-tanpura-thick.mp3 |
| `pa_sa_bb.mp3` | A# (~116.5 Hz) | https://ragajunglism.org/wp-content/uploads/2020/03/bb-tanpura-thick.mp3 |
| `pa_sa_b.mp3` | B (~123.5 Hz) | https://ragajunglism.org/wp-content/uploads/2020/03/b-tanpura-thick.mp3 |

### Sa-Ma (Perfect 4th) Drones — Ma-Sa-Sa-Sa tuning

| File | Key | Source URL |
|------|-----|-----------|
| `ma_sa_c.mp3` | C (~130.8 Hz) | https://ragajunglism.org/wp-content/uploads/2021/02/C-Tanpura-B5-SaMa-2021.mp3 |
| `ma_sa_db.mp3` | C# (~138.6 Hz) | https://ragajunglism.org/wp-content/uploads/2021/02/Db-Tanpura-B5-SaMa-2021.mp3 |
| `ma_sa_d.mp3` | D (~146.8 Hz) | https://ragajunglism.org/wp-content/uploads/2021/02/D-Tanpura-B5-SaMa-2021.mp3 |
| `ma_sa_eb.mp3` | D# (~155.6 Hz) | https://ragajunglism.org/wp-content/uploads/2021/02/Eb-Tanpura-B5-SaMa-2021.mp3 |
| `ma_sa_e.mp3` | E (~164.8 Hz) | https://ragajunglism.org/wp-content/uploads/2021/02/E-Tanpura-B5-SaMa-2021.mp3 |
| `ma_sa_f.mp3` | F (~87.3 Hz) | https://ragajunglism.org/wp-content/uploads/2021/02/F-Tanpuras-B5-SaMa-2021.mp3 |
| `ma_sa_gb.mp3` | F# (~92.5 Hz) | https://ragajunglism.org/wp-content/uploads/2021/02/Gb-Tanpura-B5-SaMa-2021.mp3 |
| `ma_sa_g.mp3` | G (~98 Hz) | https://ragajunglism.org/wp-content/uploads/2021/02/G-Tanpura-B5-SaMa-2021.mp3 |
| `ma_sa_ab.mp3` | G# (~103.8 Hz) | https://ragajunglism.org/wp-content/uploads/2021/02/Ab-Tanpura-B5-SaMa-2021.mp3 |
| `ma_sa_a.mp3` | A (=110 Hz) | https://ragajunglism.org/wp-content/uploads/2021/02/A-Tanpura-B5-SaMa-2021.mp3 |
| `ma_sa_bb.mp3` | A# (~116.5 Hz) | https://ragajunglism.org/wp-content/uploads/2021/02/Bb-Tanpura-B5-SaMa-2021.mp3 |
| `ma_sa_b.mp3` | B (~123.5 Hz) | https://ragajunglism.org/wp-content/uploads/2021/02/B-Tanpura-B5-SaMa-2021.mp3 |

**Processing applied:** Each 25+ minute source trimmed to 30s loop (extracted from 90s offset), mono 44100Hz, 192kbps MP3, with 2s fade-in and 3s fade-out.

---

## Accordion SoundFont (SF2) — Flutter swar playback

**File:** `assets/soundfonts/accordion_fluidr3.sf2`
**Source:** Extracted from [FluidR3 GM](https://musical-artifacts.com/artifacts/738) — GM Program 21 (Accordion)
**Original SoundFont:** [FluidR3 GM](https://member.keymusician.com/Member/FluidR3_GM/index.html) by Frank Wen et al.
**License:** Public domain (FluidR3 GM is released as public domain)
**Description:** Multi-sampled accordion preset (12 zones) from the FluidR3 General MIDI SoundFont. Same instrument as the web engine's WebAudioFont accordion, ensuring cross-platform tonal parity.
**Replaces:** `harmonium.sf2` (Wetthasinghe's Harmonium, CC-BY 4.0) — removed for quality parity with the web engine.

---

## WebAudioFont Accordion Preset (Web only)

**File:** `web/js/webaudiofont/0210_FluidR3_GM_sf2_file.js`
**Source:** [WebAudioFont](https://github.com/surikov/webaudiofont) by Srgy Surkv
**Original SoundFont:** [FluidR3 GM](https://member.keymusician.com/Member/FluidR3_GM/index.html)
**License:** [MIT License](https://github.com/surikov/webaudiofont/blob/master/LICENSE) (WebAudioFont); FluidR3 GM is public domain.
**Description:** GM Program 21 (Accordion) used for swar demo playback on web. Provides a rich, bellows-driven sound similar to an Indian harmonium.

---

## TablaKit One-Shot Samples

**Files:** `assets/audio/tabla/oneshots/<bol>/v1.wav`, `v2.wav` (7 bols × 2 variants = 14 files)
**Source:** Physically-modeled synthesis via `scripts/synthesize_tabla.py`
**License:** Generated — no license needed, no attribution required
**Manifest:** `assets/audio/tabla/manifest.json` (validated by `scripts/validate_tabla_manifest.py`)

| Bol | Type | Description |
|-----|------|-------------|
| dha | Dayan + Bayan | Both drums, deep bass + pitched ring |
| dhin | Dayan + Bayan | Brighter dayan + bayan bass |
| tin | Dayan only | Bright ring, long sustain |
| na | Dayan only | Clear pitched stroke |
| ta | Dayan only | Open stroke, shorter decay |
| ge | Bayan only | Deep bass with pitch glide |
| ke | Bayan only | Dry rim hit, short decay |

**Synthesis model:** Additive synthesis with near-harmonic partials (Raman membrane modes),
noise burst transients, exponential decay envelopes, and one-pole lowpass filtering.
Two variants per bol with slight frequency/timing jitter for round-robin natural variation.

### Legacy Tabla Loops (deprecated)

**Files:** `assets/audio/tabla/teentaal_60bpm.wav`, `keherwa_60bpm.wav`, `dadra_60bpm.wav`
**Source:** [oormicreations/naad](https://github.com/oormicreations/naad) on GitHub
**Author:** Oormi Creations
**License:** [MIT License](https://github.com/oormicreations/naad/blob/master/LICENSE)
**Status:** Replaced by TablaKit one-shots. Kept for reference only.

---

## Excluded Sources

- **Yamaha PSR keyboard sounds:** NOT used. Yamaha sample packs are intended for use on Yamaha instruments only; redistribution rights for third-party apps are unclear.

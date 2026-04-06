#!/usr/bin/env python3
"""
Physically-modeled tabla one-shot synthesizer — v2 (struck membrane model).

Key differences from v1 (which sounded like guitar strings):
  - STRONG broadband noise attack (20-40ms) — models finger/palm slap on membrane
  - SHORT decay (200-600ms) — tabla doesn't ring like a string
  - Amplitude modulation between close partials — creates "singing" beating
  - Inharmonic membrane modes for bayan — circular membrane, not string
  - Body resonance via filtered noise — "thud" character
  - Dayan syahi partials use pairs with slight detuning for shimmer

Tabla acoustics:
  Dayan (right, tuned): syahi loading creates near-harmonic pairs with ~2-5 Hz
    beating between them. Strong "tat" attack from finger strike. Modes decay
    in 200-600ms depending on bol. NOT a clean harmonic series.
  Bayan (left, bass): non-harmonic circular membrane modes at ratios
    ~1 : 1.59 : 2.14 : 2.30 (Bessel zeros). Very short decay (150-400ms).
    Ge has characteristic downward pitch sweep.

Output: assets/audio/tabla/oneshots/<bol>/v{1,2}.wav
Format: 44100 Hz, 16-bit, mono
"""

import os
import struct
import math
import random

SAMPLE_RATE = 44100
OUTPUT_BASE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "assets", "audio", "tabla", "oneshots",
)


def write_wav(filename: str, samples: list[float], sample_rate: int = SAMPLE_RATE):
    n = len(samples)
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, "wb") as f:
        data_size = n * 2
        f.write(b"RIFF")
        f.write(struct.pack("<I", 36 + data_size))
        f.write(b"WAVE")
        f.write(b"fmt ")
        f.write(struct.pack("<IHHIIHH", 16, 1, 1, sample_rate, sample_rate * 2, 2, 16))
        f.write(b"data")
        f.write(struct.pack("<I", data_size))
        for s in samples:
            clamped = max(-1.0, min(1.0, s))
            f.write(struct.pack("<h", int(clamped * 32767)))


def shaped_noise(
    duration_s: float,
    attack_s: float,
    decay_tau: float,
    lo_hz: float = 200,
    hi_hz: float = 8000,
    sr: int = SAMPLE_RATE,
) -> list[float]:
    """
    Band-limited noise burst with fast attack and exponential decay.
    Models finger/palm impact on membrane surface.
    """
    n = int(sr * duration_s)
    out = [0.0] * n

    # Generate white noise
    raw = [random.gauss(0, 1) for _ in range(n)]

    # Simple bandpass via cascaded one-pole filters
    # Highpass
    rc_hi = 1.0 / (2 * math.pi * lo_hz)
    dt = 1.0 / sr
    alpha_hi = rc_hi / (rc_hi + dt)
    prev_hp = 0.0
    prev_in = 0.0
    hp = [0.0] * n
    for i in range(n):
        hp[i] = alpha_hi * (prev_hp + raw[i] - prev_in)
        prev_in = raw[i]
        prev_hp = hp[i]

    # Lowpass
    rc_lo = 1.0 / (2 * math.pi * hi_hz)
    alpha_lo = dt / (rc_lo + dt)
    lp = [0.0] * n
    lp[0] = alpha_lo * hp[0]
    for i in range(1, n):
        lp[i] = lp[i - 1] + alpha_lo * (hp[i] - lp[i - 1])

    # Apply envelope: fast attack, exponential decay
    for i in range(n):
        t = i / sr
        if t < attack_s:
            env = t / attack_s
        else:
            env = math.exp(-(t - attack_s) / decay_tau)
        out[i] = lp[i] * env

    return out


def membrane_tone(
    freq: float,
    detune_hz: float,
    amplitude: float,
    decay_s: float,
    am_freq: float = 0.0,
    am_depth: float = 0.0,
    duration_s: float = 0.8,
    sr: int = SAMPLE_RATE,
) -> list[float]:
    """
    Single membrane mode as a pair of slightly detuned sinusoids.
    The beating between them creates the characteristic tabla "singing" shimmer.
    Optional amplitude modulation adds further liveliness.
    """
    n = int(sr * duration_s)
    out = [0.0] * n
    f1 = freq - detune_hz / 2
    f2 = freq + detune_hz / 2
    for i in range(n):
        t = i / sr
        env = amplitude * math.exp(-t / decay_s)
        # AM modulation
        if am_freq > 0:
            env *= 1.0 + am_depth * math.sin(2 * math.pi * am_freq * t)
        s = 0.5 * math.sin(2 * math.pi * f1 * t) + 0.5 * math.sin(2 * math.pi * f2 * t)
        out[i] = env * s
    return out


def pitch_sweep_tone(
    start_freq: float,
    end_freq: float,
    sweep_time: float,
    amplitude: float,
    decay_s: float,
    duration_s: float = 0.6,
    sr: int = SAMPLE_RATE,
) -> list[float]:
    """Tone with exponential pitch sweep — models bayan heel press."""
    n = int(sr * duration_s)
    out = [0.0] * n
    phase = 0.0
    for i in range(n):
        t = i / sr
        env = amplitude * math.exp(-t / decay_s)
        if t < sweep_time:
            frac = t / sweep_time
            freq = start_freq * ((end_freq / start_freq) ** frac)
        else:
            freq = end_freq
        out[i] = env * math.sin(phase)
        phase += 2 * math.pi * freq / sr
    return out


def mix(*signals_and_gains) -> list[float]:
    """Mix multiple (signal, gain) pairs."""
    max_len = max(len(s) for s, _ in signals_and_gains)
    out = [0.0] * max_len
    for sig, gain in signals_and_gains:
        for i in range(len(sig)):
            out[i] += sig[i] * gain
    return out


def normalize(samples: list[float], target_peak: float = 0.9) -> list[float]:
    peak = max(abs(s) for s in samples) or 1.0
    return [s * target_peak / peak for s in samples]


def trim_silence(samples: list[float], threshold: float = 0.003) -> list[float]:
    # Trim leading
    start = 0
    for i, s in enumerate(samples):
        if abs(s) > threshold:
            start = max(0, i - 4)
            break

    # Trim trailing — keep 30ms after last audible sample
    end = len(samples)
    tail_samples = int(SAMPLE_RATE * 0.03)
    for i in range(len(samples) - 1, -1, -1):
        if abs(samples[i]) > threshold:
            end = min(len(samples), i + tail_samples)
            break

    return samples[start:end]


# ============================================================
# BOL SYNTHESIS — each bol has distinct character
# ============================================================

def synth_na(variant: int) -> list[float]:
    """
    Na — open dayan stroke, rim + syahi contact.
    Clear pitched "singing" ring, moderate sustain (~400ms).
    Strong high-frequency attack transient.
    """
    f0 = 295 + variant * 8
    jitter = random.uniform(-3, 3)

    # Attack: crisp finger strike, mostly high-frequency
    attack = shaped_noise(0.06, attack_s=0.001, decay_tau=0.012,
                          lo_hz=1500, hi_hz=9000)

    # Syahi modes — slightly detuned pairs for beating
    mode1 = membrane_tone(f0 + jitter, detune_hz=2.5, amplitude=0.45,
                          decay_s=0.35, am_freq=8, am_depth=0.15, duration_s=0.7)
    mode2 = membrane_tone((f0 + jitter) * 2.01, detune_hz=3.5, amplitude=0.20,
                          decay_s=0.22, duration_s=0.5)
    mode3 = membrane_tone((f0 + jitter) * 3.03, detune_hz=4.0, amplitude=0.08,
                          decay_s=0.12, duration_s=0.3)

    # Body thud — low frequency membrane
    body = shaped_noise(0.04, attack_s=0.0005, decay_tau=0.015,
                        lo_hz=80, hi_hz=400)

    return mix((attack, 0.65), (body, 0.30), (mode1, 1.0), (mode2, 1.0), (mode3, 1.0))


def synth_tin(variant: int) -> list[float]:
    """
    Tin — ringing dayan, brighter than Na, slightly longer ring.
    More syahi emphasis, higher pitch.
    """
    f0 = 320 + variant * 6
    jitter = random.uniform(-3, 3)

    attack = shaped_noise(0.05, attack_s=0.001, decay_tau=0.010,
                          lo_hz=2000, hi_hz=10000)

    mode1 = membrane_tone(f0 + jitter, detune_hz=3.0, amplitude=0.50,
                          decay_s=0.40, am_freq=10, am_depth=0.18, duration_s=0.8)
    mode2 = membrane_tone((f0 + jitter) * 1.99, detune_hz=4.0, amplitude=0.25,
                          decay_s=0.25, duration_s=0.5)
    mode3 = membrane_tone((f0 + jitter) * 2.98, detune_hz=5.0, amplitude=0.10,
                          decay_s=0.15, duration_s=0.35)

    body = shaped_noise(0.03, attack_s=0.0005, decay_tau=0.012,
                        lo_hz=100, hi_hz=350)

    return mix((attack, 0.55), (body, 0.20), (mode1, 1.0), (mode2, 1.0), (mode3, 1.0))


def synth_ta(variant: int) -> list[float]:
    """
    Ta — open dayan stroke, less syahi emphasis, drier.
    Shorter ring than Na, more attack.
    """
    f0 = 270 + variant * 10
    jitter = random.uniform(-4, 4)

    attack = shaped_noise(0.05, attack_s=0.0008, decay_tau=0.015,
                          lo_hz=800, hi_hz=7000)

    mode1 = membrane_tone(f0 + jitter, detune_hz=2.0, amplitude=0.35,
                          decay_s=0.20, am_freq=6, am_depth=0.10, duration_s=0.45)
    mode2 = membrane_tone((f0 + jitter) * 2.05, detune_hz=3.0, amplitude=0.12,
                          decay_s=0.12, duration_s=0.3)

    body = shaped_noise(0.05, attack_s=0.0005, decay_tau=0.018,
                        lo_hz=100, hi_hz=500)

    return mix((attack, 0.70), (body, 0.35), (mode1, 1.0), (mode2, 1.0))


def synth_ge(variant: int) -> list[float]:
    """
    Ge — bayan bass with characteristic downward pitch sweep.
    Deep "goom" sound from heel press bending the membrane.
    Heavy low-frequency content, very short.
    """
    f0 = 80 + variant * 5
    jitter = random.uniform(-3, 3)

    # Deep bass attack thud
    attack = shaped_noise(0.05, attack_s=0.0005, decay_tau=0.020,
                          lo_hz=40, hi_hz=600)

    # Pitch-sweeping fundamental — characteristic bayan sound
    sweep = pitch_sweep_tone(
        start_freq=(f0 + jitter) * 1.4,
        end_freq=(f0 + jitter) * 0.65,
        sweep_time=0.12,
        amplitude=0.60,
        decay_s=0.25,
        duration_s=0.5,
    )

    # Inharmonic membrane mode — Bessel zero at ~1.59× fundamental
    mode2 = membrane_tone((f0 + jitter) * 1.59, detune_hz=1.5, amplitude=0.15,
                          decay_s=0.10, duration_s=0.25)

    # Sub-bass body thump
    sub = shaped_noise(0.06, attack_s=0.001, decay_tau=0.025,
                       lo_hz=20, hi_hz=150)

    return mix((attack, 0.75), (sub, 0.50), (sweep, 1.0), (mode2, 1.0))


def synth_ke(variant: int) -> list[float]:
    """
    Ke — dry bayan edge/rim hit. Short, sharp, mostly attack.
    Higher than Ge, no pitch sweep. Very percussive.
    """
    f0 = 120 + variant * 8
    jitter = random.uniform(-3, 3)

    # Sharp attack — mostly mid-high frequency
    attack = shaped_noise(0.04, attack_s=0.0005, decay_tau=0.008,
                          lo_hz=300, hi_hz=4000)

    # Very short membrane mode, no singing
    mode1 = membrane_tone(f0 + jitter, detune_hz=1.0, amplitude=0.30,
                          decay_s=0.08, duration_s=0.2)

    # Short body thud
    body = shaped_noise(0.03, attack_s=0.0005, decay_tau=0.010,
                        lo_hz=60, hi_hz=400)

    return mix((attack, 0.80), (body, 0.40), (mode1, 1.0))


def synth_dha(variant: int) -> list[float]:
    """
    Dha — Na + Ge combined. Both drums struck together.
    Bass thud from bayan + pitched ring from dayan.
    The most prominent bol in most thekas.
    """
    na = synth_na(variant)
    ge = synth_ge(variant)
    return mix((na, 0.7), (ge, 0.85))


def synth_dhin(variant: int) -> list[float]:
    """
    Dhin — Tin + Ge combined. Brighter dayan + bayan bass.
    Slightly brighter than Dha.
    """
    tin = synth_tin(variant)
    ge = synth_ge(variant)
    return mix((tin, 0.7), (ge, 0.80))


BOL_GENERATORS = {
    "dha": synth_dha,
    "dhin": synth_dhin,
    "tin": synth_tin,
    "na": synth_na,
    "ta": synth_ta,
    "ge": synth_ge,
    "ke": synth_ke,
}


def main():
    random.seed(42)
    total = 0

    for bol, gen_fn in BOL_GENERATORS.items():
        for v in range(2):
            raw = gen_fn(v)
            processed = trim_silence(raw)
            processed = normalize(processed, target_peak=0.9)

            variant_name = f"v{v + 1}"
            out_path = os.path.join(OUTPUT_BASE, bol, f"{variant_name}.wav")
            write_wav(out_path, processed)

            duration_ms = len(processed) / SAMPLE_RATE * 1000
            print(f"  {bol}/{variant_name}.wav  ({duration_ms:.0f}ms, {len(processed)} samples)")
            total += 1

    print(f"\nGenerated {total} tabla one-shot samples in {OUTPUT_BASE}")


if __name__ == "__main__":
    main()

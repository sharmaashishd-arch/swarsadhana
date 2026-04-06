/**
 * Integration Tests for Self-Test Harness
 * Tests robot rendering audio and grading itself
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Simplified YIN pitch detection for testing
function yinDetect(buffer, sampleRate, threshold = 0.1) {
    const bufferSize = buffer.length;
    const yinBuffer = new Float32Array(bufferSize / 2);
    
    let runningSum = 0;
    yinBuffer[0] = 1;
    
    for (let tau = 1; tau < bufferSize / 2; tau++) {
        let delta = 0;
        for (let i = 0; i < bufferSize / 2; i++) {
            const diff = buffer[i] - buffer[i + tau];
            delta += diff * diff;
        }
        runningSum += delta;
        yinBuffer[tau] = delta * tau / runningSum;
    }
    
    let tau = 2;
    while (tau < bufferSize / 2) {
        if (yinBuffer[tau] < threshold) {
            while (tau + 1 < bufferSize / 2 && yinBuffer[tau + 1] < yinBuffer[tau]) {
                tau++;
            }
            break;
        }
        tau++;
    }
    
    if (tau === bufferSize / 2) return -1;
    
    const x0 = tau < 1 ? tau : tau - 1;
    const x2 = tau + 1 < bufferSize / 2 ? tau + 1 : tau;
    
    let betterTau;
    if (x0 === tau || x2 === tau) {
        betterTau = tau;
    } else {
        const s0 = yinBuffer[x0];
        const s1 = yinBuffer[tau];
        const s2 = yinBuffer[x2];
        betterTau = tau + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
    }
    
    return sampleRate / betterTau;
}

// Generate a synthetic tone at a given frequency
function generateTone(frequency, duration, sampleRate) {
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(numSamples);
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        // Fundamental + harmonics (like vocal synth)
        let sample = 0;
        for (let h = 1; h <= 8; h++) {
            sample += Math.sin(2 * Math.PI * frequency * h * t) / Math.pow(h, 1.2);
        }
        // Apply envelope
        const attackEnd = 0.04;
        const releaseStart = duration - 0.06;
        let envelope = 1;
        if (t < attackEnd) {
            envelope = t / attackEnd;
        } else if (t > releaseStart) {
            envelope = (duration - t) / 0.06;
        }
        buffer[i] = sample * envelope * 0.3;
    }
    
    return buffer;
}

// Generate a sequence of tones
function generateSequence(events, tempo, sampleRate, baseSaFreq, swarsPerBeat = 1) {
    const swarRatios = {
        'Sa': 1, '.Sa': 2, 'Sa.': 0.5,
        're': 256/243, 'Re': 9/8,
        'ga': 32/27, 'Ga': 5/4,
        'Ma': 4/3, 'ma': 45/32,
        'Pa': 3/2,
        'dha': 128/81, 'Dha': 5/3,
        'ni': 16/9, 'Ni': 15/8
    };
    
    const beatDuration = 60 / tempo;
    const swarDuration = beatDuration / swarsPerBeat * 0.9;
    
    const totalBeats = Math.max(...events.map(e => e.beatIndex)) + 1;
    const totalDuration = (totalBeats * beatDuration / swarsPerBeat) + 0.5;
    const totalSamples = Math.floor(sampleRate * totalDuration);
    
    const buffer = new Float32Array(totalSamples);
    
    events.forEach(event => {
        const ratio = swarRatios[event.swar];
        if (!ratio) return;
        
        const freq = baseSaFreq * ratio;
        const startTime = event.beatIndex * beatDuration / swarsPerBeat;
        const startSample = Math.floor(startTime * sampleRate);
        
        const tone = generateTone(freq, swarDuration, sampleRate);
        
        for (let i = 0; i < tone.length && startSample + i < totalSamples; i++) {
            buffer[startSample + i] += tone[i];
        }
    });
    
    return { buffer, duration: totalDuration };
}

// Detect pitches from buffer
function detectPitchesFromBuffer(buffer, sampleRate, hopSize = 512, bufferSize = 2048) {
    const detectedPitches = [];
    
    for (let offset = 0; offset + bufferSize < buffer.length; offset += hopSize) {
        const chunk = buffer.slice(offset, offset + bufferSize);
        
        let rms = 0;
        for (let i = 0; i < chunk.length; i++) {
            rms += chunk[i] * chunk[i];
        }
        rms = Math.sqrt(rms / chunk.length);
        if (rms < 0.01) continue;
        
        const pitch = yinDetect(chunk, sampleRate, 0.15);
        
        if (pitch > 0 && pitch < 2000) {
            detectedPitches.push({
                frequency: pitch,
                timestamp: (offset / sampleRate) * 1000
            });
        }
    }
    
    return consolidatePitches(detectedPitches);
}

function consolidatePitches(pitches, toleranceHz = 15, gapMs = 80) {
    if (pitches.length === 0) return [];
    
    const consolidated = [];
    let current = { ...pitches[0], endTimestamp: pitches[0].timestamp };
    
    for (let i = 1; i < pitches.length; i++) {
        const p = pitches[i];
        const freqDiff = Math.abs(p.frequency - current.frequency);
        const timeDiff = p.timestamp - current.endTimestamp;
        
        if (freqDiff < toleranceHz && timeDiff < gapMs) {
            current.endTimestamp = p.timestamp;
            current.frequency = (current.frequency + p.frequency) / 2;
        } else {
            consolidated.push(current);
            current = { ...p, endTimestamp: p.timestamp };
        }
    }
    consolidated.push(current);
    
    return consolidated;
}

// Grading engine (simplified)
function freqToSwar(freq, baseSaFreq) {
    const swarRatios = {
        'Sa': 1, 're': 256/243, 'Re': 9/8, 'ga': 32/27, 'Ga': 5/4,
        'Ma': 4/3, 'ma': 45/32, 'Pa': 3/2, 'dha': 128/81, 'Dha': 5/3,
        'ni': 16/9, 'Ni': 15/8
    };
    const swarList = Object.keys(swarRatios);
    
    let testFreq = freq;
    let octave = 0;
    while (testFreq >= baseSaFreq * 2) { testFreq /= 2; octave++; }
    while (testFreq < baseSaFreq / 2) { testFreq *= 2; octave--; }
    
    const saCents = Math.abs(1200 * Math.log2(testFreq / baseSaFreq));
    if (saCents < 50) {
        const cents = 1200 * Math.log2(freq / (baseSaFreq * Math.pow(2, octave)));
        return { swar: octave > 0 ? '.Sa' : 'Sa', centsError: Math.round(cents) };
    }
    
    let normalizedFreq = freq;
    while (normalizedFreq >= baseSaFreq * 2) normalizedFreq /= 2;
    while (normalizedFreq < baseSaFreq) normalizedFreq *= 2;
    
    let closestSwar = 'Sa';
    let minCents = Infinity;
    
    for (const swar of swarList) {
        const targetFreq = baseSaFreq * swarRatios[swar];
        const cents = 1200 * Math.log2(normalizedFreq / targetFreq);
        if (Math.abs(cents) < Math.abs(minCents)) {
            minCents = cents;
            closestSwar = swar;
        }
    }
    
    return { swar: closestSwar, centsError: Math.round(minCents) };
}

function grade(expectedEvents, detectedPitches, baseSaFreq, timingWindowMs = 300) {
    let matched = 0;
    const usedPitches = new Set();
    
    expectedEvents.forEach(expected => {
        for (let j = 0; j < detectedPitches.length; j++) {
            if (usedPitches.has(j)) continue;
            
            const detected = detectedPitches[j];
            const timingError = Math.abs(detected.timestamp - expected.timestamp);
            
            if (timingError > timingWindowMs) continue;
            
            const swarInfo = freqToSwar(detected.frequency, baseSaFreq);
            if (swarInfo.swar === expected.swar) {
                matched++;
                usedPitches.add(j);
                break;
            }
        }
    });
    
    return {
        matched,
        total: expectedEvents.length,
        score: expectedEvents.length > 0 ? Math.round((matched / expectedEvents.length) * 100) : 0
    };
}

describe('Self-Test Harness Integration', () => {
    const sampleRate = 48000;
    const baseSaFreq = 261.63;
    
    describe('Tone generation and detection', () => {
        it('should generate and detect a single Sa tone', () => {
            const tone = generateTone(baseSaFreq, 0.5, sampleRate);
            const detected = detectPitchesFromBuffer(tone, sampleRate);
            
            expect(detected.length).toBeGreaterThan(0);
            
            const avgFreq = detected.reduce((sum, d) => sum + d.frequency, 0) / detected.length;
            const error = Math.abs(avgFreq - baseSaFreq) / baseSaFreq;
            
            expect(error).toBeLessThan(0.05); // Within 5%
        });
        
        it('should detect Pa tone correctly', () => {
            const paFreq = baseSaFreq * 1.5; // Pa ratio
            const tone = generateTone(paFreq, 0.5, sampleRate);
            const detected = detectPitchesFromBuffer(tone, sampleRate);
            
            expect(detected.length).toBeGreaterThan(0);
            
            const avgFreq = detected.reduce((sum, d) => sum + d.frequency, 0) / detected.length;
            const swarInfo = freqToSwar(avgFreq, baseSaFreq);
            
            expect(swarInfo.swar).toBe('Pa');
        });
    });
    
    describe('Sequence rendering and detection', () => {
        it('should render and detect a simple aaroh sequence', () => {
            const events = [
                { swar: 'Sa', beatIndex: 0 },
                { swar: 'Re', beatIndex: 1 },
                { swar: 'Ga', beatIndex: 2 },
                { swar: 'Ma', beatIndex: 3 }
            ];
            
            const tempo = 60;
            const { buffer } = generateSequence(events, tempo, sampleRate, baseSaFreq);
            const detected = detectPitchesFromBuffer(buffer, sampleRate);
            
            expect(detected.length).toBeGreaterThanOrEqual(4);
        });
        
        it('should achieve >= 75% score on self-test', () => {
            const events = [
                { swar: 'Sa', beatIndex: 0 },
                { swar: 'Re', beatIndex: 1 },
                { swar: 'Ga', beatIndex: 2 },
                { swar: 'Pa', beatIndex: 3 }
            ];
            
            const tempo = 60;
            const beatDuration = 60 / tempo;
            
            const { buffer } = generateSequence(events, tempo, sampleRate, baseSaFreq);
            const detected = detectPitchesFromBuffer(buffer, sampleRate);
            
            const expectedWithTimestamps = events.map(e => ({
                ...e,
                timestamp: e.beatIndex * beatDuration * 1000
            }));
            
            const result = grade(expectedWithTimestamps, detected, baseSaFreq);
            
            expect(result.score).toBeGreaterThanOrEqual(75);
        });
    });
    
    describe('Negative test: detuned audio', () => {
        it('should score lower when audio is detuned by +50 cents', () => {
            const events = [
                { swar: 'Sa', beatIndex: 0 },
                { swar: 'Re', beatIndex: 1 },
                { swar: 'Ga', beatIndex: 2 },
                { swar: 'Ma', beatIndex: 3 }
            ];
            
            const tempo = 60;
            const beatDuration = 60 / tempo;
            
            // Generate at correct pitch
            const { buffer: correctBuffer } = generateSequence(events, tempo, sampleRate, baseSaFreq);
            
            // Generate detuned (+50 cents = factor of 2^(50/1200) ≈ 1.029)
            const detunedSa = baseSaFreq * Math.pow(2, 50/1200);
            const { buffer: detunedBuffer } = generateSequence(events, tempo, sampleRate, detunedSa);
            
            const detectedCorrect = detectPitchesFromBuffer(correctBuffer, sampleRate);
            const detectedDetuned = detectPitchesFromBuffer(detunedBuffer, sampleRate);
            
            const expectedWithTimestamps = events.map(e => ({
                ...e,
                timestamp: e.beatIndex * beatDuration * 1000
            }));
            
            const correctResult = grade(expectedWithTimestamps, detectedCorrect, baseSaFreq);
            const detunedResult = grade(expectedWithTimestamps, detectedDetuned, baseSaFreq);
            
            // Detuned should score lower (pitches shifted to adjacent swars)
            expect(detunedResult.score).toBeLessThan(correctResult.score);
        });
    });
    
    describe('Full exercise simulation', () => {
        it('should handle Teentaal-aligned exercise', () => {
            // 16-beat Teentaal exercise
            const events = [
                { swar: 'Sa', beatIndex: 0 },
                { swar: 'Re', beatIndex: 1 },
                { swar: 'Ga', beatIndex: 2 },
                { swar: 'Ma', beatIndex: 3 },
                { swar: 'Pa', beatIndex: 4 },
                { swar: 'Dha', beatIndex: 5 },
                { swar: 'Ni', beatIndex: 6 },
                { swar: '.Sa', beatIndex: 7 }
            ];
            
            const tempo = 60;
            const beatDuration = 60 / tempo;
            
            const { buffer } = generateSequence(events, tempo, sampleRate, baseSaFreq);
            const detected = detectPitchesFromBuffer(buffer, sampleRate);
            
            const expectedWithTimestamps = events.map(e => ({
                ...e,
                timestamp: e.beatIndex * beatDuration * 1000
            }));
            
            const result = grade(expectedWithTimestamps, detected, baseSaFreq, 400);
            
            // Should detect most swars in a full aaroh
            expect(result.matched).toBeGreaterThanOrEqual(6);
        });
    });
});

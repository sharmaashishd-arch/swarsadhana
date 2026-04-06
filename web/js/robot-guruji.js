/**
 * Guruji - AI Tutor Mode with Self-Test Harness
 * 
 * Features:
 * - Sample-based Swar playback (harmonium/reed organ via WebAudioFont)
 * - Tutor Session: Demo → User Repeat → Grade → Report
 * - Self-Test Harness: Offline audio rendering for automated testing
 * - Enhanced grading with timing windows
 */

// ============================================
// SAMPLE-BASED SWAR SYNTHESIZER (WebAudioFont Accordion / Harmonium)
// ============================================

class SampleSwarSynth {
    constructor(audioEngine) {
        this.engine = audioEngine;
        this.outputGain = null;
        this.volume = 0.7;
        this.player = null;
        this.preset = null;
        this._activeEnvelope = null;
        this._activeOsc = null;
        
        this.swarRatios = SWAR_RATIOS;
        this.swarSemitones = SWAR_SEMITONES;
        
        this.baseSaFreq = PRACTICE_DEFAULTS.baseSaFreq;
        this.baseMidiNote = freqToMidi(PRACTICE_DEFAULTS.baseSaFreq);
    }
    
    async init(audioContext = null) {
        if (audioContext) {
            this.ctx = audioContext;
        } else {
            await this.engine.init();
            this.ctx = this.engine.ctx;
        }
        
        this.outputGain = this.ctx.createGain();
        this.outputGain.gain.value = this.volume;
        
        if (this.engine?.compressor) {
            this.outputGain.connect(this.engine.compressor);
        }
        
        // Initialize WebAudioFont player
        if (typeof WebAudioFontPlayer !== 'undefined') {
            this.player = new WebAudioFontPlayer();
            this.player.afterTime = 0.15;
            // Load Accordion preset (GM program 21) - rich harmonium-like sound
            if (typeof _tone_0210_FluidR3_GM_sf2_file !== 'undefined') {
                this.preset = _tone_0210_FluidR3_GM_sf2_file;
                this.player.adjustPreset(this.ctx, this.preset);
            }
        }
    }
    
    setBaseSa(freq) {
        this.baseSaFreq = freq;
        this.baseMidiNote = freqToMidi(freq);
    }
    
    getSwarFreq(swarName) {
        const ratio = this.swarRatios[swarName];
        return ratio ? this.baseSaFreq * ratio : null;
    }
    
    _swarToMidi(swarName) {
        const offset = this.swarSemitones[swarName];
        if (offset === undefined) return null;
        return this.baseMidiNote + offset;
    }
    
    _cancelActiveNote(fadeTime) {
        cancelActiveNote(this._activeEnvelope, this._activeOsc, fadeTime);
        this._activeEnvelope = null;
        this._activeOsc = null;
    }

    playSwar(swarName, duration = 0.5, startTime = null, destination = null) {
        if (!this.ctx) return null;
        if (!swarName || swarName === '-') return null;
        
        const midiNote = this._swarToMidi(swarName);
        if (midiNote === null) return null;
        
        const now = startTime ?? this.ctx.currentTime;
        const dest = destination || this.outputGain;

        this._cancelActiveNote(now);
        
        if (this.player && this.preset) {
            const envelope = this.player.queueWaveTable(
                this.ctx, dest, this.preset, now, midiNote, duration, this.volume
            );
            this._activeEnvelope = envelope;
            return {
                envelope,
                stopTime: now + duration
            };
        }
        
        // Fallback: simple oscillator if WebAudioFont not loaded
        const result = this._fallbackPlaySwar(swarName, duration, now, dest);
        if (result && result.osc) {
            this._activeOsc = { gain: result.osc.connect ? null : null };
        }
        return result;
    }
    
    _fallbackPlaySwar(swarName, duration, now, dest) {
        const freq = this.getSwarFreq(swarName);
        if (!freq) return null;
        
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.volume * 0.5, now + NOTE_ARTICULATION.ATTACK_SEC);
        gain.gain.setValueAtTime(this.volume * 0.5, now + duration - NOTE_ARTICULATION.RELEASE_SEC);
        gain.gain.linearRampToValueAtTime(0, now + duration);
        
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + duration + 0.01);
        
        return { osc, stopTime: now + duration };
    }
    
    scheduleSequence(events, tempo, swarsPerBeat = 1, startTime = null, destination = null) {
        if (!this.ctx) return [];
        
        const now = startTime ?? this.ctx.currentTime;
        const beatDuration = 60 / tempo;
        const slotDuration = beatDuration / swarsPerBeat;
        const noteDuration = computeNoteDuration(slotDuration);
        
        const scheduled = [];
        
        events.forEach((event, i) => {
            const eventTime = now + (event.beatIndex * beatDuration / swarsPerBeat);
            const noteRef = this.playSwar(event.swar, noteDuration, eventTime, destination);
            
            if (noteRef) {
                scheduled.push({
                    swar: event.swar,
                    startTime: eventTime,
                    duration: noteDuration,
                    beatIndex: event.beatIndex,
                    ref: noteRef
                });
            }
        });
        
        return scheduled;
    }
    
    setVolume(v) {
        this.volume = v;
        if (this.outputGain) {
            this.outputGain.gain.setTargetAtTime(v, this.ctx.currentTime, NOTE_ARTICULATION.GAIN_SMOOTH_SEC);
        }
    }
}

// Keep VocalSwarSynth as an alias for backward compatibility
const VocalSwarSynth = SampleSwarSynth;

// ============================================
// ENHANCED GRADING ENGINE
// ============================================

class GradingEngine {
    constructor() {
        this.baseSaFreq = PRACTICE_DEFAULTS.baseSaFreq;
        
        this.swarRatios = SWAR_RATIOS;
        this.swarList = SWAR_LIST;
    }
    
    setBaseSa(freq) {
        this.baseSaFreq = freq;
    }
    
    /**
     * Map frequency to nearest swar
     */
    freqToSwar(freq) {
        const baseSa = this.baseSaFreq;
        
        // Handle edge cases near Sa
        let testFreq = freq;
        let octave = 0;
        while (testFreq >= baseSa * 2) { testFreq /= 2; octave++; }
        while (testFreq < baseSa / 2) { testFreq *= 2; octave--; }
        
        const saCents = Math.abs(1200 * Math.log2(testFreq / baseSa));
        if (saCents < 50) {
            const cents = 1200 * Math.log2(freq / (baseSa * Math.pow(2, octave)));
            return {
                swar: octave > 0 ? '.Sa' : 'Sa',
                centsError: Math.round(cents),
                octaveShift: octave,
                frequency: freq
            };
        }
        
        // Normalize to [baseSa, 2*baseSa)
        let normalizedFreq = freq;
        let octaveShift = 0;
        while (normalizedFreq >= baseSa * 2) { normalizedFreq /= 2; octaveShift++; }
        while (normalizedFreq < baseSa) { normalizedFreq *= 2; octaveShift--; }
        
        // Find closest swar
        let closestSwar = 'Sa';
        let minCents = Infinity;
        
        for (const swar of this.swarList) {
            const targetFreq = baseSa * this.swarRatios[swar];
            const cents = 1200 * Math.log2(normalizedFreq / targetFreq);
            if (Math.abs(cents) < Math.abs(minCents)) {
                minCents = cents;
                closestSwar = swar;
            }
        }
        
        // Check upper Sa
        const upperSaCents = 1200 * Math.log2(normalizedFreq / (baseSa * 2));
        if (Math.abs(upperSaCents) < Math.abs(minCents)) {
            return {
                swar: '.Sa',
                centsError: Math.round(upperSaCents),
                octaveShift: octaveShift + 1,
                frequency: freq
            };
        }
        
        let swarName = closestSwar;
        if (closestSwar === 'Sa' && octaveShift > 0) swarName = '.Sa';
        
        return {
            swar: swarName,
            centsError: Math.round(minCents),
            octaveShift,
            frequency: freq
        };
    }
    
    /**
     * Grade detected pitches against expected events
     * @param {Array} expectedEvents - [{swar, timestamp, beatIndex}, ...]
     * @param {Array} detectedPitches - [{frequency, timestamp}, ...]
     * @param {Object} options - Grading options
     * @returns {Object} - Grading report
     */
    grade(expectedEvents, detectedPitches, options = {}) {
        const {
            timingWindowMs = 200, // Accept pitch within ±200ms of expected
            pitchToleranceCents = 50, // Perfect if within ±50 cents
            acceptableToleranceCents = 100 // Acceptable if within ±100 cents
        } = options;
        
        const results = {
            totalExpected: expectedEvents.length,
            matched: 0,
            perfect: 0,
            acceptable: 0,
            incorrect: 0,
            missed: 0,
            extra: detectedPitches.length,
            
            perSwarResults: [],
            pitchErrors: [],
            timingErrors: [],
            
            scores: {
                pitch: 0,
                timing: 0,
                completeness: 0,
                overall: 0
            }
        };
        
        if (expectedEvents.length === 0) {
            return results;
        }
        
        // Match detected pitches to expected events
        const usedPitches = new Set();
        
        expectedEvents.forEach((expected, i) => {
            const expectedTs = expected.timestamp;
            
            // Find best matching detected pitch within timing window
            let bestMatch = null;
            let bestScore = -Infinity;
            
            detectedPitches.forEach((detected, j) => {
                if (usedPitches.has(j)) return;
                
                const timingError = detected.timestamp - expectedTs;
                if (Math.abs(timingError) > timingWindowMs) return;
                
                const swarInfo = this.freqToSwar(detected.frequency);
                const pitchMatch = swarInfo.swar === expected.swar;
                const centsError = Math.abs(swarInfo.centsError);
                
                // Score: prefer pitch match, then timing, then cents accuracy
                const score = (pitchMatch ? 1000 : 0) 
                    - Math.abs(timingError) 
                    - centsError * 2;
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = {
                        detectedIndex: j,
                        detected,
                        swarInfo,
                        timingError,
                        pitchMatch
                    };
                }
            });
            
            const swarResult = {
                expected: expected.swar,
                expectedTimestamp: expectedTs,
                beatIndex: expected.beatIndex,
                status: 'missed',
                detected: null,
                centsError: null,
                timingErrorMs: null
            };
            
            if (bestMatch) {
                usedPitches.add(bestMatch.detectedIndex);
                results.extra--;
                
                swarResult.detected = bestMatch.swarInfo.swar;
                swarResult.centsError = bestMatch.swarInfo.centsError;
                swarResult.timingErrorMs = bestMatch.timingError;
                
                results.pitchErrors.push(bestMatch.swarInfo.centsError);
                results.timingErrors.push(bestMatch.timingError);
                
                if (bestMatch.pitchMatch) {
                    results.matched++;
                    
                    if (Math.abs(bestMatch.swarInfo.centsError) <= pitchToleranceCents) {
                        results.perfect++;
                        swarResult.status = 'perfect';
                    } else if (Math.abs(bestMatch.swarInfo.centsError) <= acceptableToleranceCents) {
                        results.acceptable++;
                        swarResult.status = 'acceptable';
                    } else {
                        swarResult.status = 'matched';
                    }
                } else {
                    results.incorrect++;
                    swarResult.status = 'incorrect';
                }
            } else {
                results.missed++;
            }
            
            results.perSwarResults.push(swarResult);
        });
        
        // Calculate scores (0-100)
        const pitchScore = results.totalExpected > 0 
            ? (results.matched / results.totalExpected) * 100 
            : 0;
        
        const avgPitchError = results.pitchErrors.length > 0
            ? results.pitchErrors.reduce((a, b) => a + Math.abs(b), 0) / results.pitchErrors.length
            : 100;
        const tuningScore = Math.max(0, 100 - avgPitchError);
        
        const avgTimingError = results.timingErrors.length > 0
            ? results.timingErrors.reduce((a, b) => a + Math.abs(b), 0) / results.timingErrors.length
            : timingWindowMs;
        const timingScore = Math.max(0, 100 - (avgTimingError / timingWindowMs) * 100);
        
        const completenessScore = results.totalExpected > 0
            ? ((results.totalExpected - results.missed) / results.totalExpected) * 100
            : 0;
        
        results.scores.pitch = Math.round(pitchScore);
        results.scores.tuning = Math.round(tuningScore);
        results.scores.timing = Math.round(timingScore);
        results.scores.completeness = Math.round(completenessScore);
        results.scores.overall = Math.round(
            (pitchScore * 0.4 + tuningScore * 0.2 + timingScore * 0.2 + completenessScore * 0.2)
        );
        
        return results;
    }
}

// ============================================
// SELF-TEST HARNESS (Offline Audio Rendering)
// ============================================

class SelfTestHarness {
    constructor() {
        this.sampleRate = 48000;
        this.vocalSynth = null;
        this.gradingEngine = new GradingEngine();
    }
    
    /**
     * Render swar sequence to offline audio buffer
     * @param {Array} events - [{swar, beatIndex}, ...]
     * @param {number} tempo - BPM
     * @param {number} swarsPerBeat - Swars per beat
     * @param {number} baseSaFreq - Sa frequency
     * @returns {Promise<AudioBuffer>} - Rendered audio buffer
     */
    async renderToBuffer(events, tempo, swarsPerBeat = 1, baseSaFreq = PRACTICE_DEFAULTS.baseSaFreq) {
        const beatDuration = 60 / tempo;
        const totalBeats = events.length > 0 
            ? Math.max(...events.map(e => e.beatIndex)) + 1 
            : 0;
        const totalDuration = (totalBeats * beatDuration / swarsPerBeat) + 0.5; // Extra padding
        
        const ctx = new OfflineAudioContext(1, this.sampleRate * totalDuration, this.sampleRate);
        
        // Create vocal synth for offline context
        this.vocalSynth = new VocalSwarSynth({ ctx });
        this.vocalSynth.ctx = ctx;
        this.vocalSynth.setBaseSa(baseSaFreq);
        
        // Create output gain
        const outputGain = ctx.createGain();
        outputGain.gain.value = 0.8;
        outputGain.connect(ctx.destination);
        
        // Schedule all swar events
        this.vocalSynth.scheduleSequence(events, tempo, swarsPerBeat, 0, outputGain);
        
        // Render
        const buffer = await ctx.startRendering();
        return buffer;
    }
    
    /**
     * Detect pitches from audio buffer using YIN algorithm
     * @param {AudioBuffer} buffer - Audio buffer to analyze
     * @param {Object} options - Detection options
     * @returns {Array} - Detected pitch events [{frequency, timestamp}, ...]
     */
    detectPitchesFromBuffer(buffer, options = {}) {
        const {
            hopSize = 512,
            bufferSize = 2048,
            threshold = 0.1,
            minRms = 0.01
        } = options;
        
        const data = buffer.getChannelData(0);
        const sampleRate = buffer.sampleRate;
        const detectedPitches = [];
        
        for (let offset = 0; offset + bufferSize < data.length; offset += hopSize) {
            const chunk = data.slice(offset, offset + bufferSize);
            
            // Check RMS
            let rms = 0;
            for (let i = 0; i < chunk.length; i++) {
                rms += chunk[i] * chunk[i];
            }
            rms = Math.sqrt(rms / chunk.length);
            if (rms < minRms) continue;
            
            // YIN pitch detection
            const pitch = this.yinDetect(chunk, sampleRate, threshold);
            
            if (pitch > 0) {
                detectedPitches.push({
                    frequency: pitch,
                    timestamp: (offset / sampleRate) * 1000, // ms
                    rms
                });
            }
        }
        
        // Consolidate consecutive same-pitch detections
        return this.consolidatePitches(detectedPitches);
    }
    
    /**
     * YIN pitch detection algorithm
     */
    yinDetect(buffer, sampleRate, threshold = 0.1) {
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
        
        // Parabolic interpolation
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
    
    /**
     * Consolidate consecutive pitch detections into single events
     */
    consolidatePitches(pitches, toleranceHz = 10, gapMs = 50) {
        if (pitches.length === 0) return [];
        
        const consolidated = [];
        let current = { ...pitches[0], endTimestamp: pitches[0].timestamp };
        
        for (let i = 1; i < pitches.length; i++) {
            const p = pitches[i];
            const freqDiff = Math.abs(p.frequency - current.frequency);
            const timeDiff = p.timestamp - current.endTimestamp;
            
            if (freqDiff < toleranceHz && timeDiff < gapMs) {
                // Extend current event
                current.endTimestamp = p.timestamp;
                current.frequency = (current.frequency + p.frequency) / 2; // Average
            } else {
                // New event
                consolidated.push(current);
                current = { ...p, endTimestamp: p.timestamp };
            }
        }
        consolidated.push(current);
        
        return consolidated;
    }
    
    /**
     * Run self-test: render robot audio and grade against expected
     * @param {Array} events - [{swar, beatIndex}, ...]
     * @param {number} tempo - BPM
     * @param {number} baseSaFreq - Sa frequency
     * @returns {Promise<Object>} - Test results
     */
    async runSelfTest(events, tempo, baseSaFreq = PRACTICE_DEFAULTS.baseSaFreq, swarsPerBeat = 1) {
        console.log('🧪 Starting self-test...');
        
        // Step 1: Render robot audio offline
        console.log('  📼 Rendering audio...');
        const buffer = await this.renderToBuffer(events, tempo, swarsPerBeat, baseSaFreq);
        
        // Step 2: Detect pitches from rendered buffer
        console.log('  🎤 Detecting pitches...');
        const detectedPitches = this.detectPitchesFromBuffer(buffer);
        console.log(`  📊 Detected ${detectedPitches.length} pitch events`);
        
        // Step 3: Create expected events with timestamps
        const beatDuration = 60 / tempo;
        const expectedWithTimestamps = events.map(e => ({
            swar: e.swar,
            beatIndex: e.beatIndex,
            timestamp: (e.beatIndex * beatDuration / swarsPerBeat) * 1000 // ms
        }));
        
        // Step 4: Grade
        console.log('  📝 Grading...');
        this.gradingEngine.setBaseSa(baseSaFreq);
        const results = this.gradingEngine.grade(expectedWithTimestamps, detectedPitches, {
            timingWindowMs: (beatDuration / swarsPerBeat) * 1000 * 0.5 // Half a beat window
        });
        
        // Step 5: Determine pass/fail
        const passed = results.scores.overall >= 95;
        
        console.log(`  ${passed ? '✅ PASS' : '❌ FAIL'}: Score ${results.scores.overall}%`);
        
        return {
            passed,
            buffer,
            detectedPitches,
            expectedEvents: expectedWithTimestamps,
            results
        };
    }
}

// ============================================
// TUTOR SESSION (Demo → Repeat → Grade)
// ============================================

class TutorSession {
    constructor(audioEngine, tanpura, tabla) {
        this.audioEngine = audioEngine;
        this.tanpura = tanpura;
        this.tabla = tabla;
        
        this.vocalSynth = new VocalSwarSynth(audioEngine);
        this.gradingEngine = new GradingEngine();
        this.pitchDetector = null;
        
        this.state = 'idle'; // idle, demo, waiting, listening, complete
        this.currentExercise = null;
        this.currentEvents = [];
        this.tempo = 60;
        this.swarsPerBeat = 1;
        
        this.detectedPitches = [];
        this.expectedTimestamps = [];
        this.results = null;
        
        this.onStateChange = null;
        this.onPitchDetected = null;
        this.onCurrentSwar = null;
        this.onResults = null;
    }
    
    async init() {
        await this.audioEngine.init();
        await this.vocalSynth.init();
    }
    
    setExercise(exercise, events) {
        this.currentExercise = exercise;
        this.currentEvents = events;
        this.tempo = exercise.tempo_bpm || 60;
        this.swarsPerBeat = exercise.swars_per_beat || 1;
        
        const baseSa = this.audioEngine.baseSaFreq || PRACTICE_DEFAULTS.baseSaFreq;
        this.vocalSynth.setBaseSa(baseSa);
        this.gradingEngine.setBaseSa(baseSa);
    }
    
    setTempo(bpm) {
        this.tempo = Math.max(PRACTICE_DEFAULTS.minTempo, Math.min(PRACTICE_DEFAULTS.maxTempo, bpm));
        if (this.tabla) this.tabla.setTempo(this.tempo);
    }
    
    /**
     * Start demo mode: Robot sings the exercise
     */
    async startDemo() {
        if (this.state !== 'idle') {
            this.stop();
        }
        
        this.setState('demo');
        await this.audioEngine.init();
        
        const defaults = window.exerciseManager?.getAccompanimentDefaults() || {};
        
        const taal = this.currentExercise?.taal_id 
            ? window.exerciseManager?.getTaal(this.currentExercise.taal_id)
            : null;
        
        const countInBeats = this.currentExercise?.playback_plan?.count_in_beats || 4;
        const beatDuration = 60 / this.tempo;
        
        if (this.tanpura && defaults.tanpuraEnabled !== false) {
            if (typeof this.tanpura.setVolume === 'function') {
                this.tanpura.setVolume(defaults.tanpuraVolume ?? PRACTICE_DEFAULTS.tanpuraVolume);
            }
            await this.tanpura.start();
        }
        if (this.tabla && taal && defaults.tablaEnabled !== false) {
            if (typeof this.tabla.setVolume === 'function') {
                this.tabla.setVolume(defaults.tablaVolume ?? PRACTICE_DEFAULTS.tablaVolume);
            }
            this.tabla.setTempo(this.tempo);
            await this.tabla.start(taal);
        }
        
        // Wait for count-in
        await this.delay(countInBeats * beatDuration * 1000);
        
        // Schedule swar singing
        const startTime = this.audioEngine.ctx.currentTime;
        const scheduled = this.vocalSynth.scheduleSequence(
            this.currentEvents, 
            this.tempo, 
            this.swarsPerBeat, 
            startTime
        );
        
        // Update UI with current swar
        let lastIndex = -1;
        const updateInterval = setInterval(() => {
            if (this.state !== 'demo') {
                clearInterval(updateInterval);
                return;
            }
            
            const now = this.audioEngine.ctx.currentTime;
            const currentNote = scheduled.find(s => 
                now >= s.startTime && now < s.startTime + s.duration
            );
            
            if (currentNote && scheduled.indexOf(currentNote) !== lastIndex) {
                lastIndex = scheduled.indexOf(currentNote);
                if (this.onCurrentSwar) {
                    this.onCurrentSwar(currentNote.swar, lastIndex, this.currentEvents.length);
                }
            }
        }, 50);
        
        // Wait for playback to complete
        const totalDuration = this.currentEvents.length * beatDuration / this.swarsPerBeat;
        await this.delay(totalDuration * 1000 + 500);
        
        clearInterval(updateInterval);
        this.setState('waiting');
    }
    
    /**
     * Start listening mode: User sings, robot grades
     */
    async startListening() {
        if (this.state !== 'waiting' && this.state !== 'idle') return;
        
        this.setState('listening');
        this.detectedPitches = [];
        
        this.pitchDetector = new PitchDetector(this.audioEngine);
        this.pitchDetector.calibratedSaFreq = this.audioEngine.baseSaFreq || PRACTICE_DEFAULTS.baseSaFreq;
        
        const defaults = window.exerciseManager?.getAccompanimentDefaults() || {};
        const beatDuration = 60 / this.tempo;
        const countInBeats = this.currentExercise?.playback_plan?.count_in_beats || 4;
        
        const taal = this.currentExercise?.taal_id 
            ? window.exerciseManager?.getTaal(this.currentExercise.taal_id)
            : null;
        
        if (this.tanpura && defaults.tanpuraEnabled !== false) {
            if (typeof this.tanpura.setVolume === 'function') {
                this.tanpura.setVolume(defaults.tanpuraVolume ?? PRACTICE_DEFAULTS.tanpuraVolume);
            }
            await this.tanpura.start();
        }
        if (this.tabla && taal && defaults.tablaEnabled !== false) {
            if (typeof this.tabla.setVolume === 'function') {
                this.tabla.setVolume(defaults.tablaVolume ?? PRACTICE_DEFAULTS.tablaVolume);
            }
            this.tabla.setTempo(this.tempo);
            await this.tabla.start(taal);
        }
        
        // Record start time for timestamp calculation
        const sessionStartTime = performance.now();
        
        // Setup pitch detection callback
        this.pitchDetector.onPitch(pitchData => {
            const relativeTimestamp = performance.now() - sessionStartTime - (countInBeats * beatDuration * 1000);
            
            if (relativeTimestamp >= 0) {
                this.detectedPitches.push({
                    frequency: pitchData.frequency,
                    timestamp: relativeTimestamp,
                    swar: pitchData.swar,
                    centsError: pitchData.centsError
                });
                
                if (this.onPitchDetected) {
                    this.onPitchDetected(pitchData);
                }
            }
        });
        
        // Start mic input
        await this.pitchDetector.start();
        
        // Wait for count-in
        await this.delay(countInBeats * beatDuration * 1000);
        
        // Create expected events with timestamps
        this.expectedTimestamps = this.currentEvents.map(e => ({
            swar: e.swar,
            beatIndex: e.beatIndex,
            timestamp: (e.beatIndex * beatDuration / this.swarsPerBeat) * 1000
        }));
        
        // Wait for exercise duration
        const totalDuration = this.currentEvents.length * beatDuration / this.swarsPerBeat;
        await this.delay(totalDuration * 1000 + 500);
        
        // Stop listening and grade
        this.pitchDetector.stop();
        if (this.tanpura) this.tanpura.stop();
        if (this.tabla) this.tabla.stop();
        
        // Grade performance
        this.results = this.gradingEngine.grade(
            this.expectedTimestamps, 
            this.detectedPitches,
            {
                timingWindowMs: (beatDuration / this.swarsPerBeat) * 1000 * 0.5
            }
        );
        
        this.setState('complete');
        
        if (this.onResults) {
            this.onResults(this.results);
        }
        
        return this.results;
    }
    
    /**
     * Stop current session
     */
    stop() {
        if (this.pitchDetector) {
            this.pitchDetector.stop();
        }
        if (this.tanpura) this.tanpura.stop();
        if (this.tabla) this.tabla.stop();
        
        this.setState('idle');
    }
    
    /**
     * Reset for new attempt
     */
    reset() {
        this.stop();
        this.detectedPitches = [];
        this.expectedTimestamps = [];
        this.results = null;
        this.setState('idle');
    }
    
    /**
     * Get recommendation based on results
     */
    getRecommendation() {
        if (!this.results) return null;
        
        const { scores, missed, incorrect, pitchErrors, timingErrors } = this.results;
        
        const recommendations = [];
        
        if (scores.overall >= 90) {
            recommendations.push({
                type: 'success',
                message: 'Excellent! Try a faster tempo or move to the next exercise.'
            });
        } else if (scores.overall >= 70) {
            recommendations.push({
                type: 'good',
                message: 'Good progress! Keep practicing this exercise.'
            });
        } else {
            recommendations.push({
                type: 'practice',
                message: 'Keep practicing! Try a slower tempo.'
            });
        }
        
        if (missed > 0) {
            recommendations.push({
                type: 'missed',
                message: `You missed ${missed} swar(s). Focus on completing the full pattern.`
            });
        }
        
        if (incorrect > 0) {
            recommendations.push({
                type: 'pitch',
                message: `${incorrect} swar(s) had incorrect pitch. Listen carefully to the demo.`
            });
        }
        
        const avgTiming = timingErrors.length > 0 
            ? timingErrors.reduce((a, b) => a + Math.abs(b), 0) / timingErrors.length 
            : 0;
        if (avgTiming > 100) {
            recommendations.push({
                type: 'timing',
                message: 'Work on staying with the beat. Practice with metronome.'
            });
        }
        
        return recommendations;
    }
    
    setState(state) {
        this.state = state;
        if (this.onStateChange) {
            this.onStateChange(state);
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ============================================
// ROBOT GURUJI UI CONTROLLER
// ============================================

class RobotGurujiUI {
    constructor() {
        this.tutorSession = null;
        this.selfTestHarness = new SelfTestHarness();
        this.exerciseManager = null;
        
        this.currentView = 'detail'; // detail, session, results
        this.selectedExercise = null;
    }
    
    async init(audioEngine, tanpura, tabla, exerciseManager) {
        this.exerciseManager = exerciseManager;
        this.tutorSession = new TutorSession(audioEngine, tanpura, tabla);
        await this.tutorSession.init();
        
        // Setup callbacks
        this.tutorSession.onStateChange = (state) => this.onStateChange(state);
        this.tutorSession.onCurrentSwar = (swar, idx, total) => this.onCurrentSwar(swar, idx, total);
        this.tutorSession.onPitchDetected = (pitch) => this.onPitchDetected(pitch);
        this.tutorSession.onResults = (results) => this.onResults(results);
        
        console.log('🎓 Guruji initialized');
    }
    
    setExercise(exercise) {
        this.selectedExercise = exercise;
        const events = this.exerciseManager.flattenExercise(exercise);
        this.tutorSession.setExercise(exercise, events);
    }
    
    async startDemo() {
        if (!this.selectedExercise) return;
        this.renderSessionView('demo');
        await this.tutorSession.startDemo();
    }
    
    async startUserTurn() {
        this.renderSessionView('listening');
        await this.tutorSession.startListening();
    }
    
    async runSelfTest() {
        if (!this.selectedExercise) return;
        
        const events = this.exerciseManager.flattenExercise(this.selectedExercise);
        const tempo = this.selectedExercise.tempo_bpm || 60;
        const baseSa = PRACTICE_DEFAULTS.baseSaFreq;
        const swarsPerBeat = this.selectedExercise.swars_per_beat || 1;
        
        this.renderSelfTestProgress();
        
        const result = await this.selfTestHarness.runSelfTest(events, tempo, baseSa, swarsPerBeat);
        
        this.renderSelfTestResults(result);
        
        return result;
    }
    
    stop() {
        this.tutorSession.stop();
        this.renderDetailView();
    }
    
    // === UI Rendering ===
    
    renderDetailView() {
        const container = document.getElementById('robot-guruji-content');
        if (!container || !this.selectedExercise) return;
        
        const ex = this.selectedExercise;
        const taal = this.exerciseManager.getTaal(ex.taal_id);
        
        container.innerHTML = `
            <div class="guruji-detail">
                <button class="back-btn" onclick="robotGurujiUI.goBack()">← Back</button>
                
                <h2>${ex.title}</h2>
                <p class="description">${ex.description || ''}</p>
                
                <div class="swar-display">
                    <h3>Swar Pattern</h3>
                    ${ex.display?.aaroh_hindi ? `
                        <div class="swar-row">
                            <span class="label">आरोह</span>
                            <div class="swar-boxes">
                                ${this.renderSwarBoxes(ex.aaroh || [])}
                            </div>
                        </div>
                    ` : ''}
                    ${ex.display?.avroh_hindi ? `
                        <div class="swar-row">
                            <span class="label">अवरोह</span>
                            <div class="swar-boxes">
                                ${this.renderSwarBoxes(ex.avroh || [])}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                ${taal ? `
                    <div class="taal-info">
                        <h3>${taal.name} (${taal.nameHindi})</h3>
                        <p>${taal.beats} beats</p>
                    </div>
                ` : ''}
                
                <div class="tutor-actions">
                    <button class="demo-btn" onclick="robotGurujiUI.startDemo()">
                        🎵 Robot Demo
                    </button>
                    <button class="practice-btn" onclick="robotGurujiUI.startUserTurn()">
                        🎤 Your Turn
                    </button>
                </div>
                
                <div class="dev-actions">
                    <button class="self-test-btn" onclick="robotGurujiUI.runSelfTest()">
                        🧪 Self-Test (Dev)
                    </button>
                </div>
            </div>
        `;
        
        this.currentView = 'detail';
    }
    
    renderSwarBoxes(swars) {
        const swarHindiMap = {
            'Sa': 'सा', '.Sa': 'सां', 'Sa.': 'सा॒',
            'Re': 'रे', 're': 'रे॒',
            'Ga': 'ग', 'ga': 'ग॒',
            'Ma': 'म', 'ma': 'म॑',
            'Pa': 'प',
            'Dha': 'ध', 'dha': 'ध॒',
            'Ni': 'नि', 'ni': 'नि॒'
        };
        
        return swars.map(s => {
            const hindi = swarHindiMap[s] || s;
            return `<span class="swar-box">${hindi}</span>`;
        }).join('');
    }
    
    _swarToHindi(swarName) {
        const map = {
            'Sa': 'सा', '.Sa': 'सां', 'Sa.': 'सा॒',
            'Re': 'रे', 're': 'रे॒',
            'Ga': 'ग', 'ga': 'ग॒',
            'Ma': 'म', 'ma': 'म॑',
            'Pa': 'प',
            'Dha': 'ध', 'dha': 'ध॒',
            'Ni': 'नि', 'ni': 'नि॒'
        };
        return map[swarName] || swarName;
    }
    
    renderSessionView(mode) {
        const container = document.getElementById('robot-guruji-content');
        if (!container) return;
        
        const modeText = mode === 'demo' ? '🎵 Robot is singing...' : '🎤 Your turn - sing now!';
        const modeClass = mode === 'demo' ? 'demo-mode' : 'listen-mode';
        
        const events = this.tutorSession?.currentEvents || [];
        const chips = events.map((ev, i) => {
            const label = this._swarToHindi(ev.swar);
            return `<div class="unified-chip upcoming" data-swar-idx="${i}">
                <span class="chip-swar">${label}</span>
            </div>`;
        }).join('');
        
        container.innerHTML = `
            <div class="guruji-session ${modeClass}">
                <div class="session-header">
                    <h2>${this.selectedExercise?.title}</h2>
                    <span class="mode-indicator">${modeText}</span>
                </div>
                
                <div class="unified-strip-container">
                    <div class="unified-strip" id="swar-strip">${chips}</div>
                </div>
                
                <div class="current-swar-display">
                    <div class="swar-large" id="current-swar">-</div>
                    <div class="progress-text" id="progress-text">Starting...</div>
                </div>
                
                ${mode === 'listening' ? `
                    <div class="pitch-feedback">
                        <div class="detected-swar" id="detected-swar">-</div>
                        <div class="cents-meter">
                            <div class="cents-indicator" id="cents-indicator"></div>
                        </div>
                        <div class="cents-value" id="cents-value">0¢</div>
                    </div>
                ` : ''}
                
                <button class="stop-btn" onclick="robotGurujiUI.stop()">Stop</button>
            </div>
        `;
        
        this.currentView = 'session';
    }
    
    renderResultsView(results) {
        const container = document.getElementById('robot-guruji-content');
        if (!container) return;
        
        const recommendations = this.tutorSession.getRecommendation();
        
        container.innerHTML = `
            <div class="guruji-results">
                <h2>📊 Results</h2>
                
                <div class="score-circle ${this.getScoreClass(results.scores.overall)}">
                    <span class="score-value">${results.scores.overall}</span>
                    <span class="score-label">Overall</span>
                </div>
                
                <div class="score-breakdown">
                    <div class="score-item">
                        <span class="label">Pitch</span>
                        <div class="bar" style="width: ${results.scores.pitch}%"></div>
                        <span class="value">${results.scores.pitch}%</span>
                    </div>
                    <div class="score-item">
                        <span class="label">Tuning</span>
                        <div class="bar" style="width: ${results.scores.tuning}%"></div>
                        <span class="value">${results.scores.tuning}%</span>
                    </div>
                    <div class="score-item">
                        <span class="label">Timing</span>
                        <div class="bar" style="width: ${results.scores.timing}%"></div>
                        <span class="value">${results.scores.timing}%</span>
                    </div>
                    <div class="score-item">
                        <span class="label">Completeness</span>
                        <div class="bar" style="width: ${results.scores.completeness}%"></div>
                        <span class="value">${results.scores.completeness}%</span>
                    </div>
                </div>
                
                <div class="swar-results">
                    <h3>Per-Swar Analysis</h3>
                    <div class="swar-result-grid">
                        ${results.perSwarResults.map((r, i) => `
                            <div class="swar-result ${r.status}">
                                <span class="expected">${r.expected}</span>
                                ${r.detected ? `<span class="detected">${r.detected}</span>` : ''}
                                ${r.centsError !== null ? `<span class="cents">${r.centsError > 0 ? '+' : ''}${r.centsError}¢</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                ${recommendations ? `
                    <div class="recommendations">
                        <h3>💡 Recommendations</h3>
                        ${recommendations.map(r => `
                            <div class="recommendation ${r.type}">
                                ${r.message}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="result-actions">
                    <button onclick="robotGurujiUI.startDemo()">🔄 Watch Demo Again</button>
                    <button onclick="robotGurujiUI.tutorSession.reset(); robotGurujiUI.startUserTurn()">
                        🎤 Try Again
                    </button>
                    <button onclick="robotGurujiUI.goBack()">📚 Choose Another</button>
                </div>
            </div>
        `;
        
        this.currentView = 'results';
    }
    
    renderSelfTestProgress() {
        const container = document.getElementById('robot-guruji-content');
        if (!container) return;
        
        container.innerHTML = `
            <div class="self-test-progress">
                <h2>🧪 Running Self-Test</h2>
                <div class="progress-steps">
                    <div class="step active">Rendering audio...</div>
                    <div class="step">Detecting pitches...</div>
                    <div class="step">Grading...</div>
                </div>
                <div class="spinner"></div>
            </div>
        `;
    }
    
    renderSelfTestResults(result) {
        const container = document.getElementById('robot-guruji-content');
        if (!container) return;
        
        const { passed, results, detectedPitches, expectedEvents } = result;
        
        container.innerHTML = `
            <div class="self-test-results ${passed ? 'passed' : 'failed'}">
                <h2>${passed ? '✅ Self-Test PASSED' : '❌ Self-Test FAILED'}</h2>
                
                <div class="test-score">
                    <span class="score">${results.scores.overall}%</span>
                    <span class="threshold">(threshold: 95%)</span>
                </div>
                
                <div class="test-details">
                    <h3>Detection Summary</h3>
                    <ul>
                        <li>Expected swars: ${expectedEvents.length}</li>
                        <li>Detected pitches: ${detectedPitches.length}</li>
                        <li>Matched: ${results.matched}</li>
                        <li>Perfect: ${results.perfect}</li>
                        <li>Missed: ${results.missed}</li>
                    </ul>
                </div>
                
                <div class="score-breakdown">
                    <div>Pitch: ${results.scores.pitch}%</div>
                    <div>Tuning: ${results.scores.tuning}%</div>
                    <div>Timing: ${results.scores.timing}%</div>
                    <div>Completeness: ${results.scores.completeness}%</div>
                </div>
                
                <button onclick="robotGurujiUI.renderDetailView()">Back to Exercise</button>
            </div>
        `;
    }
    
    getScoreClass(score) {
        if (score >= 90) return 'excellent';
        if (score >= 70) return 'good';
        if (score >= 50) return 'fair';
        return 'needs-work';
    }
    
    // === Callbacks ===
    
    onStateChange(state) {
        console.log(`🎓 Guruji state: ${state}`);
        
        if (state === 'waiting') {
            // After demo, prompt user
            const container = document.getElementById('robot-guruji-content');
            if (container) {
                container.innerHTML += `
                    <div class="ready-prompt">
                        <p>Robot has finished the demo. Ready?</p>
                        <button onclick="robotGurujiUI.startUserTurn()">🎤 Start Singing</button>
                    </div>
                `;
            }
        }
    }
    
    onCurrentSwar(swar, index, total) {
        const swarEl = document.getElementById('current-swar');
        const progressEl = document.getElementById('progress-text');
        
        if (swarEl) swarEl.textContent = this._swarToHindi(swar);
        if (progressEl) progressEl.textContent = `${index + 1} / ${total}`;
        
        const strip = document.getElementById('swar-strip');
        if (strip) {
            const chips = strip.querySelectorAll('.unified-chip');
            chips.forEach((chip, i) => {
                chip.classList.remove('active', 'done', 'upcoming');
                if (i < index) chip.classList.add('done');
                else if (i === index) chip.classList.add('active');
                else chip.classList.add('upcoming');
            });
            
            const activeChip = chips[index];
            if (activeChip) {
                activeChip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }
    
    onPitchDetected(pitch) {
        const detectedEl = document.getElementById('detected-swar');
        const centsEl = document.getElementById('cents-value');
        const indicatorEl = document.getElementById('cents-indicator');
        
        if (detectedEl) detectedEl.textContent = pitch.swar;
        if (centsEl) centsEl.textContent = `${pitch.centsError > 0 ? '+' : ''}${pitch.centsError}¢`;
        if (indicatorEl) {
            const offset = Math.max(-50, Math.min(50, pitch.centsError));
            indicatorEl.style.left = `${50 + offset}%`;
        }
    }
    
    onResults(results) {
        this.renderResultsView(results);
    }
    
    setTempo(bpm) {
        this.tutorSession.setTempo(parseInt(bpm));
        const display = document.getElementById('tempo-display');
        if (display) display.textContent = bpm;
    }
    
    goBack() {
        this.tutorSession.reset();
        // Trigger browser view - this should be connected to robot-riyaaz-ui.js
        if (window.robotRiyaazUI) {
            window.robotRiyaazUI.renderExerciseBrowser();
        }
    }
}

// Initialize when DOM ready
if (typeof window !== 'undefined') {
    window.SampleSwarSynth = SampleSwarSynth;
    window.VocalSwarSynth = VocalSwarSynth; // backward compat alias
    window.GradingEngine = GradingEngine;
    window.SelfTestHarness = SelfTestHarness;
    window.TutorSession = TutorSession;
    window.RobotGurujiUI = RobotGurujiUI;
}

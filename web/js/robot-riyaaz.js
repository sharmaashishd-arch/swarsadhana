/**
 * Sadhana - Automated Practice System
 * 
 * Features:
 * - Robot Player: Auto-play exercises with tanpura + tabla + swars
 * - Robot Listener: Pitch detection and grading
 * - Session Flow: Demo -> Practice -> Score
 */

const PRACTICE_MODES = {
    SING_ALONG: 'singAlong',
    GUIDED: 'guidedPractice',
    SELF: 'selfPractice'
};

// ============================================
// EXERCISE MANAGER
// ============================================

class ExerciseManager {
    constructor() {
        this.exercises = [];
        this.taals = {};
        this.swaras = {};
        this.loaded = false;
    }
    
    async loadExercises(jsonPath = '/assets/exercises/hindustani_class1.json') {
        try {
            const response = await fetch(jsonPath);
            const data = await response.json();
            
            this.exercises = data.exercises || [];
            this.taals = data.taals || {};
            this.swaras = data.swaras || {};
            this.categories = data.categories || [];
            this.defaultSettings = data.default_settings || {};
            this.accompanimentDefaults = data.accompaniment_defaults || {};
            this.loaded = true;
            
            console.log(`📚 Loaded ${this.exercises.length} exercises`);
            return this.exercises;
        } catch (e) {
            console.error('Failed to load exercises:', e);
            throw e;
        }
    }
    
    getAccompanimentDefaults() {
        const d = this.accompanimentDefaults || {};
        const tanpura = d.tanpura || {};
        const tabla = d.tabla || {};

        let userTanpuraVol = null;
        let userTablaVol = null;
        try {
            const tv = localStorage.getItem(STORAGE_KEYS.TANPURA_VOLUME);
            if (tv !== null) userTanpuraVol = parseFloat(tv);
            const tbv = localStorage.getItem(STORAGE_KEYS.TABLA_VOLUME);
            if (tbv !== null) userTablaVol = parseFloat(tbv);
        } catch(e) {}

        return {
            tanpuraEnabled: tanpura.enabled !== false,
            tanpuraPattern: tanpura.pattern || 'PaSa',
            tanpuraVolume: userTanpuraVol ?? tanpura.volume ?? PRACTICE_DEFAULTS.tanpuraVolume,
            tablaEnabled: tabla.enabled !== false,
            tablaVolume: userTablaVol ?? tabla.volume ?? PRACTICE_DEFAULTS.tablaVolume,
            countInAvartans: d.count_in_avartans || 1,
            demoAvartans: d.demo_avartans || 1,
            practiceAvartans: d.practice_avartans || 2,
            swarPerMatra: d.swar_per_matra || 1,
        };
    }
    
    getExerciseById(id) {
        return this.exercises.find(ex => ex.id === id);
    }
    
    getExercisesByCategory(category) {
        return this.exercises.filter(ex => ex.category === category);
    }
    
    getTaal(taalId) {
        return this.taals[taalId];
    }
    
    getSwarInfo(swarName) {
        return this.swaras[swarName];
    }
    
    /**
     * Flatten exercise into a sequence of swar events
     * Returns: [{ swar: 'Sa', beatIndex: 0, groupIndex: 0 }, ...]
     */
    flattenExercise(exercise) {
        const events = [];
        let beatIndex = 0;
        
        const processSwars = (swars, direction = 'aaroh') => {
            if (!swars) return;
            
            swars.forEach((swar, i) => {
                if (swar && swar !== '-') {
                    events.push({
                        swar,
                        beatIndex,
                        direction,
                        index: i
                    });
                }
                beatIndex++;
            });
        };
        
        const processPhrases = (phrases, direction = 'aaroh') => {
            if (!phrases) return;
            
            phrases.forEach((phrase, groupIndex) => {
                phrase.forEach((swar, i) => {
                    if (swar && swar !== '-') {
                        events.push({
                            swar,
                            beatIndex,
                            direction,
                            groupIndex,
                            index: i
                        });
                    }
                    beatIndex++;
                });
            });
        };
        
        const processGroups = (groups, direction = 'aaroh') => {
            if (!groups) return;
            
            groups.forEach((group, groupIndex) => {
                group.forEach((swar, i) => {
                    if (swar && swar !== '-') {
                        events.push({
                            swar,
                            beatIndex,
                            direction,
                            groupIndex,
                            index: i
                        });
                    }
                    beatIndex++;
                });
            });
        };
        
        // Process aaroh
        if (exercise.aaroh) processSwars(exercise.aaroh, 'aaroh');
        if (exercise.aaroh_phrases) processPhrases(exercise.aaroh_phrases, 'aaroh');
        if (exercise.aaroh_groups) processGroups(exercise.aaroh_groups, 'aaroh');
        
        // Process avroh
        if (exercise.avroh) processSwars(exercise.avroh, 'avroh');
        if (exercise.avroh_phrases) processPhrases(exercise.avroh_phrases, 'avroh');
        if (exercise.avroh_groups) processGroups(exercise.avroh_groups, 'avroh');
        
        return events;
    }
}

// ============================================
// ROBOT PLAYER
// ============================================

class RobotPlayer {
    constructor(audioEngine, tanpura, tabla, swarSynth) {
        this.audioEngine = audioEngine;
        this.tanpura = tanpura;
        this.tabla = tabla;
        this.swarSynth = swarSynth;
        
        this.isPlaying = false;
        this.currentExercise = null;
        this.currentEvents = [];
        this.currentEventIndex = 0;
        this.tempo = PRACTICE_DEFAULTS.tempo;
        this.playbackTimer = null;
        
        this.onSwarCallback = null;
        this.onBeatCallback = null;
        this.onCompleteCallback = null;
        
        this.countInBeats = 4;
        this.swarsPerBeat = 1;
        
        this._tanpuraEnabled = true;
        this._tablaEnabled = true;
    }
    
    async init() {
        await this.audioEngine.init();
        await this.swarSynth.init();
    }
    
    setExercise(exercise, events) {
        this.currentExercise = exercise;
        this.currentEvents = events;
        this.tempo = exercise.tempo_bpm || PRACTICE_DEFAULTS.tempo;
        this.swarsPerBeat = exercise.swars_per_beat || 1;
        this.countInBeats = exercise.playback_plan?.count_in_beats || 4;
    }
    
    async play(options = {}) {
        if (this.isPlaying) return;
        
        const {
            withTanpura = true,
            withTabla = true,
            demoMode = false
        } = options;
        
        await this.audioEngine.init();
        
        const defaults = window.exerciseManager?.getAccompanimentDefaults() || {};
        
        this.isPlaying = true;
        this.currentEventIndex = 0;
        
        if (withTanpura && this.tanpura && this._tanpuraEnabled) {
            if (typeof this.tanpura.setVolume === 'function') {
                this.tanpura.setVolume(defaults.tanpuraVolume ?? PRACTICE_DEFAULTS.tanpuraVolume);
            }
            await this.tanpura.start();
        }
        
        const taal = this.currentExercise?.taal_id 
            ? window.exerciseManager?.getTaal(this.currentExercise.taal_id)
            : null;
        
        if (withTabla && this.tabla && taal && this._tablaEnabled) {
            if (typeof this.tabla.setVolume === 'function') {
                this.tabla.setVolume(defaults.tablaVolume ?? PRACTICE_DEFAULTS.tablaVolume);
            }
            this.tabla.setTempo(this.tempo);
            await this.tabla.start(taal);
        }
        
        const ctx = this.audioEngine.ctx;
        const beatDurationSec = 60.0 / this.tempo;
        const countInSec = this.countInBeats * beatDurationSec;
        this._swarStartTime = ctx.currentTime + countInSec;
        
        await this.delay(countInSec * 1000);
        
        if (!this.isPlaying) return;
        
        await this.playSwarSequence(demoMode);
    }
    
    setSubdivision(n) {
        this.swarsPerBeat = Math.max(1, Math.min(4, n));
    }
    
    async playSwarSequence(demoMode) {
        const ctx = this.audioEngine.ctx;
        const beatDurationSec = 60.0 / this.tempo;
        const swarDurationSec = beatDurationSec / this.swarsPerBeat;
        const totalEvents = this.currentEvents.length;
        let prevBeat = -1;

        const noteDuration = computeNoteDuration(swarDurationSec);
        
        for (let i = 0; i < totalEvents; i++) {
            if (!this.isPlaying) break;
            
            const event = this.currentEvents[i];
            this.currentEventIndex = i;
            
            const scheduledTime = this._swarStartTime + i * swarDurationSec;
            
            const currentBeat = Math.floor(i / this.swarsPerBeat);
            if (currentBeat !== prevBeat) {
                prevBeat = currentBeat;
                if (this.onBeatCallback) {
                    this.onBeatCallback(currentBeat, i);
                }
            }
            
            this.swarSynth.playSwar(event.swar, noteDuration, scheduledTime);
            
            if (this.onSwarCallback) {
                this.onSwarCallback(event, i, totalEvents);
            }
            
            const waitUntil = scheduledTime + swarDurationSec;
            const waitMs = Math.max(0, (waitUntil - ctx.currentTime) * 1000);
            await this.delay(waitMs);
        }
        
        if (this.isPlaying) {
            if (this.onCompleteCallback) {
                this.onCompleteCallback();
            } else {
                this.stop();
            }
        }
    }
    
    stop() {
        this.isPlaying = false;
        
        if (this.tanpura) {
            this.tanpura.stop();
        }
        if (this.tabla) {
            this.tabla.stop();
        }
        
        if (this.playbackTimer) {
            clearTimeout(this.playbackTimer);
            this.playbackTimer = null;
        }
    }
    
    setTempo(bpm) {
        this.tempo = Math.max(PRACTICE_DEFAULTS.minTempo, Math.min(PRACTICE_DEFAULTS.maxTempo, bpm));
        if (this.tabla) {
            this.tabla.setTempo(this.tempo);
        }
    }
    
    onSwar(callback) {
        this.onSwarCallback = callback;
    }
    
    onBeat(callback) {
        this.onBeatCallback = callback;
    }
    
    onComplete(callback) {
        this.onCompleteCallback = callback;
    }
    
    toggleTanpura() {
        this._tanpuraEnabled = !this._tanpuraEnabled;
        if (this.isPlaying && this.tanpura) {
            if (this._tanpuraEnabled) {
                this.tanpura.start();
            } else {
                this.tanpura.stop();
            }
        }
        return this._tanpuraEnabled;
    }
    
    toggleTabla() {
        this._tablaEnabled = !this._tablaEnabled;
        if (this.isPlaying && this.tabla) {
            if (this._tablaEnabled) {
                const taal = this.currentExercise?.taal_id
                    ? window.exerciseManager?.getTaal(this.currentExercise.taal_id)
                    : null;
                if (taal) {
                    this.tabla.setTempo(this.tempo);
                    this.tabla.start(taal);
                }
            } else {
                this.tabla.stop();
            }
        }
        return this._tablaEnabled;
    }
    
    delay(ms) {
        return new Promise(resolve => {
            this.playbackTimer = setTimeout(resolve, ms);
        });
    }
}

// ============================================
// PITCH DETECTOR (YIN Algorithm)
// ============================================

class PitchDetector {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.analyser = null;
        this.mediaStream = null;
        this.isListening = false;
        this.onPitchCallback = null;
        this.animationFrame = null;
        
        // YIN parameters
        this.threshold = 0.1;
        this.bufferSize = 2048;
        
        // Calibration
        this.calibratedSaFreq = PRACTICE_DEFAULTS.baseSaFreq;
        this._saptakSemitones = 0;
    }
    
    async start() {
        if (this.isListening) return;
        
        await this.audioEngine.init();
        
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            
            const source = this.audioEngine.ctx.createMediaStreamSource(this.mediaStream);
            
            this.analyser = this.audioEngine.ctx.createAnalyser();
            this.analyser.fftSize = this.bufferSize * 2;
            this.analyser.smoothingTimeConstant = 0;
            
            source.connect(this.analyser);
            
            this.isListening = true;
            this.detectLoop();
            
            console.log('🎤 Pitch detection started');
        } catch (e) {
            console.error('Microphone access denied:', e);
            throw e;
        }
    }
    
    stop() {
        this.isListening = false;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(t => t.stop());
            this.mediaStream = null;
        }
    }
    
    detectLoop() {
        if (!this.isListening || !this.analyser) return;
        
        const buffer = new Float32Array(this.bufferSize);
        this.analyser.getFloatTimeDomainData(buffer);
        
        const pitch = this.yinDetect(buffer, this.audioEngine.ctx.sampleRate);
        
        if (pitch > 0 && this.onPitchCallback) {
            const swarInfo = this.freqToSwar(pitch);
            this.onPitchCallback({
                frequency: pitch,
                ...swarInfo,
                timestamp: performance.now()
            });
        }
        
        this.animationFrame = requestAnimationFrame(() => this.detectLoop());
    }
    
    /**
     * YIN pitch detection algorithm
     * More accurate than simple autocorrelation
     */
    yinDetect(buffer, sampleRate) {
        const bufferSize = buffer.length;
        const yinBuffer = new Float32Array(bufferSize / 2);
        
        // Check if signal is loud enough
        let rms = 0;
        for (let i = 0; i < bufferSize; i++) {
            rms += buffer[i] * buffer[i];
        }
        rms = Math.sqrt(rms / bufferSize);
        if (rms < 0.01) return -1; // Too quiet
        
        // Step 1 & 2: Compute difference function
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
        
        // Step 3: Absolute threshold
        let tau = 2;
        while (tau < bufferSize / 2) {
            if (yinBuffer[tau] < this.threshold) {
                while (tau + 1 < bufferSize / 2 && yinBuffer[tau + 1] < yinBuffer[tau]) {
                    tau++;
                }
                break;
            }
            tau++;
        }
        
        if (tau === bufferSize / 2) return -1;
        
        // Step 4: Parabolic interpolation
        let betterTau;
        const x0 = tau < 1 ? tau : tau - 1;
        const x2 = tau + 1 < bufferSize / 2 ? tau + 1 : tau;
        
        if (x0 === tau) {
            betterTau = yinBuffer[tau] <= yinBuffer[x2] ? tau : x2;
        } else if (x2 === tau) {
            betterTau = yinBuffer[tau] <= yinBuffer[x0] ? tau : x0;
        } else {
            const s0 = yinBuffer[x0];
            const s1 = yinBuffer[tau];
            const s2 = yinBuffer[x2];
            betterTau = tau + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
        }
        
        return sampleRate / betterTau;
    }
    
    /**
     * Convert frequency to nearest swar with cents error
     */
    freqToSwar(freq) {
        const baseSa = this.getEffectiveSaFreq();
        
        // First, check if frequency is close to any octave of Sa (within 50 cents)
        let testFreq = freq;
        let octave = 0;
        while (testFreq >= baseSa * 2) { testFreq /= 2; octave++; }
        while (testFreq < baseSa / 2) { testFreq *= 2; octave--; }
        
        const saCentsFromBelow = Math.abs(1200 * Math.log2(testFreq / baseSa));
        if (saCentsFromBelow < 50) {
            const cents = 1200 * Math.log2(freq / (baseSa * Math.pow(2, octave)));
            return {
                swar: octave > 0 ? '.Sa' : 'Sa',
                centsError: Math.round(cents),
                octaveShift: octave,
                expectedFreq: baseSa * Math.pow(2, octave)
            };
        }
        
        // Normalize frequency to range [baseSa, 2*baseSa)
        let normalizedFreq = freq;
        let octaveShift = 0;
        
        while (normalizedFreq >= baseSa * 2) {
            normalizedFreq /= 2;
            octaveShift++;
        }
        while (normalizedFreq < baseSa) {
            normalizedFreq *= 2;
            octaveShift--;
        }
        
        // Find closest swar
        let closestSwar = 'Sa';
        let minCents = Infinity;
        let closestRatio = 1;
        
        for (const swar of SWAR_LIST) {
            const targetFreq = baseSa * SWAR_RATIOS[swar];
            const cents = 1200 * Math.log2(normalizedFreq / targetFreq);
            
            if (Math.abs(cents) < Math.abs(minCents)) {
                minCents = cents;
                closestSwar = swar;
                closestRatio = SWAR_RATIOS[swar];
            }
        }
        
        // Handle upper octave Sa
        const upperSaFreq = baseSa * 2;
        const upperSaCents = 1200 * Math.log2(normalizedFreq / upperSaFreq);
        if (Math.abs(upperSaCents) < Math.abs(minCents)) {
            return {
                swar: '.Sa',
                centsError: Math.round(upperSaCents),
                octaveShift: octaveShift + 1,
                expectedFreq: upperSaFreq
            };
        }
        
        // Mark upper octave Sa with dot
        let swarName = closestSwar;
        if (closestSwar === 'Sa' && octaveShift > 0) {
            swarName = '.Sa';
        }
        
        return {
            swar: swarName,
            centsError: Math.round(minCents),
            octaveShift,
            expectedFreq: baseSa * closestRatio * Math.pow(2, octaveShift)
        };
    }
    
    calibrateSa(frequency) {
        this.calibratedSaFreq = frequency;
        console.log(`🎵 Sa calibrated to ${frequency.toFixed(2)} Hz`);
    }
    
    setSaptak(saptakSemitones) {
        this._saptakSemitones = saptakSemitones;
    }
    
    getEffectiveSaFreq() {
        return this.calibratedSaFreq * Math.pow(2, this._saptakSemitones / 12);
    }
    
    onPitch(callback) {
        this.onPitchCallback = callback;
    }
}

// ============================================
// ROBOT LISTENER (Grader)
// ============================================

class RobotListener {
    constructor(pitchDetector) {
        this.pitchDetector = pitchDetector;
        this.isListening = false;
        
        this.expectedEvents = [];
        this.detectedPitches = [];
        this.currentEventIndex = 0;
        
        this.tempo = 60;
        this.startTime = 0;
        this.swarsPerBeat = 1;
        
        this.timingWindowMs = 200; // Tolerance for timing
        this.centsThreshold = 50; // Cents tolerance for "correct"
        
        this.results = [];
        this.onGradeCallback = null;
        this.onCompleteCallback = null;
    }
    
    async startSession(exercise, events, tempo) {
        this.expectedEvents = events;
        this.tempo = tempo;
        this.swarsPerBeat = exercise.swars_per_beat || 1;
        this.detectedPitches = [];
        this.results = [];
        this.currentEventIndex = 0;
        
        // Set up pitch detection
        this.pitchDetector.onPitch(pitch => {
            this.detectedPitches.push(pitch);
            this.gradeRealtime(pitch);
        });
        
        await this.pitchDetector.start();
        this.isListening = true;
        this.startTime = performance.now();
        
        console.log('👂 Robot Listener started');
    }
    
    stopSession() {
        this.isListening = false;
        this.pitchDetector.stop();
        
        // Generate final report
        const report = this.generateReport();
        
        if (this.onCompleteCallback) {
            this.onCompleteCallback(report);
        }
        
        return report;
    }
    
    gradeRealtime(pitch) {
        if (!this.isListening || this.currentEventIndex >= this.expectedEvents.length) return;
        
        const elapsed = performance.now() - this.startTime;
        const beatDuration = 60000 / this.tempo;
        const swarDuration = beatDuration / this.swarsPerBeat;
        
        const expectedEvent = this.expectedEvents[this.currentEventIndex];
        const expectedTime = this.currentEventIndex * swarDuration;
        
        // Check if within timing window
        const timingError = elapsed - expectedTime;
        
        if (Math.abs(timingError) < this.timingWindowMs + swarDuration / 2) {
            // Check pitch accuracy
            const isCorrectSwar = pitch.swar === expectedEvent.swar || 
                                  (pitch.swar === 'Sa' && expectedEvent.swar === '.Sa' && pitch.octaveShift > 0);
            
            const isInTune = Math.abs(pitch.centsError) <= this.centsThreshold;
            
            const grade = {
                eventIndex: this.currentEventIndex,
                expectedSwar: expectedEvent.swar,
                detectedSwar: pitch.swar,
                isCorrectSwar,
                centsError: pitch.centsError,
                isInTune,
                timingErrorMs: Math.round(timingError),
                isOnTime: Math.abs(timingError) <= this.timingWindowMs,
                timestamp: pitch.timestamp
            };
            
            this.results.push(grade);
            
            if (this.onGradeCallback) {
                this.onGradeCallback(grade);
            }
            
            // Move to next event
            this.currentEventIndex++;
            
            // Check if complete
            if (this.currentEventIndex >= this.expectedEvents.length) {
                setTimeout(() => this.stopSession(), 500);
            }
        }
    }
    
    generateReport() {
        const total = this.expectedEvents.length;
        const graded = this.results.length;
        
        // Calculate scores
        const correctSwars = this.results.filter(r => r.isCorrectSwar).length;
        const inTune = this.results.filter(r => r.isInTune).length;
        const onTime = this.results.filter(r => r.isOnTime).length;
        
        const pitchScore = graded > 0 ? Math.round((correctSwars / graded) * 100) : 0;
        const tuningScore = graded > 0 ? Math.round((inTune / graded) * 100) : 0;
        const rhythmScore = graded > 0 ? Math.round((onTime / graded) * 100) : 0;
        const completionScore = Math.round((graded / total) * 100);
        
        // Overall score (weighted)
        const overallScore = Math.round(
            pitchScore * 0.4 + 
            tuningScore * 0.2 + 
            rhythmScore * 0.3 + 
            completionScore * 0.1
        );
        
        // Find mistakes
        const mistakes = this.results.filter(r => !r.isCorrectSwar || !r.isInTune || !r.isOnTime);
        
        // Recommendation
        let recommendation = '';
        if (overallScore >= 90) {
            recommendation = 'Excellent! Try increasing the tempo.';
        } else if (overallScore >= 70) {
            recommendation = 'Good progress! Focus on the marked mistakes.';
        } else if (pitchScore < 60) {
            recommendation = 'Practice with Robot Demo first. Focus on pitch accuracy.';
        } else if (rhythmScore < 60) {
            recommendation = 'Try a slower tempo to improve timing.';
        } else {
            recommendation = 'Keep practicing! Repeat this exercise.';
        }
        
        return {
            total,
            graded,
            scores: {
                pitch: pitchScore,
                tuning: tuningScore,
                rhythm: rhythmScore,
                completion: completionScore,
                overall: overallScore
            },
            mistakes,
            results: this.results,
            recommendation
        };
    }
    
    onGrade(callback) {
        this.onGradeCallback = callback;
    }
    
    onComplete(callback) {
        this.onCompleteCallback = callback;
    }
}

// ============================================
// ROBOT SESSION (Main Flow)
// ============================================

class RobotSession {
    constructor(exerciseManager, robotPlayer, robotListener) {
        this.exerciseManager = exerciseManager;
        this.robotPlayer = robotPlayer;
        this.robotListener = robotListener;
        
        this.currentExercise = null;
        this.currentEvents = [];
        this.tempo = PRACTICE_DEFAULTS.tempo;
        this.state = 'idle';
        this.currentMode = PRACTICE_MODES.SING_ALONG;
        this._beatCursorInterval = null;
        
        this.onStateChangeCallback = null;
        this.onReportCallback = null;
        this.onBeatCallback = null;
    }
    
    selectExercise(exerciseId) {
        const exercise = this.exerciseManager.getExerciseById(exerciseId);
        if (!exercise) {
            throw new Error(`Exercise not found: ${exerciseId}`);
        }
        
        this.currentExercise = exercise;
        this.currentEvents = this.exerciseManager.flattenExercise(exercise);
        this.tempo = exercise.tempo_bpm || PRACTICE_DEFAULTS.tempo;
        
        this.robotPlayer.setExercise(exercise, this.currentEvents);
        
        return { exercise, events: this.currentEvents };
    }
    
    setTempo(bpm) {
        this.tempo = bpm;
        this.robotPlayer.setTempo(bpm);
    }
    
    setSubdivision(n) {
        this.robotPlayer.setSubdivision(n);
    }
    
    async startSession(mode) {
        if (this.state !== 'idle') {
            this.stop();
        }
        
        this.currentMode = mode || PRACTICE_MODES.SING_ALONG;
        
        this.robotPlayer.onSwar((event, index, total) => {
            if (this.onSwarCallback) {
                this.onSwarCallback(event, index, total);
            }
        });
        
        this.robotPlayer.onBeat((beatIndex, swarIndex) => {
            if (this.onBeatCallback) {
                this.onBeatCallback(beatIndex, swarIndex);
            }
        });
        
        switch (this.currentMode) {
            case PRACTICE_MODES.SING_ALONG:
                await this._runSingAlong();
                break;
            case PRACTICE_MODES.GUIDED:
                await this._runGuidedPractice();
                break;
            case PRACTICE_MODES.SELF:
                await this._runSelfPractice();
                break;
        }
    }
    
    async _runSingAlong() {
        this.setState('singAlong');
        this._demoLooping = true;
        
        this.robotPlayer.onComplete(() => {
            if (this._demoLooping && this.state === 'singAlong') {
                this.robotPlayer.currentEventIndex = 0;
                this.robotPlayer.isPlaying = false;
                if (this._demoLooping) {
                    this.robotPlayer.play({
                        withTanpura: false,
                        withTabla: false,
                        demoMode: true
                    });
                }
            }
        });
        
        await this.robotPlayer.play({
            withTanpura: true,
            withTabla: true,
            demoMode: true
        });
    }
    
    async _runGuidedPractice() {
        this.setState('counting');
        
        this.robotPlayer.onComplete(null);
        
        // Demo phase: robot plays once
        this.setState('demoPhase');
        await this.robotPlayer.play({
            withTanpura: true,
            withTabla: true,
            demoMode: true
        });
        
        if (this.state !== 'demoPhase') return;
        
        // Brief transition
        const beatDuration = 60000 / this.tempo;
        await new Promise(resolve => setTimeout(resolve, beatDuration));
        
        if (this.state === 'idle') return;
        
        // Practice phase with grading
        this.robotPlayer.onComplete(() => {
            setTimeout(() => {
                const report = this.robotListener.stopSession();
                this.setState('complete');
                if (this.onReportCallback) {
                    this.onReportCallback(report);
                }
            }, 1000);
        });
        
        await this.robotListener.startSession(
            this.currentExercise,
            this.currentEvents,
            this.tempo
        );
        
        this.robotListener.onGrade(grade => {
            if (this.onGradeCallback) {
                this.onGradeCallback(grade);
            }
        });
        
        this.setState('practice');
        
        this.robotPlayer.isPlaying = false;
        this.robotPlayer.currentEventIndex = 0;
        await this.robotPlayer.play({
            withTanpura: false,
            withTabla: false,
            demoMode: false
        });
    }
    
    async _runSelfPractice() {
        this.setState('selfPractice');
        
        // Start accompaniment directly, no swar playback
        await this.robotPlayer.audioEngine.init();
        
        const defaults = window.exerciseManager?.getAccompanimentDefaults() || {};
        
        if (this.robotPlayer._tanpuraEnabled && this.robotPlayer.tanpura) {
            if (typeof this.robotPlayer.tanpura.setVolume === 'function') {
                this.robotPlayer.tanpura.setVolume(defaults.tanpuraVolume ?? PRACTICE_DEFAULTS.tanpuraVolume);
            }
            await this.robotPlayer.tanpura.start();
        }
        
        const taal = this.currentExercise?.taal_id
            ? window.exerciseManager?.getTaal(this.currentExercise.taal_id)
            : null;
        
        if (this.robotPlayer._tablaEnabled && this.robotPlayer.tabla && taal) {
            if (typeof this.robotPlayer.tabla.setVolume === 'function') {
                this.robotPlayer.tabla.setVolume(defaults.tablaVolume ?? PRACTICE_DEFAULTS.tablaVolume);
            }
            this.robotPlayer.tabla.setTempo(this.tempo);
            await this.robotPlayer.tabla.start(taal);
        }
        
        this.robotPlayer.isPlaying = true;
        this._startBeatCursor();
    }
    
    _startBeatCursor() {
        const subdivision = this.robotPlayer.swarsPerBeat || 1;
        const totalBeats = Math.ceil(this.currentEvents.length / subdivision);
        const beatDurationSec = 60.0 / this.tempo;
        let beatIdx = 0;
        const startTime = performance.now();
        
        const pump = () => {
            if (this.state === 'idle') {
                this._beatCursorInterval = null;
                return;
            }
            const elapsed = (performance.now() - startTime) / 1000;
            const expectedBeat = Math.floor(elapsed / beatDurationSec);
            
            while (beatIdx <= expectedBeat) {
                const displayBeat = beatIdx % totalBeats;
                if (this.onBeatCallback) {
                    this.onBeatCallback(displayBeat, displayBeat * subdivision);
                }
                beatIdx++;
            }
            
            this._beatCursorInterval = requestAnimationFrame(pump);
        };
        
        this._beatCursorInterval = requestAnimationFrame(pump);
    }
    
    stop() {
        this._demoLooping = false;
        
        if (this._beatCursorInterval) {
            cancelAnimationFrame(this._beatCursorInterval);
            this._beatCursorInterval = null;
        }
        
        this.robotPlayer.stop();
        
        if (this.robotListener.isListening) {
            const report = this.robotListener.stopSession();
            if (this.currentMode === PRACTICE_MODES.SING_ALONG && report && report.graded > 0) {
                this.setState('complete');
                if (this.onReportCallback) {
                    this.onReportCallback(report);
                }
                return;
            }
        }
        
        this.setState('idle');
    }
    
    setState(state) {
        this.state = state;
        if (this.onStateChangeCallback) {
            this.onStateChangeCallback(state);
        }
    }
    
    onStateChange(callback) {
        this.onStateChangeCallback = callback;
    }
    
    onSwar(callback) {
        this.onSwarCallback = callback;
    }
    
    onGrade(callback) {
        this.onGradeCallback = callback;
    }
    
    onBeat(callback) {
        this.onBeatCallback = callback;
    }
    
    onReport(callback) {
        this.onReportCallback = callback;
    }
    
    toggleTanpura() {
        return this.robotPlayer.toggleTanpura();
    }
    
    toggleTabla() {
        return this.robotPlayer.toggleTabla();
    }
}

// Export
window.PRACTICE_MODES = PRACTICE_MODES;
window.ExerciseManager = ExerciseManager;
window.RobotPlayer = RobotPlayer;
window.PitchDetector = PitchDetector;
window.RobotListener = RobotListener;
window.RobotSession = RobotSession;

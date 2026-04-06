/**
 * SwarSadhana Realistic Audio Engine
 * 
 * Advanced audio synthesis for authentic Indian Classical instrument sounds
 * Uses physical modeling and spectral synthesis techniques
 */

const SAPTAK = Object.freeze({
    MANDRA: 'MANDRA',
    MADHYA: 'MADHYA',
    TAAR: 'TAAR',
});

const SAPTAK_SEMITONES = Object.freeze({
    [SAPTAK.MANDRA]: -12,
    [SAPTAK.MADHYA]: 0,
    [SAPTAK.TAAR]: 12,
});

function saptakToSemitones(saptak) {
    return SAPTAK_SEMITONES[saptak] ?? 0;
}

class RealisticAudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.compressor = null;
        this.convolver = null; // Room reverb
        this.initialized = false;
        
        this.baseSaFreq = PRACTICE_DEFAULTS.baseSaFreq;
        this.currentKey = PRACTICE_DEFAULTS.key;
        this.currentSaptak = PRACTICE_DEFAULTS.saptak;
        
        this.swarRatios = SWAR_RATIOS;
    }
    
    async init() {
        if (this.initialized) {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            return;
        }
        
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 48000,
                latencyHint: 'interactive'
            });
            
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            
            // Master compressor for consistent levels
            this.compressor = this.ctx.createDynamicsCompressor();
            this.compressor.threshold.value = -24;
            this.compressor.knee.value = 12;
            this.compressor.ratio.value = 4;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;
            
            // Room reverb for ambience
            await this.createRoomReverb();
            
            // Master gain
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.8;
            
            // Signal chain: source -> compressor -> reverb -> master -> output
            this.compressor.connect(this.convolver);
            this.convolver.connect(this.masterGain);
            this.masterGain.connect(this.ctx.destination);
            
            // Also create dry path for tabla (less reverb)
            this.dryGain = this.ctx.createGain();
            this.dryGain.gain.value = 0.7;
            this.dryGain.connect(this.masterGain);
            
            this.initialized = true;
            console.log('✅ Realistic Audio Engine initialized');
        } catch (e) {
            console.error('❌ Audio init failed:', e);
            throw e;
        }
    }
    
    async createRoomReverb() {
        // Create realistic room impulse response
        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * 2.5; // 2.5 second reverb tail
        const impulse = this.ctx.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                // Early reflections (first 50ms)
                const earlyReflection = i < sampleRate * 0.05 
                    ? Math.random() * 0.5 
                    : 0;
                
                // Late reverb with exponential decay
                const t = i / sampleRate;
                const decay = Math.exp(-3 * t);
                const diffusion = (Math.random() * 2 - 1) * decay;
                
                // Add some modulation for warmth
                const mod = 1 + 0.002 * Math.sin(2 * Math.PI * 0.5 * t);
                
                channelData[i] = (earlyReflection + diffusion * 0.4) * mod;
            }
        }
        
        this.convolver = this.ctx.createConvolver();
        this.convolver.buffer = impulse;
    }
    
    setKey(key) {
        const keyFreqs = {
            'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
            'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
            'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
        };
        this.currentKey = key;
        this.baseSaFreq = keyFreqs[key] || PRACTICE_DEFAULTS.baseSaFreq;
    }
    
    setSaptak(saptak) {
        this.currentSaptak = saptak;
    }
    
    getSaptakSemitones() {
        return saptakToSemitones(this.currentSaptak);
    }
    
    getSwarFreq(swarName, octaveShift = 0) {
        const ratio = this.swarRatios[swarName] || 1;
        const saptakShift = this.getSaptakSemitones() / 12;
        return this.baseSaFreq * ratio * Math.pow(2, octaveShift + saptakShift);
    }
}

/**
 * Realistic Tanpura Engine (Sample-based)
 * 
 * Plays pre-recorded tanpura drone MP3s from Ragajunglism.
 * Each key (C through B) has its own recording for Sa-Pa and Sa-Ma tunings.
 * Loops seamlessly with crossfade on key/string changes.
 */
class RealisticTanpuraEngine {
    constructor(audioEngine) {
        this.engine = audioEngine;
        this.isPlaying = false;
        this.volume = 0.7;
        this.stringConfig = 'pa'; // pa, ma, ni
        this.outputGain = null;
        
        this.currentSource = null;
        this.currentBuffer = null;
        this.bufferCache = {};
        
        this.keyMap = {
            'C': 'c', 'C#': 'db', 'Db': 'db', 'D': 'd', 'D#': 'eb', 'Eb': 'eb',
            'E': 'e', 'F': 'f', 'F#': 'gb', 'Gb': 'gb', 'G': 'g',
            'G#': 'ab', 'Ab': 'ab', 'A': 'a', 'A#': 'bb', 'Bb': 'bb', 'B': 'b'
        };
    }
    
    _getAssetUrl() {
        const keyName = this.keyMap[this.engine.currentKey] || 'c';
        const tuning = this.stringConfig === 'ma' ? 'ma_sa' : 'pa_sa';
        return `assets/audio/tanpura/${tuning}_${keyName}.mp3`;
    }
    
    async _loadBuffer(url) {
        if (this.bufferCache[url]) return this.bufferCache[url];
        
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.engine.ctx.decodeAudioData(arrayBuffer);
        this.bufferCache[url] = audioBuffer;
        return audioBuffer;
    }
    
    async start() {
        if (this.isPlaying) return;
        
        await this.engine.init();
        
        this.outputGain = this.engine.ctx.createGain();
        this.outputGain.gain.value = this.volume;
        this.outputGain.connect(this.engine.compressor);
        
        this.isPlaying = true;
        
        try {
            const url = this._getAssetUrl();
            this.currentBuffer = await this._loadBuffer(url);
            this._startPlayback();
            console.log('Tanpura started (sample):', url);
        } catch (e) {
            console.error('Failed to load tanpura drone:', e);
            this.isPlaying = false;
        }
    }
    
    _startPlayback() {
        if (!this.isPlaying || !this.currentBuffer || !this.engine.ctx) return;
        
        this._stopSource();
        
        const source = this.engine.ctx.createBufferSource();
        source.buffer = this.currentBuffer;
        source.loop = true;
        source.connect(this.outputGain);
        source.start(0);
        this.currentSource = source;
    }
    
    _stopSource() {
        if (this.currentSource) {
            try { this.currentSource.stop(); } catch (e) {}
            try { this.currentSource.disconnect(); } catch (e) {}
            this.currentSource = null;
        }
    }
    
    stop() {
        this.isPlaying = false;
        
        if (this.outputGain) {
            const ctx = this.engine.ctx;
            this.outputGain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
            setTimeout(() => {
                this._stopSource();
                if (this.outputGain) {
                    this.outputGain.gain.value = this.volume;
                }
            }, 1000);
        } else {
            this._stopSource();
        }
    }
    
    async _crossfadeToNew() {
        if (!this.isPlaying || !this.engine.ctx) return;
        
        const ctx = this.engine.ctx;
        const url = this._getAssetUrl();
        
        try {
            const newBuffer = await this._loadBuffer(url);
            
            // Create new source
            const newGain = ctx.createGain();
            newGain.gain.setValueAtTime(0, ctx.currentTime);
            newGain.connect(this.outputGain);
            
            const newSource = ctx.createBufferSource();
            newSource.buffer = newBuffer;
            newSource.loop = true;
            newSource.connect(newGain);
            newSource.start(0);
            
            // Crossfade: new in, old out over 500ms
            newGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.5);
            
            const oldSource = this.currentSource;
            if (oldSource) {
                const oldGain = ctx.createGain();
                oldGain.gain.setValueAtTime(1, ctx.currentTime);
                oldGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
                
                setTimeout(() => {
                    try { oldSource.stop(); } catch (e) {}
                    try { oldSource.disconnect(); } catch (e) {}
                    // Reconnect new source directly (remove extra gain node)
                    try { newSource.disconnect(); } catch (e) {}
                    newSource.connect(this.outputGain);
                    try { newGain.disconnect(); } catch (e) {}
                }, 600);
            }
            
            this.currentSource = newSource;
            this.currentBuffer = newBuffer;
        } catch (e) {
            console.error('Crossfade failed:', e);
        }
    }
    
    setVolume(v) {
        this.volume = v;
        if (this.outputGain) {
            this.outputGain.gain.setTargetAtTime(v, this.engine.ctx.currentTime, 0.05);
        }
    }
    
    setJivari(amount) {
        // No-op for sample-based engine (jivari is baked into recordings)
    }
    
    setStringConfig(config) {
        const oldConfig = this.stringConfig;
        this.stringConfig = config;
        if (this.isPlaying && oldConfig !== config) {
            this._crossfadeToNew();
        }
    }
    
    onKeyChange() {
        if (this.isPlaying) {
            this._crossfadeToNew();
        }
    }
}

/**
 * Sample-Based Tabla Engine (TablaKit)
 *
 * Plays pre-recorded one-shot WAV samples from assets/audio/tabla/oneshots/.
 * Features:
 *   - Round-robin v1/v2 per bol for natural variation
 *   - Accent gain hierarchy: sam (1.3×) > tali (1.1×) > normal (1.0×) > khali (0.85×)
 *   - AudioContext.currentTime look-ahead scheduler (no setInterval drift)
 */
class RealisticTablaEngine {
    constructor(audioEngine) {
        this.engine = audioEngine;
        this.isPlaying = false;
        this.volume = 0.8;
        this.tempo = 60;
        this.currentTaal = null;
        this.currentMatra = 0;
        this.intervalId = null;
        this.outputGain = null;
        this.onBeatCallback = null;
        this.nextBeatTime = 0;

        this.sampleBuffers = {};   // { "dha_v1": AudioBuffer, ... }
        this.roundRobin = {};      // { "dha": 0|1, ... }
        this._samplesLoaded = false;
    }

    async _loadSamples() {
        if (this._samplesLoaded) return;

        const bols = ['dha', 'dhin', 'tin', 'na', 'ta', 'ge', 'ke'];
        const variants = ['v1', 'v2'];
        const ctx = this.engine.ctx;
        const basePath = 'assets/audio/tabla/oneshots';

        const loads = [];
        for (const bol of bols) {
            this.roundRobin[bol] = 0;
            for (const v of variants) {
                const key = `${bol}_${v}`;
                const url = `${basePath}/${bol}/${v}.wav`;
                loads.push(
                    fetch(url)
                        .then(r => {
                            if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
                            return r.arrayBuffer();
                        })
                        .then(buf => ctx.decodeAudioData(buf))
                        .then(decoded => { this.sampleBuffers[key] = decoded; })
                        .catch(err => console.warn(`TablaKit: failed to load ${key}:`, err))
                );
            }
        }
        await Promise.all(loads);
        this._samplesLoaded = true;
        console.log('🥁 TablaKit samples loaded:', Object.keys(this.sampleBuffers).length);
    }

    async start(taal) {
        if (this.isPlaying) return;

        await this.engine.init();
        await this._loadSamples();

        this.currentTaal = taal;
        this.currentMatra = 0;

        this.outputGain = this.engine.ctx.createGain();
        this.outputGain.gain.value = this.volume;
        this.outputGain.connect(this.engine.dryGain);

        this.isPlaying = true;
        this.nextBeatTime = this.engine.ctx.currentTime;
        this._scheduleLoop();

        console.log('🥁 TablaKit started:', taal.name);
    }

    stop() {
        this.isPlaying = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.currentMatra = 0;
    }

    _scheduleLoop() {
        const LOOK_AHEAD = 0.1;
        const PUMP_MS = 25;

        const pump = () => {
            if (!this.isPlaying || !this.currentTaal) return;

            const ctx = this.engine.ctx;
            const bols = this.currentTaal.bols ||
                this.currentTaal.theka?.split(' ').filter(b => b && b !== '|');
            if (!bols || bols.length === 0) return;

            const matras = this.currentTaal.beats || this.currentTaal.matras || 16;
            const beatDuration = 60.0 / this.tempo;

            while (this.nextBeatTime < ctx.currentTime + LOOK_AHEAD) {
                const bol = bols[this.currentMatra];
                const isSam = this.currentMatra === 0;
                const isTali = (this.currentTaal.tali_beats || this.currentTaal.talis || [])
                    .includes(this.currentMatra + 1);
                const isKhali = (this.currentTaal.khali_beats || this.currentTaal.khalis || [])
                    .includes(this.currentMatra + 1);

                this.playBol(bol, isSam, isTali, isKhali, this.nextBeatTime);

                if (this.onBeatCallback) {
                    this.onBeatCallback(this.currentMatra, isSam, bol, isTali, isKhali);
                }

                this.currentMatra = (this.currentMatra + 1) % matras;
                this.nextBeatTime += beatDuration;
            }
        };

        pump();
        this.intervalId = setInterval(pump, PUMP_MS);
    }

    /**
     * Map a theka bol string (Devanagari or ASCII) to the canonical sample name.
     */
    _resolveBolName(bol) {
        const b = (bol || '').toLowerCase();
        const map = [
            [['धा', 'dha'],          'dha'],
            [['धिं', 'धी', 'dhin', 'dhi'], 'dhin'],
            [['तिं', 'tin'],         'tin'],
            [['ना', 'na', 'ne'],     'na'],
            [['ता', 'ta', 'te'],     'ta'],
            [['गे', 'घे', 'ge', 'ghe'], 'ge'],
            [['के', 'ke'],           'ke'],
        ];
        for (const [patterns, canonical] of map) {
            if (patterns.some(p => bol?.includes(p) || b.includes(p))) {
                return canonical;
            }
        }
        return 'na'; // fallback
    }

    playBol(bol, isSam, isTali, isKhali, startTime) {
        if (!this.engine.ctx || !this.outputGain) return;
        const ctx = this.engine.ctx;
        const when = startTime ?? ctx.currentTime;

        const bolName = this._resolveBolName(bol);

        const variantIndex = this.roundRobin[bolName] || 0;
        this.roundRobin[bolName] = 1 - variantIndex;
        const key = `${bolName}_v${variantIndex + 1}`;

        const buffer = this.sampleBuffers[key];
        if (!buffer) return;

        let accentGain = 1.0;
        if (isSam)        accentGain = 1.3;
        else if (isTali)  accentGain = 1.1;
        else if (isKhali) accentGain = 0.85;

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const gain = ctx.createGain();
        gain.gain.value = accentGain;

        source.connect(gain);
        gain.connect(this.outputGain);
        source.start(when);
    }

    setTempo(bpm) {
        this.tempo = Math.max(30, Math.min(300, bpm));
    }

    setVolume(v) {
        this.volume = v;
        if (this.outputGain) {
            this.outputGain.gain.setTargetAtTime(v, this.engine.ctx.currentTime, 0.05);
        }
    }

    onBeat(callback) {
        this.onBeatCallback = callback;
    }
}

/**
 * Realistic Swar (Note) Synthesizer
 * 
 * Formant synthesis for voice-like sounds
 * Can also produce harmonium-like tones
 */
class RealisticSwarSynth {
    constructor(audioEngine) {
        this.engine = audioEngine;
        this.activeNotes = [];
        this.volume = 0.6;
        this.outputGain = null;
        this.player = null;
        this.preset = null;
        this._activeEnvelope = null;
        this._activeOsc = null;
        
        this.swarSemitones = SWAR_SEMITONES;
    }
    
    async init() {
        await this.engine.init();
        
        this.outputGain = this.engine.ctx.createGain();
        this.outputGain.gain.value = this.volume;
        this.outputGain.connect(this.engine.compressor);
        
        if (typeof WebAudioFontPlayer !== 'undefined') {
            this.player = new WebAudioFontPlayer();
            this.player.afterTime = 0.15;
            if (typeof _tone_0210_FluidR3_GM_sf2_file !== 'undefined') {
                this.preset = _tone_0210_FluidR3_GM_sf2_file;
                this.player.adjustPreset(this.engine.ctx, this.preset);
            }
        }
    }
    
    _swarToMidi(swarName) {
        const baseSaFreq = this.engine.baseSaFreq || PRACTICE_DEFAULTS.baseSaFreq;
        const baseMidi = freqToMidi(baseSaFreq);
        const offset = this.swarSemitones[swarName];
        if (offset === undefined) return null;
        const saptakShift = this.engine.getSaptakSemitones();
        return baseMidi + offset + saptakShift;
    }
    
    _cancelActiveNote(fadeTime) {
        cancelActiveNote(this._activeEnvelope, this._activeOsc, fadeTime);
        this._activeEnvelope = null;
        this._activeOsc = null;
    }

    playSwar(swarName, duration = 0.5, startTime = null) {
        if (!this.engine.ctx) return null;
        if (!swarName || swarName === '-') return null;
        
        const ctx = this.engine.ctx;
        const now = startTime || ctx.currentTime;
        
        const midiNote = this._swarToMidi(swarName);
        if (midiNote === null) return null;

        this._cancelActiveNote(now);
        
        if (this.player && this.preset) {
            const envelope = this.player.queueWaveTable(
                ctx, this.outputGain, this.preset, now, midiNote, duration, this.volume
            );
            this._activeEnvelope = envelope;
            return { envelope, stopTime: now + duration };
        }
        
        // Fallback: simple oscillator
        const freq = this.engine.getSwarFreq(swarName);
        if (!freq) return null;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.volume * 0.3, now + NOTE_ARTICULATION.ATTACK_SEC);
        gain.gain.setValueAtTime(this.volume * 0.3, now + duration - NOTE_ARTICULATION.RELEASE_SEC);
        gain.gain.linearRampToValueAtTime(0, now + duration);
        osc.connect(gain);
        gain.connect(this.outputGain);
        osc.start(now);
        osc.stop(now + duration + 0.01);
        this._activeOsc = { gain, osc };
        
        return { stopTime: now + duration };
    }
    
    setVolume(v) {
        this.volume = v;
        if (this.outputGain) {
            this.outputGain.gain.setTargetAtTime(v, this.engine.ctx.currentTime, 0.05);
        }
    }
}

// Export to window
window.SAPTAK = SAPTAK;
window.SAPTAK_SEMITONES = SAPTAK_SEMITONES;
window.saptakToSemitones = saptakToSemitones;
window.RealisticAudioEngine = RealisticAudioEngine;
window.RealisticTanpuraEngine = RealisticTanpuraEngine;
window.RealisticTablaEngine = RealisticTablaEngine;
window.RealisticSwarSynth = RealisticSwarSynth;

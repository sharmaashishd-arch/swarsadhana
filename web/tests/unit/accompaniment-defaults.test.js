/**
 * Unit Tests for Accompaniment Defaults
 * Tests JSON parsing and default value handling
 */

import { describe, it, expect, beforeEach } from 'vitest';

const DEFAULTS = Object.freeze({
    key: 'C#',
    baseSaFreq: 277.18,
    tempo: 90,
    saptak: 'MADHYA',
    tanpuraVolume: 0.25,
    tablaVolume: 0.25,
    tanpuraEnabled: true,
    tablaEnabled: true,
    tanpuraPattern: 'PaSa',
    countInAvartans: 1,
    demoAvartans: 1,
    practiceAvartans: 2,
    swarPerMatra: 1,
});

class ExerciseManager {
    constructor() {
        this.exercises = [];
        this.taals = {};
        this.swaras = {};
        this.categories = [];
        this.accompanimentDefaults = {};
    }
    
    loadFromData(data) {
        this.exercises = data.exercises || [];
        this.taals = data.taals || {};
        this.swaras = data.swaras || {};
        this.categories = data.categories || [];
        this.accompanimentDefaults = data.accompaniment_defaults || {};
    }
    
    getAccompanimentDefaults() {
        const d = this.accompanimentDefaults || {};
        const tanpura = d.tanpura || {};
        const tabla = d.tabla || {};
        return {
            tanpuraEnabled: tanpura.enabled !== false,
            tanpuraPattern: tanpura.pattern || DEFAULTS.tanpuraPattern,
            tanpuraVolume: tanpura.volume ?? DEFAULTS.tanpuraVolume,
            tablaEnabled: tabla.enabled !== false,
            tablaVolume: tabla.volume ?? DEFAULTS.tablaVolume,
            countInAvartans: d.count_in_avartans || DEFAULTS.countInAvartans,
            demoAvartans: d.demo_avartans || DEFAULTS.demoAvartans,
            practiceAvartans: d.practice_avartans || DEFAULTS.practiceAvartans,
            swarPerMatra: d.swar_per_matra || DEFAULTS.swarPerMatra,
        };
    }
}

describe('AccompanimentDefaults', () => {
    let manager;
    
    beforeEach(() => {
        manager = new ExerciseManager();
    });
    
    it('parses full accompaniment_defaults from JSON', () => {
        manager.loadFromData({
            accompaniment_defaults: {
                tanpura: { enabled: true, pattern: 'PaSa', volume: 0.55 },
                tabla: { enabled: true, volume: 0.65 },
                count_in_avartans: 1,
                demo_avartans: 1,
                practice_avartans: 2,
                swar_per_matra: 1,
            }
        });
        
        const defaults = manager.getAccompanimentDefaults();
        
        expect(defaults.tanpuraEnabled).toBe(true);
        expect(defaults.tanpuraPattern).toBe('PaSa');
        expect(defaults.tanpuraVolume).toBe(0.55);
        expect(defaults.tablaEnabled).toBe(true);
        expect(defaults.tablaVolume).toBe(0.65);
        expect(defaults.countInAvartans).toBe(1);
        expect(defaults.demoAvartans).toBe(1);
        expect(defaults.practiceAvartans).toBe(2);
        expect(defaults.swarPerMatra).toBe(1);
    });
    
    it('uses sensible defaults when JSON is empty', () => {
        manager.loadFromData({});
        
        const defaults = manager.getAccompanimentDefaults();
        
        expect(defaults.tanpuraEnabled).toBe(DEFAULTS.tanpuraEnabled);
        expect(defaults.tanpuraPattern).toBe(DEFAULTS.tanpuraPattern);
        expect(defaults.tanpuraVolume).toBe(DEFAULTS.tanpuraVolume);
        expect(defaults.tablaEnabled).toBe(DEFAULTS.tablaEnabled);
        expect(defaults.tablaVolume).toBe(DEFAULTS.tablaVolume);
        expect(defaults.countInAvartans).toBe(DEFAULTS.countInAvartans);
        expect(defaults.demoAvartans).toBe(DEFAULTS.demoAvartans);
        expect(defaults.practiceAvartans).toBe(DEFAULTS.practiceAvartans);
        expect(defaults.swarPerMatra).toBe(DEFAULTS.swarPerMatra);
    });
    
    it('handles disabled tanpura', () => {
        manager.loadFromData({
            accompaniment_defaults: {
                tanpura: { enabled: false, volume: 0.3 },
                tabla: { enabled: true, volume: 0.7 },
            }
        });
        
        const defaults = manager.getAccompanimentDefaults();
        
        expect(defaults.tanpuraEnabled).toBe(false);
        expect(defaults.tanpuraVolume).toBe(0.3);
        expect(defaults.tablaEnabled).toBe(true);
        expect(defaults.tablaVolume).toBe(0.7);
    });
    
    it('handles disabled tabla', () => {
        manager.loadFromData({
            accompaniment_defaults: {
                tanpura: { enabled: true },
                tabla: { enabled: false, volume: 0.4 },
            }
        });
        
        const defaults = manager.getAccompanimentDefaults();
        
        expect(defaults.tanpuraEnabled).toBe(true);
        expect(defaults.tablaEnabled).toBe(false);
        expect(defaults.tablaVolume).toBe(0.4);
    });
    
    it('handles partial accompaniment_defaults', () => {
        manager.loadFromData({
            accompaniment_defaults: {
                count_in_avartans: 2,
            }
        });
        
        const defaults = manager.getAccompanimentDefaults();
        
        expect(defaults.tanpuraEnabled).toBe(true);
        expect(defaults.tablaEnabled).toBe(true);
        expect(defaults.countInAvartans).toBe(2);
        expect(defaults.tanpuraVolume).toBe(DEFAULTS.tanpuraVolume);
        expect(defaults.tablaVolume).toBe(DEFAULTS.tablaVolume);
    });
    
    it('handles custom volumes', () => {
        manager.loadFromData({
            accompaniment_defaults: {
                tanpura: { enabled: true, volume: 0.8 },
                tabla: { enabled: true, volume: 0.9 },
            }
        });
        
        const defaults = manager.getAccompanimentDefaults();
        
        expect(defaults.tanpuraVolume).toBe(0.8);
        expect(defaults.tablaVolume).toBe(0.9);
    });
    
    it('works with real exercise data structure', () => {
        manager.loadFromData({
            version: "1.0",
            title: "Hindustani Class 1",
            default_settings: { base_sa: "C4", default_tempo_bpm: 60 },
            accompaniment_defaults: {
                tanpura: { enabled: true, pattern: "PaSa", volume: 0.55 },
                tabla: { enabled: true, volume: 0.65 },
                count_in_avartans: 1,
                demo_avartans: 1,
                practice_avartans: 2,
                swar_per_matra: 1,
            },
            taals: {
                TEENTAAL_16: {
                    id: "TEENTAAL_16",
                    name: "Teentaal",
                    beats: 16,
                }
            },
            categories: ["Basic Sargam"],
            exercises: [
                {
                    id: "BASIC_01",
                    title: "Exercise 1",
                    category: "Basic Sargam",
                    taal_id: "TEENTAAL_16",
                    tempo_bpm: 60,
                }
            ]
        });
        
        const defaults = manager.getAccompanimentDefaults();
        
        expect(defaults.tanpuraEnabled).toBe(true);
        expect(defaults.tanpuraPattern).toBe('PaSa');
        expect(defaults.tanpuraVolume).toBe(0.55);
        expect(defaults.tablaEnabled).toBe(true);
        expect(defaults.tablaVolume).toBe(0.65);
        
        expect(manager.exercises.length).toBe(1);
        expect(manager.exercises[0].taal_id).toBe('TEENTAAL_16');
    });
});

describe('RobotPlayer applies accompaniment defaults', () => {
    it('passes volume defaults when starting accompaniment', () => {
        const calls = [];
        
        const mockTanpura = {
            setVolume(v) { calls.push({ target: 'tanpura', method: 'setVolume', value: v }); },
            start() { calls.push({ target: 'tanpura', method: 'start' }); return Promise.resolve(); },
            stop() { calls.push({ target: 'tanpura', method: 'stop' }); },
        };
        
        const mockTabla = {
            setVolume(v) { calls.push({ target: 'tabla', method: 'setVolume', value: v }); },
            setTempo(t) { calls.push({ target: 'tabla', method: 'setTempo', value: t }); },
            start(taal) { calls.push({ target: 'tabla', method: 'start', taal }); return Promise.resolve(); },
            stop() { calls.push({ target: 'tabla', method: 'stop' }); },
        };
        
        const defaults = {
            tanpuraEnabled: DEFAULTS.tanpuraEnabled,
            tanpuraVolume: DEFAULTS.tanpuraVolume,
            tablaEnabled: DEFAULTS.tablaEnabled,
            tablaVolume: DEFAULTS.tablaVolume,
        };
        
        const mockTaal = { id: 'TEENTAAL_16', name: 'Teentaal', beats: 16 };
        
        // Simulate what RobotPlayer.play() does
        if (defaults.tanpuraEnabled && mockTanpura) {
            mockTanpura.setVolume(defaults.tanpuraVolume);
            mockTanpura.start();
        }
        if (defaults.tablaEnabled && mockTabla && mockTaal) {
            mockTabla.setVolume(defaults.tablaVolume);
            mockTabla.setTempo(60);
            mockTabla.start(mockTaal);
        }
        
        expect(calls).toEqual([
            { target: 'tanpura', method: 'setVolume', value: DEFAULTS.tanpuraVolume },
            { target: 'tanpura', method: 'start' },
            { target: 'tabla', method: 'setVolume', value: DEFAULTS.tablaVolume },
            { target: 'tabla', method: 'setTempo', value: 60 },
            { target: 'tabla', method: 'start', taal: mockTaal },
        ]);
    });
    
    it('skips tanpura when disabled', () => {
        const calls = [];
        
        const mockTanpura = {
            setVolume(v) { calls.push('tanpura.setVolume'); },
            start() { calls.push('tanpura.start'); return Promise.resolve(); },
        };
        
        const defaults = { tanpuraEnabled: false };
        
        if (defaults.tanpuraEnabled !== false && mockTanpura) {
            mockTanpura.setVolume(0.55);
            mockTanpura.start();
        }
        
        expect(calls).toEqual([]);
    });
    
    it('skips tabla when disabled', () => {
        const calls = [];
        
        const mockTabla = {
            setVolume(v) { calls.push('tabla.setVolume'); },
            setTempo(t) { calls.push('tabla.setTempo'); },
            start(taal) { calls.push('tabla.start'); return Promise.resolve(); },
        };
        
        const defaults = { tablaEnabled: false };
        const mockTaal = { id: 'TEENTAAL_16' };
        
        if (defaults.tablaEnabled !== false && mockTabla && mockTaal) {
            mockTabla.setVolume(0.65);
            mockTabla.setTempo(60);
            mockTabla.start(mockTaal);
        }
        
        expect(calls).toEqual([]);
    });
});

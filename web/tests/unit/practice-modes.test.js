/**
 * Unit Tests for Practice Modes
 */

import { vi } from 'vitest';
import hindustaniClass1 from '../../assets/exercises/hindustani_class1.json';

/** Mirrors `js/robot-riyaaz.js` — Vitest has no browser bundle globals. */
const PRACTICE_MODES = {
    SING_ALONG: 'singAlong',
    GUIDED: 'guidedPractice',
    SELF: 'selfPractice',
};

/**
 * Minimal ExerciseManager: only `loadExercises` + fields tests read.
 * Real module depends on browser globals (`PRACTICE_DEFAULTS`, etc.).
 */
class ExerciseManager {
    constructor() {
        this.exercises = [];
        this.taals = {};
        this.swaras = {};
        this.loaded = false;
    }

    async loadExercises(jsonPath = '/assets/exercises/hindustani_class1.json') {
        const response = await fetch(jsonPath);
        const data = await response.json();

        this.exercises = data.exercises || [];
        this.taals = data.taals || {};
        this.swaras = data.swaras || {};
        this.categories = data.categories || [];
        this.defaultSettings = data.default_settings || {};
        this.accompanimentDefaults = data.accompaniment_defaults || {};
        this.loaded = true;

        return this.exercises;
    }

    getTaal(taalId) {
        return this.taals[taalId];
    }

    getPracticeScopes(exercise) {
        const scopes = [{ id: 'full', label: 'Full raga' }];
        (exercise.lesson_sections || []).forEach(section => {
            scopes.push({ id: section.id, label: section.label });
            (section.parts || []).forEach(part => {
                scopes.push({
                    id: `${section.id}:${part.id}`,
                    label: `${section.label} - ${part.label}`,
                });
            });
        });
        return scopes;
    }

    flattenExercise(exercise, scopeId = 'full') {
        const events = [];
        let beatIndex = 0;
        const includeWholeExercise = !scopeId || scopeId === 'full';

        const processPhrases = (phrases, direction) => {
            (phrases || []).forEach((phrase, groupIndex) => {
                phrase.forEach((swar, index) => {
                    if (swar && swar !== '-') {
                        events.push({ swar, beatIndex, direction, groupIndex, index });
                    }
                    beatIndex++;
                });
            });
        };

        (exercise.lesson_sections || []).forEach(section => {
            const includeSection = includeWholeExercise || scopeId === section.id;
            const matchingParts = (section.parts || []).filter(part =>
                scopeId === `${section.id}:${part.id}`
            );
            if (!includeSection && matchingParts.length === 0) return;

            const taal = exercise.taal_id ? this.getTaal(exercise.taal_id) : null;
            if (section.start_beat && taal?.beats) {
                const targetIndex = Math.max(0, Math.min(taal.beats - 1, section.start_beat - 1));
                const currentIndex = beatIndex % taal.beats;
                beatIndex += (targetIndex - currentIndex + taal.beats) % taal.beats;
            }

            if (includeSection) processPhrases(section.phrases, section.id);
            const parts = includeSection ? (section.parts || []) : matchingParts;
            parts.forEach(part => processPhrases(part.phrases, `${section.id}:${part.id}`));
        });

        return events;
    }
}

/**
 * Minimal RobotSession: constructor, selectExercise, toggleTanpura/Tabla only.
 */
class RobotSession {
    constructor(exerciseManager, robotPlayer, robotListener) {
        this.exerciseManager = exerciseManager;
        this.robotPlayer = robotPlayer;
        this.robotListener = robotListener;

        this.currentExercise = null;
        this.currentEvents = [];
        this.tempo = 80;
        this.state = 'idle';
        this.currentMode = PRACTICE_MODES.SING_ALONG;
    }

    selectExercise(exerciseId) {
        const exercise = this.exerciseManager.getExerciseById(exerciseId);
        if (!exercise) {
            throw new Error(`Exercise not found: ${exerciseId}`);
        }

        this.currentExercise = exercise;
        this.currentEvents = this.exerciseManager.flattenExercise(exercise);
        this.tempo = exercise.tempo_bpm || 80;

        this.robotPlayer.setExercise(exercise, this.currentEvents);

        return { exercise, events: this.currentEvents };
    }

    toggleTanpura() {
        return this.robotPlayer.toggleTanpura();
    }

    toggleTabla() {
        return this.robotPlayer.toggleTabla();
    }
}

describe('PRACTICE_MODES', () => {
    test('has exactly 3 modes', () => {
        const modes = Object.values(PRACTICE_MODES);
        expect(modes.length).toBe(3);
    });

    test('SING_ALONG is singAlong', () => {
        expect(PRACTICE_MODES.SING_ALONG).toBe('singAlong');
    });

    test('GUIDED is guidedPractice', () => {
        expect(PRACTICE_MODES.GUIDED).toBe('guidedPractice');
    });

    test('SELF is selfPractice', () => {
        expect(PRACTICE_MODES.SELF).toBe('selfPractice');
    });
});

describe('Exercise defaults in JSON', () => {
    let exerciseManager;
    let fetchSpy;

    beforeAll(async () => {
        fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => hindustaniClass1,
        });
        exerciseManager = new ExerciseManager();
        await exerciseManager.loadExercises('/assets/exercises/hindustani_class1.json');
    });

    afterAll(() => {
        fetchSpy.mockRestore();
    });

    test('all exercises have defaults block', () => {
        exerciseManager.exercises.forEach(ex => {
            expect(ex.defaults).toBeDefined();
            expect(ex.defaults.default_mode).toBeDefined();
            expect(ex.defaults.recommended_bpm).toBeDefined();
            expect(ex.defaults.recommended_taal_id).toBeDefined();
            expect(ex.defaults.recommended_notes_per_beat).toBeDefined();
        });
    });

    test('all exercises have default mode SING_ALONG', () => {
        exerciseManager.exercises.forEach(ex => {
            expect(ex.defaults.default_mode).toBe('SING_ALONG');
        });
    });

    test('all exercise defaults match their tempo', () => {
        exerciseManager.exercises.forEach(ex => {
            expect(ex.defaults.recommended_bpm).toBe(ex.tempo_bpm);
        });
    });

    test('exercise tempo_bpm is inside practice range', () => {
        exerciseManager.exercises.forEach(ex => {
            expect(ex.tempo_bpm).toBeGreaterThanOrEqual(40);
            expect(ex.tempo_bpm).toBeLessThanOrEqual(240);
        });
    });

    test('Janti exercises have notes_per_beat = 2', () => {
        const janti = exerciseManager.exercises.filter(ex =>
            ex.category === 'Janti Swaras'
        );
        expect(janti.length).toBeGreaterThan(0);
        janti.forEach(ex => {
            expect(ex.defaults.recommended_notes_per_beat).toBe(2);
        });
    });

    test('Basic Sargam exercises have notes_per_beat = 1', () => {
        const basic = exerciseManager.exercises.filter(ex =>
            ex.category === 'Basic Sargam'
        );
        expect(basic.length).toBeGreaterThan(0);
        basic.forEach(ex => {
            expect(ex.defaults.recommended_notes_per_beat).toBe(1);
        });
    });

    test('beginner ragas include swargeet sections', () => {
        const ragas = exerciseManager.exercises.filter(ex =>
            ex.category === 'Beginner Ragas'
        );
        expect(ragas.length).toBe(5);
        ragas.forEach(ex => {
            const swargeet = ex.lesson_sections?.find(section => section.id === 'swargeet');
            expect(swargeet).toBeDefined();
            expect(swargeet.label).toBe('Swargeet');
            expect(swargeet.parts.map(part => part.id)).toEqual([
                'sthayi',
                'antara',
                'aalap',
            ]);
            swargeet.parts.forEach(part => {
                expect(part.phrases.length).toBeGreaterThan(0);
            });
        });
    });

    test('Bhupali swargeet starts from 9th matra in Teentaal', () => {
        const bhupali = exerciseManager.exercises.find(ex =>
            ex.id === 'RAGA_BHUPALI_01'
        );
        const swargeet = bhupali.lesson_sections.find(section =>
            section.id === 'swargeet'
        );

        expect(bhupali.taal_id).toBe('TEENTAAL_16');
        expect(bhupali.defaults.recommended_taal_id).toBe('TEENTAAL_16');
        expect(swargeet.start_beat).toBe(9);
    });

    test('practice scopes include nested swargeet parts', () => {
        const bhupali = exerciseManager.exercises.find(ex =>
            ex.id === 'RAGA_BHUPALI_01'
        );

        expect(exerciseManager.getPracticeScopes(bhupali).map(scope => scope.id))
            .toContain('swargeet:sthayi');
    });

    test('flattening a nested swargeet part starts on its configured matra', () => {
        const bhupali = exerciseManager.exercises.find(ex =>
            ex.id === 'RAGA_BHUPALI_01'
        );
        const events = exerciseManager.flattenExercise(bhupali, 'swargeet:sthayi');

        expect(events.length).toBeGreaterThan(0);
        expect(events[0].direction).toBe('swargeet:sthayi');
        expect(events[0].beatIndex).toBe(8);
    });
});

describe('RobotSession mode management', () => {
    let session;

    beforeEach(() => {
        const mockPlayer = {
            setExercise: vi.fn(),
            onSwar: vi.fn(),
            onBeat: vi.fn(),
            onComplete: vi.fn(),
            play: vi.fn().mockResolvedValue(undefined),
            stop: vi.fn(),
            setTempo: vi.fn(),
            setSubdivision: vi.fn(),
            toggleTanpura: vi.fn().mockReturnValue(false),
            toggleTabla: vi.fn().mockReturnValue(false),
            _tanpuraEnabled: true,
            _tablaEnabled: true,
            isPlaying: false,
            swarsPerBeat: 1,
        };
        const mockListener = {
            isListening: false,
            startSession: vi.fn(),
            stopSession: vi.fn().mockReturnValue({ graded: 0 }),
            onGrade: vi.fn(),
        };
        const mockManager = {
            getExerciseById: vi.fn().mockReturnValue({
                id: 'TEST',
                tempo_bpm: 80,
                swars_per_beat: 1,
                taal_id: 'TEENTAAL_16',
            }),
            flattenExercise: vi.fn().mockReturnValue([
                { swar: 'Sa', beatIndex: 0 },
            ]),
        };

        session = new RobotSession(mockManager, mockPlayer, mockListener);
        session.selectExercise('TEST');
    });

    test('default mode is SING_ALONG', () => {
        expect(session.currentMode).toBe(PRACTICE_MODES.SING_ALONG);
    });

    test('default tempo is 80', () => {
        expect(session.tempo).toBe(80);
    });

    test('toggleTanpura delegates to player', () => {
        session.toggleTanpura();
        expect(session.robotPlayer.toggleTanpura).toHaveBeenCalled();
    });

    test('toggleTabla delegates to player', () => {
        session.toggleTabla();
        expect(session.robotPlayer.toggleTabla).toHaveBeenCalled();
    });
});

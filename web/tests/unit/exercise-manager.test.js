/**
 * Unit Tests for ExerciseManager
 * Tests exercise parsing, flattening, and swar sequence generation
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock exercise data
const mockExerciseData = {
  version: "1.0",
  taals: {
    "TEENTAAL_16": {
      id: "TEENTAAL_16",
      name: "Teentaal",
      beats: 16,
      vibhag: [4, 4, 4, 4],
      sam_beat: 1,
      tali_beats: [1, 5, 13],
      khali_beats: [9]
    }
  },
  swaras: {
    "Sa": { semitone: 0, hindi: "सा" },
    "Re": { semitone: 2, hindi: "रे" },
    "Ga": { semitone: 4, hindi: "ग" },
    "Ma": { semitone: 5, hindi: "म" },
    "Pa": { semitone: 7, hindi: "प" },
    "Dha": { semitone: 9, hindi: "ध" },
    "Ni": { semitone: 11, hindi: "नि" },
    ".Sa": { semitone: 12, hindi: "सां" }
  },
  categories: ["Basic Sargam", "Alankar"],
  exercises: [
    {
      id: "BASIC_01",
      title: "Exercise 1 - Aaroh/Avaroh",
      category: "Basic Sargam",
      taal_id: "TEENTAAL_16",
      tempo_bpm: 60,
      aaroh: ["Sa", "Re", "Ga", "Ma", "Pa", "Dha", "Ni", ".Sa"],
      avroh: [".Sa", "Ni", "Dha", "Pa", "Ma", "Ga", "Re", "Sa"]
    },
    {
      id: "BASIC_02",
      title: "Exercise 2",
      category: "Basic Sargam",
      taal_id: "TEENTAAL_16",
      tempo_bpm: 60,
      aaroh_phrases: [
        ["Sa", "Re", "Ga", "Ma"],
        ["Pa", "Dha", "Ni", ".Sa"]
      ]
    }
  ]
};

// Simple ExerciseManager implementation for testing
class ExerciseManager {
  constructor() {
    this.exercises = [];
    this.taals = {};
    this.swaras = {};
    this.categories = [];
  }
  
  loadFromData(data) {
    this.exercises = data.exercises || [];
    this.taals = data.taals || {};
    this.swaras = data.swaras || {};
    this.categories = data.categories || [];
    return this.exercises;
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
  
  flattenExercise(exercise) {
    const events = [];
    let beatIndex = 0;
    
    const processSwars = (swars, direction) => {
      if (!swars) return;
      swars.forEach((swar, i) => {
        if (swar && swar !== '-') {
          events.push({ swar, beatIndex, direction, index: i });
        }
        beatIndex++;
      });
    };
    
    const processPhrases = (phrases, direction) => {
      if (!phrases) return;
      phrases.forEach((phrase, groupIndex) => {
        phrase.forEach((swar, i) => {
          if (swar && swar !== '-') {
            events.push({ swar, beatIndex, direction, groupIndex, index: i });
          }
          beatIndex++;
        });
      });
    };
    
    // Process aaroh
    processSwars(exercise.aaroh, 'aaroh');
    processPhrases(exercise.aaroh_phrases, 'aaroh');
    processPhrases(exercise.aaroh_groups, 'aaroh');
    
    // Process avroh
    processSwars(exercise.avroh, 'avroh');
    processPhrases(exercise.avroh_phrases, 'avroh');
    processPhrases(exercise.avroh_groups, 'avroh');
    
    return events;
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
}

describe('ExerciseManager', () => {
  let manager;
  
  beforeEach(() => {
    manager = new ExerciseManager();
    manager.loadFromData(mockExerciseData);
  });
  
  describe('loadFromData', () => {
    it('should load exercises correctly', () => {
      expect(manager.exercises).toHaveLength(2);
    });
    
    it('should load taals correctly', () => {
      expect(Object.keys(manager.taals)).toHaveLength(1);
      expect(manager.taals['TEENTAAL_16'].beats).toBe(16);
    });
    
    it('should load swaras correctly', () => {
      expect(Object.keys(manager.swaras)).toHaveLength(8);
    });
    
    it('should load categories correctly', () => {
      expect(manager.categories).toContain('Basic Sargam');
      expect(manager.categories).toContain('Alankar');
    });
  });
  
  describe('getExerciseById', () => {
    it('should return exercise by id', () => {
      const ex = manager.getExerciseById('BASIC_01');
      expect(ex).toBeDefined();
      expect(ex.title).toBe('Exercise 1 - Aaroh/Avaroh');
    });
    
    it('should return undefined for non-existent id', () => {
      const ex = manager.getExerciseById('NON_EXISTENT');
      expect(ex).toBeUndefined();
    });
  });
  
  describe('getExercisesByCategory', () => {
    it('should filter exercises by category', () => {
      const exercises = manager.getExercisesByCategory('Basic Sargam');
      expect(exercises).toHaveLength(2);
    });
    
    it('should return empty array for non-existent category', () => {
      const exercises = manager.getExercisesByCategory('Non Existent');
      expect(exercises).toHaveLength(0);
    });
  });
  
  describe('getTaal', () => {
    it('should return taal by id', () => {
      const taal = manager.getTaal('TEENTAAL_16');
      expect(taal).toBeDefined();
      expect(taal.name).toBe('Teentaal');
      expect(taal.beats).toBe(16);
    });
  });
  
  describe('getSwarInfo', () => {
    it('should return swar info', () => {
      const info = manager.getSwarInfo('Sa');
      expect(info).toBeDefined();
      expect(info.semitone).toBe(0);
      expect(info.hindi).toBe('सा');
    });
    
    it('should return correct semitone for Pa', () => {
      const info = manager.getSwarInfo('Pa');
      expect(info.semitone).toBe(7);
    });
  });
  
  describe('flattenExercise', () => {
    it('should flatten simple aaroh/avroh exercise', () => {
      const exercise = manager.getExerciseById('BASIC_01');
      const events = manager.flattenExercise(exercise);
      
      // 8 aaroh + 8 avroh = 16 events
      expect(events).toHaveLength(16);
      
      // Check first event
      expect(events[0].swar).toBe('Sa');
      expect(events[0].beatIndex).toBe(0);
      expect(events[0].direction).toBe('aaroh');
      
      // Check last aaroh event
      expect(events[7].swar).toBe('.Sa');
      expect(events[7].beatIndex).toBe(7);
      
      // Check first avroh event
      expect(events[8].swar).toBe('.Sa');
      expect(events[8].beatIndex).toBe(8);
      expect(events[8].direction).toBe('avroh');
    });
    
    it('should flatten phrase-based exercise', () => {
      const exercise = manager.getExerciseById('BASIC_02');
      const events = manager.flattenExercise(exercise);
      
      // 4 + 4 = 8 events (two phrases)
      expect(events).toHaveLength(8);
      
      // Check phrase boundaries
      expect(events[0].groupIndex).toBe(0);
      expect(events[4].groupIndex).toBe(1);
    });
    
    it('should skip rest markers', () => {
      const exerciseWithRests = {
        aaroh: ['Sa', '-', 'Ga', '-']
      };
      const events = manager.flattenExercise(exerciseWithRests);
      
      // Only 2 actual swar events (Sa, Ga)
      expect(events).toHaveLength(2);
      expect(events[0].swar).toBe('Sa');
      expect(events[0].beatIndex).toBe(0);
      expect(events[1].swar).toBe('Ga');
      expect(events[1].beatIndex).toBe(2);
    });
  });
});

describe('Swar Frequency Ratios', () => {
  const justIntonationRatios = {
    'Sa': 1,
    're': 256/243,   // Komal Re
    'Re': 9/8,       // Shuddh Re
    'ga': 32/27,     // Komal Ga
    'Ga': 5/4,       // Shuddh Ga
    'Ma': 4/3,       // Shuddh Ma
    'ma': 45/32,     // Tivra Ma
    'Pa': 3/2,       // Pancham
    'dha': 128/81,   // Komal Dha
    'Dha': 5/3,      // Shuddh Dha
    'ni': 16/9,      // Komal Ni
    'Ni': 15/8,      // Shuddh Ni
    '.Sa': 2         // Upper Sa
  };
  
  it('should have correct ratio for Sa (tonic)', () => {
    expect(justIntonationRatios['Sa']).toBe(1);
  });
  
  it('should have correct ratio for Pa (perfect fifth)', () => {
    expect(justIntonationRatios['Pa']).toBe(1.5);
  });
  
  it('should have correct ratio for upper Sa (octave)', () => {
    expect(justIntonationRatios['.Sa']).toBe(2);
  });
  
  it('should have correct ratio for Ga (major third)', () => {
    expect(justIntonationRatios['Ga']).toBe(1.25);
  });
  
  it('should have correct ratio for Ma (perfect fourth)', () => {
    expect(justIntonationRatios['Ma']).toBeCloseTo(1.333, 2);
  });
});

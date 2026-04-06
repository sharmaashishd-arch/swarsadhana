/**
 * Unit Tests for Pitch Detection
 * Tests frequency to swar mapping and cents calculation
 */

import { describe, it, expect } from 'vitest';

// Pitch detection logic (extracted for testing)
class PitchToSwar {
  constructor(baseSaFreq = 261.63) {
    this.baseSaFreq = baseSaFreq;
    
    // Just Intonation ratios
    this.swarRatios = {
      'Sa': 1,
      're': 256/243,
      'Re': 9/8,
      'ga': 32/27,
      'Ga': 5/4,
      'Ma': 4/3,
      'ma': 45/32,
      'Pa': 3/2,
      'dha': 128/81,
      'Dha': 5/3,
      'ni': 16/9,
      'Ni': 15/8
    };
    
    this.swarList = ['Sa', 're', 'Re', 'ga', 'Ga', 'Ma', 'ma', 'Pa', 'dha', 'Dha', 'ni', 'Ni'];
  }
  
  freqToSwar(freq) {
    const baseSa = this.baseSaFreq;
    
    // First, check if frequency is close to any octave of Sa (within 50 cents)
    // This handles edge cases near Sa boundaries
    let testFreq = freq;
    let octave = 0;
    while (testFreq >= baseSa * 2) { testFreq /= 2; octave++; }
    while (testFreq < baseSa / 2) { testFreq *= 2; octave--; }
    
    // Check proximity to Sa at this octave
    const saCentsFromBelow = Math.abs(1200 * Math.log2(testFreq / baseSa));
    const saCentsFromAbove = testFreq < baseSa ? Math.abs(1200 * Math.log2(testFreq / (baseSa / 2))) : 9999;
    
    if (saCentsFromBelow < 50) {
      const cents = 1200 * Math.log2(freq / (baseSa * Math.pow(2, octave)));
      return {
        swar: octave > 0 ? '.Sa' : 'Sa',
        centsError: Math.round(cents),
        octaveShift: octave,
        expectedFreq: baseSa * Math.pow(2, octave)
      };
    }
    
    // Normalize to range [baseSa, 2*baseSa)
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
    
    for (const swar of this.swarList) {
      const targetFreq = baseSa * this.swarRatios[swar];
      const cents = 1200 * Math.log2(normalizedFreq / targetFreq);
      
      if (Math.abs(cents) < Math.abs(minCents)) {
        minCents = cents;
        closestSwar = swar;
      }
    }
    
    // Check upper octave Sa
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
      expectedFreq: baseSa * this.swarRatios[closestSwar] * Math.pow(2, octaveShift)
    };
  }
  
  calibrateSa(frequency) {
    this.baseSaFreq = frequency;
  }
}

describe('PitchToSwar', () => {
  let detector;
  const baseSa = 261.63; // C4
  
  beforeEach(() => {
    detector = new PitchToSwar(baseSa);
  });
  
  describe('Exact frequency detection', () => {
    it('should detect Sa at exact frequency', () => {
      const result = detector.freqToSwar(261.63);
      expect(result.swar).toBe('Sa');
      expect(Math.abs(result.centsError)).toBeLessThan(5);
    });
    
    it('should detect Pa at exact frequency (3/2 ratio)', () => {
      const paFreq = baseSa * 1.5; // 392.445 Hz
      const result = detector.freqToSwar(paFreq);
      expect(result.swar).toBe('Pa');
      expect(Math.abs(result.centsError)).toBeLessThan(5);
    });
    
    it('should detect Ga at exact frequency (5/4 ratio)', () => {
      const gaFreq = baseSa * 1.25; // 327.0375 Hz
      const result = detector.freqToSwar(gaFreq);
      expect(result.swar).toBe('Ga');
      expect(Math.abs(result.centsError)).toBeLessThan(5);
    });
    
    it('should detect Ma at exact frequency (4/3 ratio)', () => {
      const maFreq = baseSa * (4/3); // 348.84 Hz
      const result = detector.freqToSwar(maFreq);
      expect(result.swar).toBe('Ma');
      expect(Math.abs(result.centsError)).toBeLessThan(5);
    });
    
    it('should detect Dha at exact frequency (5/3 ratio)', () => {
      const dhaFreq = baseSa * (5/3); // 436.05 Hz
      const result = detector.freqToSwar(dhaFreq);
      expect(result.swar).toBe('Dha');
      expect(Math.abs(result.centsError)).toBeLessThan(5);
    });
    
    it('should detect Ni at exact frequency (15/8 ratio)', () => {
      const niFreq = baseSa * (15/8); // 490.55625 Hz
      const result = detector.freqToSwar(niFreq);
      expect(result.swar).toBe('Ni');
      expect(Math.abs(result.centsError)).toBeLessThan(5);
    });
  });
  
  describe('Octave handling', () => {
    it('should detect upper octave Sa', () => {
      const upperSa = baseSa * 2; // 523.26 Hz
      const result = detector.freqToSwar(upperSa);
      expect(result.swar).toBe('.Sa');
      expect(result.octaveShift).toBe(1);
    });
    
    it('should detect lower octave Sa', () => {
      const lowerSa = baseSa / 2; // 130.815 Hz
      const result = detector.freqToSwar(lowerSa);
      expect(result.swar).toBe('Sa');
      expect(result.octaveShift).toBe(-1);
    });
    
    it('should detect Pa in upper octave', () => {
      const upperPa = baseSa * 1.5 * 2; // ~784.89 Hz
      const result = detector.freqToSwar(upperPa);
      expect(result.swar).toBe('Pa');
      expect(result.octaveShift).toBe(1);
    });
  });
  
  describe('Cents error calculation', () => {
    it('should report positive cents for sharp pitch', () => {
      const sharpSa = baseSa * 1.015; // ~1.5% sharp, about 26 cents (within Sa tolerance)
      const result = detector.freqToSwar(sharpSa);
      expect(result.swar).toBe('Sa');
      expect(result.centsError).toBeGreaterThan(0);
      expect(result.centsError).toBeCloseTo(26, 1);
    });
    
    it('should report negative cents for flat pitch', () => {
      const flatSa = baseSa * 0.985; // ~1.5% flat, about -26 cents (within Sa tolerance)
      const result = detector.freqToSwar(flatSa);
      expect(result.swar).toBe('Sa');
      expect(result.centsError).toBeLessThan(0);
    });
    
    it('should detect slightly sharp Pa', () => {
      const sharpPa = baseSa * 1.5 * 1.01; // 1% sharp
      const result = detector.freqToSwar(sharpPa);
      expect(result.swar).toBe('Pa');
      expect(result.centsError).toBeGreaterThan(0);
      expect(result.centsError).toBeLessThan(30);
    });
    
    it('should detect slightly flat Ga', () => {
      const flatGa = baseSa * 1.25 * 0.99; // 1% flat
      const result = detector.freqToSwar(flatGa);
      expect(result.swar).toBe('Ga');
      expect(result.centsError).toBeLessThan(0);
    });
  });
  
  describe('Boundary cases between swaras', () => {
    it('should distinguish Re from ga (close swaras)', () => {
      const reFreq = baseSa * (9/8); // Re
      const gaFreq = baseSa * (32/27); // komal ga
      
      const reResult = detector.freqToSwar(reFreq);
      const gaResult = detector.freqToSwar(gaFreq);
      
      expect(reResult.swar).toBe('Re');
      expect(gaResult.swar).toBe('ga');
    });
    
    it('should distinguish Ma from ma (tivra)', () => {
      const maFreq = baseSa * (4/3); // Ma
      const tivraMaFreq = baseSa * (45/32); // ma (tivra)
      
      const maResult = detector.freqToSwar(maFreq);
      const tivraMaResult = detector.freqToSwar(tivraMaFreq);
      
      expect(maResult.swar).toBe('Ma');
      expect(tivraMaResult.swar).toBe('ma');
    });
  });
  
  describe('Sa calibration', () => {
    it('should allow recalibrating Sa frequency', () => {
      detector.calibrateSa(440); // A4
      
      const result = detector.freqToSwar(440);
      expect(result.swar).toBe('Sa');
      expect(Math.abs(result.centsError)).toBeLessThan(5);
    });
    
    it('should correctly map Pa after calibration', () => {
      detector.calibrateSa(440);
      
      const paFreq = 440 * 1.5;
      const result = detector.freqToSwar(paFreq);
      expect(result.swar).toBe('Pa');
    });
  });
});

describe('Grading Logic', () => {
  const centsThreshold = 50;
  const timingWindowMs = 200;
  
  function gradeEvent(expected, detected) {
    const isCorrectSwar = expected.swar === detected.swar;
    const isInTune = Math.abs(detected.centsError) <= centsThreshold;
    const isOnTime = Math.abs(detected.timingError) <= timingWindowMs;
    
    return { isCorrectSwar, isInTune, isOnTime };
  }
  
  it('should pass correct swar within tune threshold', () => {
    const result = gradeEvent(
      { swar: 'Sa' },
      { swar: 'Sa', centsError: 20, timingError: 50 }
    );
    expect(result.isCorrectSwar).toBe(true);
    expect(result.isInTune).toBe(true);
    expect(result.isOnTime).toBe(true);
  });
  
  it('should fail wrong swar', () => {
    const result = gradeEvent(
      { swar: 'Sa' },
      { swar: 'Re', centsError: 0, timingError: 0 }
    );
    expect(result.isCorrectSwar).toBe(false);
  });
  
  it('should fail out of tune pitch', () => {
    const result = gradeEvent(
      { swar: 'Pa' },
      { swar: 'Pa', centsError: 60, timingError: 0 }
    );
    expect(result.isCorrectSwar).toBe(true);
    expect(result.isInTune).toBe(false);
  });
  
  it('should fail late timing', () => {
    const result = gradeEvent(
      { swar: 'Ga' },
      { swar: 'Ga', centsError: 0, timingError: 250 }
    );
    expect(result.isOnTime).toBe(false);
  });
  
  it('should pass early timing within window', () => {
    const result = gradeEvent(
      { swar: 'Ma' },
      { swar: 'Ma', centsError: 0, timingError: -100 }
    );
    expect(result.isOnTime).toBe(true);
  });
});

describe('Score Calculation', () => {
  function calculateScores(results) {
    const total = results.length;
    if (total === 0) return { pitch: 0, tuning: 0, rhythm: 0, overall: 0 };
    
    const correctSwars = results.filter(r => r.isCorrectSwar).length;
    const inTune = results.filter(r => r.isInTune).length;
    const onTime = results.filter(r => r.isOnTime).length;
    
    const pitchScore = Math.round((correctSwars / total) * 100);
    const tuningScore = Math.round((inTune / total) * 100);
    const rhythmScore = Math.round((onTime / total) * 100);
    
    // Weighted overall (40% pitch, 20% tuning, 30% rhythm, 10% completion assumed 100%)
    const overallScore = Math.round(
      pitchScore * 0.4 + 
      tuningScore * 0.2 + 
      rhythmScore * 0.3 + 
      100 * 0.1
    );
    
    return { pitch: pitchScore, tuning: tuningScore, rhythm: rhythmScore, overall: overallScore };
  }
  
  it('should calculate perfect score', () => {
    const results = [
      { isCorrectSwar: true, isInTune: true, isOnTime: true },
      { isCorrectSwar: true, isInTune: true, isOnTime: true },
      { isCorrectSwar: true, isInTune: true, isOnTime: true },
      { isCorrectSwar: true, isInTune: true, isOnTime: true }
    ];
    
    const scores = calculateScores(results);
    expect(scores.pitch).toBe(100);
    expect(scores.tuning).toBe(100);
    expect(scores.rhythm).toBe(100);
    expect(scores.overall).toBe(100);
  });
  
  it('should calculate partial scores', () => {
    const results = [
      { isCorrectSwar: true, isInTune: true, isOnTime: true },
      { isCorrectSwar: true, isInTune: false, isOnTime: true },
      { isCorrectSwar: false, isInTune: true, isOnTime: false },
      { isCorrectSwar: true, isInTune: true, isOnTime: true }
    ];
    
    const scores = calculateScores(results);
    expect(scores.pitch).toBe(75);  // 3/4
    expect(scores.tuning).toBe(75); // 3/4
    expect(scores.rhythm).toBe(75); // 3/4
  });
  
  it('should handle empty results', () => {
    const scores = calculateScores([]);
    expect(scores.pitch).toBe(0);
    expect(scores.overall).toBe(0);
  });
  
  it('should weight scores correctly', () => {
    const results = [
      { isCorrectSwar: true, isInTune: true, isOnTime: false },
      { isCorrectSwar: true, isInTune: true, isOnTime: false }
    ];
    
    const scores = calculateScores(results);
    // Pitch: 100, Tuning: 100, Rhythm: 0
    // Overall = 100*0.4 + 100*0.2 + 0*0.3 + 100*0.1 = 70
    expect(scores.overall).toBe(70);
  });
});

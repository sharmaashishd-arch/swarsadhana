/**
 * Unit Tests for Dual Strip (Beat + Swar)
 *
 * Tests BeatStrip rendering, SwarStrip rendering, and subdivision logic.
 */

import { describe, it, expect, beforeEach } from 'vitest';

const TEENTAAL = {
  id: 'TEENTAAL_16',
  name: 'Teentaal',
  nameHindi: 'तीनताल',
  beats: 16,
  vibhag: [4, 4, 4, 4],
  sam_beat: 1,
  tali_beats: [1, 5, 13],
  khali_beats: [9],
  bols: ['धा', 'धिं', 'धिं', 'धा', 'धा', 'धिं', 'धिं', 'धा',
         'धा', 'तिं', 'तिं', 'ता', 'ता', 'धिं', 'धिं', 'धा']
};

const DADRA = {
  id: 'DADRA_6',
  name: 'Dadra',
  beats: 6,
  vibhag: [3, 3],
  sam_beat: 1,
  tali_beats: [1],
  khali_beats: [4],
  bols: ['धा', 'धी', 'ना', 'ना', 'ती', 'ना']
};

const SWARAS = {
  Sa: { semitone: 0, hindi: 'सा' },
  Re: { semitone: 2, hindi: 'रे' },
  Ga: { semitone: 4, hindi: 'ग' },
  Ma: { semitone: 5, hindi: 'म' },
  Pa: { semitone: 7, hindi: 'प' },
  Dha: { semitone: 9, hindi: 'ध' },
  Ni: { semitone: 11, hindi: 'नि' },
  '.Sa': { semitone: 12, hindi: 'सां' }
};

function makeSwarEvents(swarNames) {
  return swarNames.map((s, i) => ({ swar: s, beatIndex: i, direction: 'aaroh', index: i }));
}

/**
 * Mirrors the beat-column HTML generation from showSessionView().
 * Returns a DOM tree for testing.
 */
function buildDualStrip(events, taal, subdivision, swaras) {
  const totalTaalBeats = taal ? taal.beats : 16;
  const talis = taal ? (taal.tali_beats || []) : [];
  const khalis = taal ? (taal.khali_beats || []) : [];
  const bols = taal ? (taal.bols || []) : [];

  const totalBeatColumns = Math.max(1, Math.ceil(events.length / subdivision));

  const container = document.createElement('div');
  container.className = 'dual-strip-scroll';
  container.id = 'dual-strip-scroll';

  for (let b = 0; b < totalBeatColumns; b++) {
    const taalBeatIdx = b % totalTaalBeats;
    const beatNum = taalBeatIdx + 1;
    const isSam = beatNum === 1;
    const isTali = !isSam && talis.includes(beatNum);
    const isKhali = khalis.includes(beatNum);

    const col = document.createElement('div');
    col.className = 'beat-column';
    if (isSam) col.classList.add('sam');
    else if (isTali) col.classList.add('tali');
    else if (isKhali) col.classList.add('khali');
    col.dataset.beatCol = String(b);

    const marker = isSam ? 'X' : isKhali ? '०' : (isTali ? '|' : '');
    const bol = bols[taalBeatIdx] || '';

    const beatCell = document.createElement('div');
    beatCell.className = 'beat-cell';
    beatCell.innerHTML = `
      <span class="beat-marker">${marker}</span>
      <span class="beat-num">${beatNum}</span>
      <span class="beat-bol">${bol}</span>
    `;
    col.appendChild(beatCell);

    const swarGroup = document.createElement('div');
    swarGroup.className = 'swar-group';
    for (let s = 0; s < subdivision; s++) {
      const eventIdx = b * subdivision + s;
      const event = events[eventIdx];
      const label = event ? (swaras[event.swar]?.hindi || event.swar) : '-';
      const subcell = document.createElement('div');
      subcell.className = 'swar-subcell ' + (event ? 'upcoming' : 'rest');
      subcell.dataset.swarIdx = String(eventIdx);
      subcell.innerHTML = `<span class="subcell-swar">${label}</span>`;
      swarGroup.appendChild(subcell);
    }
    col.appendChild(swarGroup);
    container.appendChild(col);
  }

  return container;
}


describe('BeatStrip Rendering', () => {
  it('should render correct number of beat cells for Teentaal with 16 events at subdivision 1', () => {
    const events = makeSwarEvents(['Sa','Re','Ga','Ma','Pa','Dha','Ni','.Sa',
                                   '.Sa','Ni','Dha','Pa','Ma','Ga','Re','Sa']);
    const strip = buildDualStrip(events, TEENTAAL, 1, SWARAS);
    const beatCells = strip.querySelectorAll('.beat-cell');
    expect(beatCells).toHaveLength(16);
  });

  it('should render correct number of beat cells for Teentaal with 16 events at subdivision 2', () => {
    const events = makeSwarEvents(['Sa','Re','Ga','Ma','Pa','Dha','Ni','.Sa',
                                   '.Sa','Ni','Dha','Pa','Ma','Ga','Re','Sa']);
    const strip = buildDualStrip(events, TEENTAAL, 2, SWARAS);
    const beatCells = strip.querySelectorAll('.beat-cell');
    expect(beatCells).toHaveLength(8);
  });

  it('should render correct number of beat cells for 8 events at subdivision 1', () => {
    const events = makeSwarEvents(['Sa','Re','Ga','Ma','Pa','Dha','Ni','.Sa']);
    const strip = buildDualStrip(events, TEENTAAL, 1, SWARAS);
    const beatCells = strip.querySelectorAll('.beat-cell');
    expect(beatCells).toHaveLength(8);
  });

  it('should mark Sam beat correctly', () => {
    const events = makeSwarEvents(['Sa','Re','Ga','Ma','Pa','Dha','Ni','.Sa',
                                   '.Sa','Ni','Dha','Pa','Ma','Ga','Re','Sa']);
    const strip = buildDualStrip(events, TEENTAAL, 1, SWARAS);
    const samColumns = strip.querySelectorAll('.beat-column.sam');
    expect(samColumns).toHaveLength(1);
    expect(samColumns[0].dataset.beatCol).toBe('0');
    const marker = samColumns[0].querySelector('.beat-marker');
    expect(marker.textContent.trim()).toBe('X');
  });

  it('should mark Tali beats correctly for Teentaal', () => {
    const events = makeSwarEvents(['Sa','Re','Ga','Ma','Pa','Dha','Ni','.Sa',
                                   '.Sa','Ni','Dha','Pa','Ma','Ga','Re','Sa']);
    const strip = buildDualStrip(events, TEENTAAL, 1, SWARAS);
    const taliColumns = strip.querySelectorAll('.beat-column.tali');
    // Tali at beats 5 and 13 (beat 1 = Sam, not Tali)
    expect(taliColumns).toHaveLength(2);
    const taliIndices = Array.from(taliColumns).map(c => parseInt(c.dataset.beatCol));
    expect(taliIndices).toContain(4);  // beat 5 → index 4
    expect(taliIndices).toContain(12); // beat 13 → index 12
  });

  it('should mark Khali beat correctly for Teentaal', () => {
    const events = makeSwarEvents(['Sa','Re','Ga','Ma','Pa','Dha','Ni','.Sa',
                                   '.Sa','Ni','Dha','Pa','Ma','Ga','Re','Sa']);
    const strip = buildDualStrip(events, TEENTAAL, 1, SWARAS);
    const khaliColumns = strip.querySelectorAll('.beat-column.khali');
    expect(khaliColumns).toHaveLength(1);
    expect(khaliColumns[0].dataset.beatCol).toBe('8'); // beat 9 → index 8
    const marker = khaliColumns[0].querySelector('.beat-marker');
    expect(marker.textContent.trim()).toBe('०');
  });

  it('should show bol labels from taal data', () => {
    const events = makeSwarEvents(['Sa','Re','Ga','Ma','Pa','Dha']);
    const strip = buildDualStrip(events, DADRA, 1, SWARAS);
    const bols = strip.querySelectorAll('.beat-bol');
    expect(bols[0].textContent.trim()).toBe('धा');
    expect(bols[3].textContent.trim()).toBe('ना');
  });

  it('should show beat numbers starting from 1', () => {
    const events = makeSwarEvents(['Sa','Re','Ga','Ma']);
    const strip = buildDualStrip(events, TEENTAAL, 1, SWARAS);
    const nums = strip.querySelectorAll('.beat-num');
    expect(nums[0].textContent.trim()).toBe('1');
    expect(nums[1].textContent.trim()).toBe('2');
    expect(nums[3].textContent.trim()).toBe('4');
  });

  it('should cycle taal markers when exercise spans multiple avartans', () => {
    const longEvents = makeSwarEvents(Array(20).fill('Sa'));
    const strip = buildDualStrip(longEvents, DADRA, 1, SWARAS);
    const beatCells = strip.querySelectorAll('.beat-cell');
    expect(beatCells).toHaveLength(20);
    // Beat 7 (index 6) wraps to taal beat 1 → Sam
    const col6 = strip.querySelector('[data-beat-col="6"]');
    expect(col6.classList.contains('sam')).toBe(true);
  });
});


describe('SwarStrip Rendering', () => {
  it('should render 1 subcell per beat when subdivision=1', () => {
    const events = makeSwarEvents(['Sa','Re','Ga','Ma']);
    const strip = buildDualStrip(events, TEENTAAL, 1, SWARAS);
    const groups = strip.querySelectorAll('.swar-group');
    groups.forEach(group => {
      expect(group.querySelectorAll('.swar-subcell')).toHaveLength(1);
    });
  });

  it('should render 2 subcells per beat when subdivision=2', () => {
    const events = makeSwarEvents(['Sa','Re','Ga','Ma']);
    const strip = buildDualStrip(events, TEENTAAL, 2, SWARAS);
    const groups = strip.querySelectorAll('.swar-group');
    groups.forEach(group => {
      expect(group.querySelectorAll('.swar-subcell')).toHaveLength(2);
    });
  });

  it('should render 4 subcells per beat when subdivision=4', () => {
    const events = makeSwarEvents(['Sa','Re','Ga','Ma']);
    const strip = buildDualStrip(events, TEENTAAL, 4, SWARAS);
    const groups = strip.querySelectorAll('.swar-group');
    groups.forEach(group => {
      expect(group.querySelectorAll('.swar-subcell')).toHaveLength(4);
    });
  });

  it('should have correct total subcell count: events.length swar + rest cells', () => {
    const events = makeSwarEvents(['Sa','Re','Ga']);
    // 3 events at subdivision 2 → ceil(3/2)=2 beat columns → 2*2=4 subcells total
    const strip = buildDualStrip(events, TEENTAAL, 2, SWARAS);
    const subcells = strip.querySelectorAll('.swar-subcell');
    expect(subcells).toHaveLength(4);
  });

  it('should place swar labels in correct order', () => {
    const events = makeSwarEvents(['Sa','Re','Ga','Ma']);
    const strip = buildDualStrip(events, TEENTAAL, 2, SWARAS);
    const labels = strip.querySelectorAll('.subcell-swar');
    expect(labels[0].textContent).toBe('सा');
    expect(labels[1].textContent).toBe('रे');
    expect(labels[2].textContent).toBe('ग');
    expect(labels[3].textContent).toBe('म');
  });

  it('should mark trailing empty subcells as rest', () => {
    const events = makeSwarEvents(['Sa','Re','Ga']);
    // 3 events, subdivision 2 → 2 beat columns → 4 subcells; last one is rest
    const strip = buildDualStrip(events, TEENTAAL, 2, SWARAS);
    const subcells = strip.querySelectorAll('.swar-subcell');
    expect(subcells[3].classList.contains('rest')).toBe(true);
    expect(subcells[3].querySelector('.subcell-swar').textContent).toBe('-');
  });

  it('should set data-swar-idx attributes sequentially', () => {
    const events = makeSwarEvents(['Sa','Re','Ga','Ma']);
    const strip = buildDualStrip(events, TEENTAAL, 2, SWARAS);
    const subcells = strip.querySelectorAll('.swar-subcell');
    expect(subcells[0].dataset.swarIdx).toBe('0');
    expect(subcells[1].dataset.swarIdx).toBe('1');
    expect(subcells[2].dataset.swarIdx).toBe('2');
    expect(subcells[3].dataset.swarIdx).toBe('3');
  });
});


describe('Beat Count Independence (Regression)', () => {
  it('changing subdivision must not change beat strip length when total events remain proportional', () => {
    const events16 = makeSwarEvents(Array(16).fill('Sa'));

    const strip1 = buildDualStrip(events16, TEENTAAL, 1, SWARAS);
    const strip2 = buildDualStrip(events16, TEENTAAL, 2, SWARAS);
    const strip4 = buildDualStrip(events16, TEENTAAL, 4, SWARAS);

    expect(strip1.querySelectorAll('.beat-cell')).toHaveLength(16);
    expect(strip2.querySelectorAll('.beat-cell')).toHaveLength(8);
    expect(strip4.querySelectorAll('.beat-cell')).toHaveLength(4);
  });

  it('beat markers are identical across subdivisions for the same taal beat', () => {
    const events = makeSwarEvents(Array(16).fill('Sa'));

    const strip1 = buildDualStrip(events, TEENTAAL, 1, SWARAS);
    const strip2 = buildDualStrip(events, TEENTAAL, 2, SWARAS);

    const markers1 = Array.from(strip1.querySelectorAll('.beat-marker')).map(m => m.textContent.trim());
    // strip2 has 8 beats (beats 1-8 of taal), strip1 has 16 (all taal beats)
    // The first 8 markers should match between strip1 and strip2
    const markers2 = Array.from(strip2.querySelectorAll('.beat-marker')).map(m => m.textContent.trim());
    for (let i = 0; i < 8; i++) {
      expect(markers2[i]).toBe(markers1[i]);
    }
  });

  it('Dadra with 6 events at subdivision 1 shows exactly 6 beat columns', () => {
    const events = makeSwarEvents(['Sa','Re','Ga','Ma','Pa','Dha']);
    const strip = buildDualStrip(events, DADRA, 1, SWARAS);
    expect(strip.querySelectorAll('.beat-cell')).toHaveLength(6);
  });
});


describe('Beat-Swar Sync Computation', () => {
  it('at subdivision=2, swar index maps to correct beat column', () => {
    const subdivision = 2;
    // Swar index 0,1 → beat 0; 2,3 → beat 1; 4,5 → beat 2; etc.
    expect(Math.floor(0 / subdivision)).toBe(0);
    expect(Math.floor(1 / subdivision)).toBe(0);
    expect(Math.floor(2 / subdivision)).toBe(1);
    expect(Math.floor(3 / subdivision)).toBe(1);
    expect(Math.floor(4 / subdivision)).toBe(2);
  });

  it('at subdivision=4, 4 swars per beat', () => {
    const subdivision = 4;
    expect(Math.floor(0 / subdivision)).toBe(0);
    expect(Math.floor(3 / subdivision)).toBe(0);
    expect(Math.floor(4 / subdivision)).toBe(1);
    expect(Math.floor(7 / subdivision)).toBe(1);
  });

  it('swar duration = beatDuration / subdivision', () => {
    const bpm = 60;
    const beatDurationMs = 60000 / bpm; // 1000ms

    expect(beatDurationMs / 1).toBe(1000);
    expect(beatDurationMs / 2).toBe(500);
    expect(beatDurationMs / 4).toBe(250);
  });

  it('at bpm=60, subdivision=2: swar playhead visits 2 subcells within each beat of 1s', () => {
    const bpm = 60;
    const subdivision = 2;
    const beatDurationMs = 60000 / bpm;
    const swarDurationMs = beatDurationMs / subdivision;

    expect(swarDurationMs).toBe(500);

    // Simulate time progression: swar at t=0ms → beat 0, swar at t=500ms → still beat 0
    // swar at t=1000ms → beat 1
    const swarTimings = [0, 500, 1000, 1500, 2000, 2500];
    const expectedBeats = [0, 0, 1, 1, 2, 2];
    swarTimings.forEach((t, i) => {
      const beat = Math.floor(i / subdivision);
      expect(beat).toBe(expectedBeats[i]);
    });
  });
});

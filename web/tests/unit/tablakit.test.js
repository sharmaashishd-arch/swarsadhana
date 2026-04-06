/**
 * Unit Tests for TablaKit — sample-based tabla engine
 *
 * Tests bol resolution, round-robin, accent gain, and manifest validation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Bol resolution logic extracted from RealisticTablaEngine._resolveBolName
function resolveBolName(bol) {
    const b = (bol || '').toLowerCase();
    const map = [
        [['धा', 'dha'],               'dha'],
        [['धिं', 'धी', 'dhin', 'dhi'], 'dhin'],
        [['तिं', 'tin'],              'tin'],
        [['ना', 'na', 'ne'],          'na'],
        [['ता', 'ta', 'te'],          'ta'],
        [['गे', 'घे', 'ge', 'ghe'],   'ge'],
        [['के', 'ke'],                'ke'],
    ];
    for (const [patterns, canonical] of map) {
        if (patterns.some(p => bol?.includes(p) || b.includes(p))) {
            return canonical;
        }
    }
    return 'na';
}

function computeAccentGain(isSam, isTali, isKhali) {
    if (isSam)        return 1.3;
    if (isTali)       return 1.1;
    if (isKhali)      return 0.85;
    return 1.0;
}

describe('TablaKit bol resolution', () => {
    it('resolves Devanagari bols correctly', () => {
        expect(resolveBolName('धा')).toBe('dha');
        expect(resolveBolName('धिं')).toBe('dhin');
        expect(resolveBolName('तिं')).toBe('tin');
        expect(resolveBolName('ता')).toBe('ta');
        expect(resolveBolName('ना')).toBe('na');
        expect(resolveBolName('गे')).toBe('ge');
        expect(resolveBolName('के')).toBe('ke');
    });

    it('resolves ASCII bols correctly', () => {
        expect(resolveBolName('dha')).toBe('dha');
        expect(resolveBolName('dhin')).toBe('dhin');
        expect(resolveBolName('tin')).toBe('tin');
        expect(resolveBolName('ta')).toBe('ta');
        expect(resolveBolName('na')).toBe('na');
        expect(resolveBolName('ge')).toBe('ge');
        expect(resolveBolName('ke')).toBe('ke');
    });

    it('resolves alternate forms', () => {
        expect(resolveBolName('dhi')).toBe('dhin');
        expect(resolveBolName('धी')).toBe('dhin');
        expect(resolveBolName('ghe')).toBe('ge');
        expect(resolveBolName('घे')).toBe('ge');
        expect(resolveBolName('te')).toBe('ta');
        expect(resolveBolName('ne')).toBe('na');
    });

    it('falls back to na for unknown input', () => {
        expect(resolveBolName('')).toBe('na');
        expect(resolveBolName('xyz')).toBe('na');
        expect(resolveBolName(null)).toBe('na');
    });
});

describe('TablaKit accent gain', () => {
    it('sam has highest gain (1.3)', () => {
        expect(computeAccentGain(true, false, false)).toBe(1.3);
    });

    it('tali has elevated gain (1.1)', () => {
        expect(computeAccentGain(false, true, false)).toBe(1.1);
    });

    it('khali has reduced gain (0.85)', () => {
        expect(computeAccentGain(false, false, true)).toBe(0.85);
    });

    it('normal beats have neutral gain (1.0)', () => {
        expect(computeAccentGain(false, false, false)).toBe(1.0);
    });

    it('sam overrides tali when both true', () => {
        expect(computeAccentGain(true, true, false)).toBe(1.3);
    });
});

describe('TablaKit round-robin', () => {
    it('alternates v1 and v2', () => {
        const roundRobin = { dha: 0 };
        const variants = [];
        for (let i = 0; i < 6; i++) {
            const vi = roundRobin.dha;
            roundRobin.dha = 1 - vi;
            variants.push(`v${vi + 1}`);
        }
        expect(variants).toEqual(['v1', 'v2', 'v1', 'v2', 'v1', 'v2']);
    });
});

describe('TablaKit Teentaal theka bol coverage', () => {
    const teentaalBols = ['धा', 'धिं', 'धिं', 'धा', 'धा', 'धिं', 'धिं', 'धा',
                          'धा', 'तिं', 'तिं', 'ता', 'ता', 'धिं', 'धिं', 'धा'];

    it('every Teentaal bol resolves to a valid sample bol', () => {
        const validBols = new Set(['dha', 'dhin', 'tin', 'na', 'ta', 'ge', 'ke']);
        for (const bol of teentaalBols) {
            expect(validBols.has(resolveBolName(bol))).toBe(true);
        }
    });

    it('Teentaal theka uses exactly dha, dhin, tin, ta', () => {
        const used = new Set(teentaalBols.map(resolveBolName));
        expect(used).toEqual(new Set(['dha', 'dhin', 'tin', 'ta']));
    });
});

describe('TablaKit manifest', () => {
    const manifestPath = join(__dirname, '..', '..', '..', 'assets', 'audio', 'tabla', 'manifest.json');

    it('manifest.json exists', () => {
        expect(existsSync(manifestPath)).toBe(true);
    });

    it('all 14 samples are present in manifest', () => {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
        expect(manifest.samples.length).toBe(14);
    });

    it('no sample requires attribution', () => {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
        for (const s of manifest.samples) {
            expect(s.attribution_required).toBe(false);
        }
    });

    it('all WAV files exist on disk (web)', () => {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
        const webBase = join(__dirname, '..', '..', 'assets', 'audio', 'tabla');
        for (const s of manifest.samples) {
            const p = join(webBase, s.filename);
            expect(existsSync(p)).toBe(true);
        }
    });
});

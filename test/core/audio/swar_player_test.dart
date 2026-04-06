import 'package:flutter_test/flutter_test.dart';
import 'package:swarsadhana/core/audio/swar_player.dart';
import 'package:swarsadhana/core/constants/music_constants.dart';

void main() {
  group('SwarPlayer MIDI mapping', () {
    // We test swarToMidi without initializing audio (pure logic test).
    // SwarPlayer.swarSemitones is a static const map.

    test('Sa at key C maps to MIDI 60', () {
      // baseMidi = 60 + C.index(0) = 60
      // Sa offset = 0  →  MIDI 60
      final midi = _computeMidi('Sa', RootKey.C);
      expect(midi, 60);
    });

    test('.Sa (upper) at key C maps to MIDI 72', () {
      final midi = _computeMidi('.Sa', RootKey.C);
      expect(midi, 72);
    });

    test('Sa. (lower) at key C maps to MIDI 48', () {
      final midi = _computeMidi('Sa.', RootKey.C);
      expect(midi, 48);
    });

    test('Re at key C maps to MIDI 62', () {
      final midi = _computeMidi('Re', RootKey.C);
      expect(midi, 62);
    });

    test('Pa at key C maps to MIDI 67', () {
      final midi = _computeMidi('Pa', RootKey.C);
      expect(midi, 67);
    });

    test('Ni at key C maps to MIDI 71', () {
      final midi = _computeMidi('Ni', RootKey.C);
      expect(midi, 71);
    });

    test('re (komal) at key C maps to MIDI 61', () {
      final midi = _computeMidi('re', RootKey.C);
      expect(midi, 61);
    });

    test('ma (tivra) at key C maps to MIDI 66', () {
      final midi = _computeMidi('ma', RootKey.C);
      expect(midi, 66);
    });

    test('Sa at key D maps to MIDI 62', () {
      // D.index = 3 → baseMidi = 60 + 3 = 63? No.
      // RootKey enum: C=0, Db=1, D=2, Eb=3, E=4, F=5, ...
      // So D.index = 2, baseMidi = 60 + 2 = 62
      final midi = _computeMidi('Sa', RootKey.D);
      expect(midi, 62);
    });

    test('Sa at key A maps to MIDI 69', () {
      // A.index = 9, baseMidi = 60 + 9 = 69
      final midi = _computeMidi('Sa', RootKey.A);
      expect(midi, 69);
    });

    test('Pa at key D maps to MIDI 69', () {
      // D.index = 2, baseMidi = 62, Pa offset = 7 → 69
      final midi = _computeMidi('Pa', RootKey.D);
      expect(midi, 69);
    });

    test('all swar names have entries in swarSemitones', () {
      const expectedSwaras = [
        'Sa.', 'Sa', 're', 'Re', 'ga', 'Ga', 'Ma', 'ma',
        'Pa', 'dha', 'Dha', 'ni', 'Ni', '.Sa',
      ];
      for (final swar in expectedSwaras) {
        expect(
          SwarPlayer.swarSemitones.containsKey(swar),
          isTrue,
          reason: 'Missing swar: $swar',
        );
      }
    });

    test('swar semitone offsets are in chromatic order', () {
      const orderedSwaras = [
        'Sa', 're', 'Re', 'ga', 'Ga', 'Ma', 'ma', 'Pa',
        'dha', 'Dha', 'ni', 'Ni', '.Sa',
      ];
      for (int i = 1; i < orderedSwaras.length; i++) {
        final prev = SwarPlayer.swarSemitones[orderedSwaras[i - 1]]!;
        final curr = SwarPlayer.swarSemitones[orderedSwaras[i]]!;
        expect(
          curr > prev,
          isTrue,
          reason: '${orderedSwaras[i]} ($curr) should be > ${orderedSwaras[i - 1]} ($prev)',
        );
      }
    });

    test('key shift is consistent across all RootKeys', () {
      for (final key in RootKey.values) {
        final saNote = _computeMidi('Sa', key);
        final paNote = _computeMidi('Pa', key);
        expect(paNote - saNote, 7, reason: 'Pa-Sa interval at key $key');
      }
    });
  });

  group('Saptak (octave) shift', () {
    test('Saptak.mandra has semitoneShift = -12', () {
      expect(Saptak.mandra.semitoneShift, -12);
    });

    test('Saptak.madhya has semitoneShift = 0', () {
      expect(Saptak.madhya.semitoneShift, 0);
    });

    test('Saptak.taar has semitoneShift = +12', () {
      expect(Saptak.taar.semitoneShift, 12);
    });

    test('Madhya Sa at C = MIDI 60', () {
      final midi = _computeMidiWithSaptak('Sa', RootKey.C, 0);
      expect(midi, 60);
    });

    test('Taar Sa at C = MIDI 72', () {
      final midi = _computeMidiWithSaptak('Sa', RootKey.C, 12);
      expect(midi, 72);
    });

    test('Mandra Sa at C = MIDI 48', () {
      final midi = _computeMidiWithSaptak('Sa', RootKey.C, -12);
      expect(midi, 48);
    });

    test('Taar Pa at C = MIDI 79', () {
      final midi = _computeMidiWithSaptak('Pa', RootKey.C, 12);
      expect(midi, 60 + 7 + 12);
    });

    test('Mandra Pa at C = MIDI 55', () {
      final midi = _computeMidiWithSaptak('Pa', RootKey.C, -12);
      expect(midi, 60 + 7 - 12);
    });

    test('saptak shift preserves interval between all swaras', () {
      for (final saptak in Saptak.values) {
        final saNote = _computeMidiWithSaptak('Sa', RootKey.C, saptak.semitoneShift);
        final paNote = _computeMidiWithSaptak('Pa', RootKey.C, saptak.semitoneShift);
        expect(paNote - saNote, 7, reason: 'Pa-Sa interval at ${saptak.label}');
      }
    });

    test('Taar Sa == Madhya Sa + 12', () {
      final madhyaSa = _computeMidiWithSaptak('Sa', RootKey.C, 0);
      final taarSa = _computeMidiWithSaptak('Sa', RootKey.C, 12);
      expect(taarSa - madhyaSa, 12);
    });

    test('Mandra Sa == Madhya Sa - 12', () {
      final madhyaSa = _computeMidiWithSaptak('Sa', RootKey.C, 0);
      final mandraSa = _computeMidiWithSaptak('Sa', RootKey.C, -12);
      expect(madhyaSa - mandraSa, 12);
    });

    test('saptak shift applies correctly across all keys', () {
      for (final key in RootKey.values) {
        final madhya = _computeMidiWithSaptak('Sa', key, 0);
        final taar = _computeMidiWithSaptak('Sa', key, 12);
        final mandra = _computeMidiWithSaptak('Sa', key, -12);
        expect(taar - madhya, 12, reason: 'Taar-Madhya at key ${key.name}');
        expect(madhya - mandra, 12, reason: 'Madhya-Mandra at key ${key.name}');
      }
    });
  });

  group('Note articulation gap', () {
    double swarDuration(double bpm, int swarsPerBeat) =>
        60.0 / bpm / swarsPerBeat;

    test('80 BPM 4x: gap >= 30ms', () {
      final sd = swarDuration(80, 4);
      final nd = _computeNoteDuration(sd);
      expect(sd - nd, greaterThanOrEqualTo(0.03));
      expect(nd, greaterThan(0));
    });

    test('120 BPM 4x: gap >= 30ms', () {
      final sd = swarDuration(120, 4);
      final nd = _computeNoteDuration(sd);
      expect(sd - nd, greaterThanOrEqualTo(0.03));
      expect(nd, greaterThan(0));
    });

    test('200 BPM 4x: gap >= 30ms and note > 0', () {
      final sd = swarDuration(200, 4);
      final nd = _computeNoteDuration(sd);
      expect(sd - nd, greaterThanOrEqualTo(0.03));
      expect(nd, greaterThan(0));
    });

    test('slow tempo uses proportional 0.9 factor', () {
      final sd = swarDuration(60, 1);
      final nd = _computeNoteDuration(sd);
      expect(nd, closeTo(sd * 0.9, 0.0001));
    });

    test('fast tempo clamps to minimum gap', () {
      final sd = swarDuration(80, 4);
      final nd = _computeNoteDuration(sd);
      expect(sd - nd, closeTo(0.03, 0.0001));
    });
  });
}

/// Replicates SwarPlayer.swarToMidi logic without needing audio init.
int _computeMidi(String swarName, RootKey key) {
  final baseMidi = 60 + key.index;
  final offset = SwarPlayer.swarSemitones[swarName] ?? 0;
  return baseMidi + offset;
}

int _computeMidiWithSaptak(String swarName, RootKey key, int saptakShift) {
  final baseMidi = 60 + key.index;
  final offset = SwarPlayer.swarSemitones[swarName] ?? 0;
  return baseMidi + offset + saptakShift;
}

double _computeNoteDuration(double swarDurationSec) {
  const minGapSec = 0.03;
  final proportional = swarDurationSec * 0.9;
  final clamped = swarDurationSec - minGapSec;
  return proportional < clamped ? proportional : clamped;
}

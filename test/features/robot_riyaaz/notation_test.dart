import 'package:flutter_test/flutter_test.dart';
import 'package:swarsadhana/core/constants/music_constants.dart';
import 'package:swarsadhana/features/robot_riyaaz/models/exercise.dart';

void main() {
  // ─── SwarInfo.english ───────────────────────────────────────────────────────
  group('SwarInfo.english – swara name display', () {
    SwarInfo infoForSemitone(int semitone, {String? octaveMarker}) =>
        SwarInfo(semitone: semitone, hindi: 'placeholder', octaveMarker: octaveMarker);

    test('Sa (semitone 0) returns "Sa"', () {
      expect(infoForSemitone(0).english, 'Sa');
    });

    test('Komal Re (semitone 1) returns "re"', () {
      expect(infoForSemitone(1).english, 're');
    });

    test('Shuddh Re (semitone 2) returns "Re"', () {
      expect(infoForSemitone(2).english, 'Re');
    });

    test('Komal Ga (semitone 3) returns "ga"', () {
      expect(infoForSemitone(3).english, 'ga');
    });

    test('Shuddh Ga (semitone 4) returns "Ga"', () {
      expect(infoForSemitone(4).english, 'Ga');
    });

    test('Shuddh Ma (semitone 5) returns "Ma"', () {
      expect(infoForSemitone(5).english, 'Ma');
    });

    test('Tivra Ma (semitone 6) returns "ma\'"', () {
      expect(infoForSemitone(6).english, "ma'");
    });

    test('Pa (semitone 7) returns "Pa"', () {
      expect(infoForSemitone(7).english, 'Pa');
    });

    test('Komal Dha (semitone 8) returns "dha"', () {
      expect(infoForSemitone(8).english, 'dha');
    });

    test('Shuddh Dha (semitone 9) returns "Dha"', () {
      expect(infoForSemitone(9).english, 'Dha');
    });

    test('Komal Ni (semitone 10) returns "ni"', () {
      expect(infoForSemitone(10).english, 'ni');
    });

    test('Shuddh Ni (semitone 11) returns "Ni"', () {
      expect(infoForSemitone(11).english, 'Ni');
    });

    test('Upper octave Sa (semitone 0, octaveMarker: upper) appends apostrophe', () {
      expect(infoForSemitone(0, octaveMarker: 'upper').english, "Sa'");
    });

    test('Lower octave Sa (semitone 0, octaveMarker: lower) prepends comma', () {
      expect(infoForSemitone(0, octaveMarker: 'lower').english, 'Sa,');
    });

    test('semitone 12 (taar Sa) maps correctly via modulo', () {
      expect(infoForSemitone(12).english, 'Sa');
    });

    test('negative semitone (-12, mandra Sa) maps correctly', () {
      expect(infoForSemitone(-12).english, 'Sa');
    });
  });

  // ─── ExerciseTaal.bolsEnglish ────────────────────────────────────────────────
  group('ExerciseTaal.bolsEnglish – tabla bol transliteration', () {
    ExerciseTaal makeTaal(List<String> bols) => ExerciseTaal(
          id: 'test',
          name: 'Test',
          beats: bols.length,
          vibhag: [bols.length],
          taliBeats: [1],
          khaliBeats: [],
          bols: bols,
        );

    test('returns null when bols is null', () {
      const taal = ExerciseTaal(
        id: 't', name: 'T', beats: 4, vibhag: [4], taliBeats: [1], khaliBeats: [],
      );
      expect(taal.bolsEnglish, isNull);
    });

    test('transliterates Teentaal bols correctly', () {
      final taal = makeTaal(['धा', 'धिं', 'धिं', 'धा', 'धा', 'तिं', 'तिं', 'ता']);
      expect(taal.bolsEnglish, ['Dha', 'Dhin', 'Dhin', 'Dha', 'Dha', 'Tin', 'Tin', 'Ta']);
    });

    test('transliterates Jhaptaal bols correctly', () {
      final taal = makeTaal(['धी', 'ना', 'ती', 'ना']);
      expect(taal.bolsEnglish, ['Dhi', 'Na', 'Ti', 'Na']);
    });

    test('transliterates Ektaal complex bols correctly', () {
      final taal = makeTaal(['धागे', 'तिरकिट', 'कत', 'तू']);
      expect(taal.bolsEnglish, ['Dhage', 'Tirkita', 'Kata', 'Tu']);
    });

    test('transliterates Keherwa bols correctly', () {
      final taal = makeTaal(['धा', 'गे', 'ना', 'ती', 'ना', 'क', 'धी', 'ना']);
      expect(taal.bolsEnglish, ['Dha', 'Ge', 'Na', 'Ti', 'Na', 'Ka', 'Dhi', 'Na']);
    });

    test('produces same length list as source bols', () {
      final taal = makeTaal(['धा', 'धिं', 'धिं', 'धा', 'धा', 'धिं', 'धिं', 'धा',
                              'धा', 'तिं', 'तिं', 'ता', 'ता', 'धिं', 'धिं', 'धा']);
      expect(taal.bolsEnglish!.length, taal.bols!.length);
    });
  });

  // ─── Swara enum .english round-trip ─────────────────────────────────────────
  group('Swara enum – english property', () {
    test('all 12 swaras have non-empty English labels', () {
      for (final s in Swara.values) {
        expect(s.english, isNotEmpty, reason: '${s.name} has no English label');
      }
    });

    test('standard saptaka labels match expected notation', () {
      expect(Swara.sa.english, 'Sa');
      expect(Swara.re.english, 'Re');
      expect(Swara.ga.english, 'Ga');
      expect(Swara.ma.english, 'Ma');
      expect(Swara.pa.english, 'Pa');
      expect(Swara.dha.english, 'Dha');
      expect(Swara.ni.english, 'Ni');
    });

    test('komal swaras are lowercase', () {
      expect(Swara.reKomal.english, 're');
      expect(Swara.gaKomal.english, 'ga');
      expect(Swara.dhaKomal.english, 'dha');
      expect(Swara.niKomal.english, 'ni');
    });
  });
}

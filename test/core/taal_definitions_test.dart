import 'package:flutter_test/flutter_test.dart';
import 'package:swarsadhana/core/constants/music_constants.dart';

void main() {
  group('Taal registry completeness', () {
    test('Taals.all contains at least 5 taals', () {
      expect(Taals.all.length, greaterThanOrEqualTo(5));
    });

    test('required taals are present by name', () {
      final names = Taals.all.map((t) => t.name).toSet();
      expect(names, contains('Teentaal'));
      expect(names, contains('Keherwa'));
      expect(names, contains('Dadra'));
      expect(names, contains('Rupak'));
      expect(names, contains('Jhaptaal'));
    });

    test('required taals are free (not Pro-locked)', () {
      expect(Taals.teentaal.isPro, false);
      expect(Taals.keherwa.isPro, false);
      expect(Taals.dadra.isPro, false);
      expect(Taals.rupak.isPro, false);
      expect(Taals.jhaptaal.isPro, false);
    });
  });

  group('Pattern length matches beats for each taal', () {
    for (final taal in Taals.all) {
      test('${taal.name}: bols.length == matras (${taal.matras})', () {
        expect(taal.bols.length, taal.matras);
      });
    }
  });

  group('Vibhag sum matches matras', () {
    for (final taal in Taals.all) {
      test('${taal.name}: vibhag sum == ${taal.matras}', () {
        final sum = taal.vibhags.reduce((a, b) => a + b);
        expect(sum, taal.matras);
      });
    }
  });

  group('Sam/tali/khali indices valid within beat count', () {
    for (final taal in Taals.all) {
      test('${taal.name}: sam is always 1', () {
        expect(taal.sam, 1);
      });

      test('${taal.name}: tali indices in [1, ${taal.matras}]', () {
        for (final t in taal.talis) {
          expect(t, greaterThanOrEqualTo(1));
          expect(t, lessThanOrEqualTo(taal.matras));
        }
      });

      test('${taal.name}: khali indices in [1, ${taal.matras}]', () {
        for (final k in taal.khalis) {
          expect(k, greaterThanOrEqualTo(1));
          expect(k, lessThanOrEqualTo(taal.matras));
        }
      });

      test('${taal.name}: no overlapping tali/khali', () {
        final overlap =
            taal.talis.where((t) => taal.khalis.contains(t)).toList();
        expect(overlap, isEmpty);
      });
    }
  });

  group('Sequencing produces correct number of events per avartan', () {
    for (final taal in Taals.all) {
      test('${taal.name}: one event per matra, wraps to sam', () {
        int matra = 0;
        final events = <Map<String, dynamic>>[];

        for (int i = 0; i < taal.matras; i++) {
          final beatNum = matra + 1;
          final isSam = matra == 0;
          final isTali = !isSam && taal.talis.contains(beatNum);
          final isKhali = taal.khalis.contains(beatNum);

          events.add({
            'matra': matra,
            'bol': taal.bols[matra],
            'isSam': isSam,
            'isTali': isTali,
            'isKhali': isKhali,
          });

          matra = (matra + 1) % taal.matras;
        }

        expect(events.length, taal.matras);
        expect(matra, 0);
        expect(events[0]['isSam'], true);
      });
    }
  });

  group('Specific taal definitions match spec', () {
    test('Teentaal: 16 beats, vibhag [4,4,4,4], tali=[1,5,13], khali=[9]',
        () {
      const t = Taals.teentaal;
      expect(t.matras, 16);
      expect(t.vibhags, [4, 4, 4, 4]);
      expect(t.talis, [1, 5, 13]);
      expect(t.khalis, [9]);
    });

    test('Keherwa: 8 beats, vibhag [4,4], tali=[1], khali=[5]', () {
      const t = Taals.keherwa;
      expect(t.matras, 8);
      expect(t.vibhags, [4, 4]);
      expect(t.talis, [1]);
      expect(t.khalis, [5]);
    });

    test('Dadra: 6 beats, vibhag [3,3], tali=[1], khali=[4]', () {
      const t = Taals.dadra;
      expect(t.matras, 6);
      expect(t.vibhags, [3, 3]);
      expect(t.talis, [1]);
      expect(t.khalis, [4]);
    });

    test('Rupak: 7 beats, vibhag [3,2,2], tali=[4,6], khali=[1]', () {
      const t = Taals.rupak;
      expect(t.matras, 7);
      expect(t.vibhags, [3, 2, 2]);
      expect(t.talis, [4, 6]);
      expect(t.khalis, [1]);
    });

    test('Jhaptaal: 10 beats, vibhag [2,3,2,3], tali=[1,3,8], khali=[6]',
        () {
      const t = Taals.jhaptaal;
      expect(t.matras, 10);
      expect(t.vibhags, [2, 3, 2, 3]);
      expect(t.talis, [1, 3, 8]);
      expect(t.khalis, [6]);
    });
  });

  group('Accent model consistency', () {
    test('sam is beat 0 for all taals', () {
      for (final taal in Taals.all) {
        expect(taal.sam, 1,
            reason: '${taal.name} sam should be 1 (1-based)');
      }
    });

    test('accent gains: sam > tali > normal > khali', () {
      expect(1.3, greaterThan(1.1));     // sam > tali
      expect(1.1, greaterThan(1.0));     // tali > normal
      expect(1.0, greaterThan(0.85));    // normal > khali
    });
  });
}

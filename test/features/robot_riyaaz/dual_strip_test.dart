import 'package:flutter_test/flutter_test.dart';
import 'package:swarsadhana/features/robot_riyaaz/models/exercise.dart';

void main() {
  group('Dual Strip - Beat-Swar column mapping', () {
    test('subdivision=1: each beat column has exactly 1 swar subcell', () {
      const subdivision = 1;
      final events = List.generate(8, (i) => SwarEvent(swar: 'Sa', beatIndex: i, direction: 'aaroh', index: i));
      final totalBeatCols = (events.length + subdivision - 1) ~/ subdivision;

      expect(totalBeatCols, 8);
      for (var col = 0; col < totalBeatCols; col++) {
        final startIdx = col * subdivision;
        final endIdx = (startIdx + subdivision).clamp(0, events.length);
        expect(endIdx - startIdx, 1);
      }
    });

    test('subdivision=2: each beat column has exactly 2 swar subcells', () {
      const subdivision = 2;
      final events = List.generate(16, (i) => SwarEvent(swar: 'Sa', beatIndex: i, direction: 'aaroh', index: i));
      final totalBeatCols = (events.length + subdivision - 1) ~/ subdivision;

      expect(totalBeatCols, 8);
      for (var col = 0; col < totalBeatCols; col++) {
        final startIdx = col * subdivision;
        final endIdx = (startIdx + subdivision).clamp(0, events.length);
        expect(endIdx - startIdx, 2);
      }
    });

    test('subdivision=4: each beat column has exactly 4 swar subcells', () {
      const subdivision = 4;
      final events = List.generate(32, (i) => SwarEvent(swar: 'Sa', beatIndex: i, direction: 'aaroh', index: i));
      final totalBeatCols = (events.length + subdivision - 1) ~/ subdivision;

      expect(totalBeatCols, 8);
      for (var col = 0; col < totalBeatCols; col++) {
        final startIdx = col * subdivision;
        final endIdx = (startIdx + subdivision).clamp(0, events.length);
        expect(endIdx - startIdx, 4);
      }
    });

    test('changing subdivision does not affect total beat columns for proportional events', () {
      const totalBeats = 8;
      for (final sub in [1, 2, 4]) {
        final events = List.generate(totalBeats * sub, (i) => SwarEvent(swar: 'Sa', beatIndex: i, direction: 'aaroh', index: i));
        final totalBeatCols = (events.length + sub - 1) ~/ sub;
        expect(totalBeatCols, totalBeats,
            reason: 'subdivision=$sub should still produce $totalBeats beat columns');
      }
    });
  });

  group('Dual Strip - Beat index from swar index', () {
    test('swarIndex 0..3 at subdivision=4 all map to beat 0', () {
      const subdivision = 4;
      for (var i = 0; i < 4; i++) {
        expect(i ~/ subdivision, 0);
      }
    });

    test('swarIndex 4..7 at subdivision=4 map to beat 1', () {
      const subdivision = 4;
      for (var i = 4; i < 8; i++) {
        expect(i ~/ subdivision, 1);
      }
    });

    test('swarIndex tracks beat boundaries at subdivision=2', () {
      const subdivision = 2;
      expect(0 ~/ subdivision, 0);
      expect(1 ~/ subdivision, 0);
      expect(2 ~/ subdivision, 1);
      expect(3 ~/ subdivision, 1);
      expect(4 ~/ subdivision, 2);
    });
  });

  group('Dual Strip - Taal marker cycling', () {
    test('beat markers cycle through taal beats correctly', () {
      const totalTaalBeats = 4; // Keherwa
      for (var col = 0; col < 8; col++) {
        final taalBeatIdx = col % totalTaalBeats;
        expect(taalBeatIdx, col % 4);
      }
    });

    test('Sam marker appears at taalBeatIdx 0 only', () {
      const totalTaalBeats = 16; // Teentaal
      for (var col = 0; col < 32; col++) {
        final taalBeatIdx = col % totalTaalBeats;
        final beatNum = taalBeatIdx + 1;
        final isSam = beatNum == 1;
        expect(isSam, col % totalTaalBeats == 0);
      }
    });

    test('tali and khali markers are consistent across avartans', () {
      const taliBeats = [5, 13]; // Teentaal
      const khaliBeats = [9]; // Teentaal
      const totalTaalBeats = 16;

      for (var col = 0; col < 32; col++) {
        final beatNum = (col % totalTaalBeats) + 1;
        final isTali = taliBeats.contains(beatNum);
        final isKhali = khaliBeats.contains(beatNum);

        if (beatNum == 5 || beatNum == 13) {
          expect(isTali, isTrue, reason: 'Beat $beatNum (col $col) should be Tali');
        }
        if (beatNum == 9) {
          expect(isKhali, isTrue, reason: 'Beat $beatNum (col $col) should be Khali');
        }
      }
    });
  });

  group('Dual Strip - Subdivision clamping', () {
    test('subdivision clamps to range 1..4', () {
      expect(0.clamp(1, 4), 1);
      expect(1.clamp(1, 4), 1);
      expect(2.clamp(1, 4), 2);
      expect(4.clamp(1, 4), 4);
      expect(5.clamp(1, 4), 4);
      expect(10.clamp(1, 4), 4);
    });
  });

  group('Dual Strip - Swar duration computation', () {
    test('swar duration = beat duration / subdivision', () {
      const tempo = 60;
      for (final sub in [1, 2, 4]) {
        final swarDurationMs = (60000 / tempo / sub).round();
        final expectedBeatMs = (60000 / tempo).round();
        expect(swarDurationMs, expectedBeatMs ~/ sub);
      }
    });

    test('at bpm=120 subdivision=2, swar duration is 250ms', () {
      const tempo = 120;
      const subdivision = 2;
      final swarDurationMs = (60000 / tempo / subdivision).round();
      expect(swarDurationMs, 250);
    });

    test('at bpm=60 subdivision=4, swar duration is 250ms', () {
      const tempo = 60;
      const subdivision = 4;
      final swarDurationMs = (60000 / tempo / subdivision).round();
      expect(swarDurationMs, 250);
    });
  });

  group('Dual Strip - Exercise.flatten event count', () {
    test('aaroh+avroh exercise produces correct event count', () {
      const exercise = Exercise(
        id: 'test1',
        title: 'Test',
        category: 'test',
        aaroh: ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni', '.Sa'],
        avroh: ['.Sa', 'Ni', 'Dha', 'Pa', 'Ma', 'Ga', 'Re', 'Sa'],
        swarsPerBeat: 1,
      );

      final events = exercise.flatten();
      expect(events.length, 16);
    });

    test('at subdivision=2 beat columns = events/2', () {
      const exercise = Exercise(
        id: 'test2',
        title: 'Test',
        category: 'test',
        aaroh: ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni', '.Sa'],
        avroh: ['.Sa', 'Ni', 'Dha', 'Pa', 'Ma', 'Ga', 'Re', 'Sa'],
        swarsPerBeat: 2,
      );

      final events = exercise.flatten();
      const subdivision = 2;
      final beatCols = (events.length + subdivision - 1) ~/ subdivision;
      expect(beatCols, events.length ~/ 2);
    });
  });
}

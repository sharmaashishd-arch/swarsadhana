import 'package:flutter_test/flutter_test.dart';
import 'package:swarsadhana/core/constants/music_constants.dart';
import 'package:swarsadhana/core/models/effective_settings.dart';
import 'package:swarsadhana/features/robot_riyaaz/models/exercise.dart';
import 'package:swarsadhana/features/robot_riyaaz/services/pitch_detector.dart';

void main() {
  group('Saptak enum', () {
    test('has exactly 3 values', () {
      expect(Saptak.values.length, 3);
    });

    test('semitone shifts are correct', () {
      expect(Saptak.mandra.semitoneShift, -12);
      expect(Saptak.madhya.semitoneShift, 0);
      expect(Saptak.taar.semitoneShift, 12);
    });

    test('labels are correct', () {
      expect(Saptak.mandra.label, 'Mandra');
      expect(Saptak.madhya.label, 'Madhya');
      expect(Saptak.taar.label, 'Taar');
    });

    test('hindi labels are correct', () {
      expect(Saptak.mandra.hindi, 'मन्द्र');
      expect(Saptak.madhya.hindi, 'मध्य');
      expect(Saptak.taar.hindi, 'तार');
    });
  });

  group('PitchDetector with saptak', () {
    late PitchDetector detector;
    const baseSa = PracticeDefaults.baseSaFreq;

    setUp(() {
      detector = PitchDetector();
    });

    test('default effectiveSaFreq == baseSaFreq (Madhya)', () {
      expect(detector.effectiveSaFreq, closeTo(baseSa, 0.01));
    });

    test('Taar effectiveSaFreq is one octave higher', () {
      detector.setSaptak(12);
      expect(detector.effectiveSaFreq, closeTo(baseSa * 2, 0.1));
    });

    test('Mandra effectiveSaFreq is one octave lower', () {
      detector.setSaptak(-12);
      expect(detector.effectiveSaFreq, closeTo(baseSa / 2, 0.1));
    });

    test('Taar: Sa detected at correct freq', () {
      detector.setSaptak(12);
      final pitch = detector.freqToSwar(baseSa * 2);
      expect(pitch.swar, 'Sa');
      expect(pitch.centsError.abs(), lessThan(5));
    });

    test('Mandra: Sa detected at correct freq', () {
      detector.setSaptak(-12);
      final pitch = detector.freqToSwar(baseSa / 2);
      expect(pitch.swar, 'Sa');
      expect(pitch.centsError.abs(), lessThan(5));
    });

    test('Taar: Pa detected at expected freq', () {
      detector.setSaptak(12);
      const expectedPa = baseSa * 2 * 1.5;
      final pitch = detector.freqToSwar(expectedPa);
      expect(pitch.swar, 'Pa');
      expect(pitch.centsError.abs(), lessThan(5));
    });

    test('Mandra: Pa detected at expected freq', () {
      detector.setSaptak(-12);
      const expectedPa = baseSa / 2 * 1.5;
      final pitch = detector.freqToSwar(expectedPa);
      expect(pitch.swar, 'Pa');
      expect(pitch.centsError.abs(), lessThan(5));
    });

    test('grading expected freq matches playback freq for Taar', () {
      detector.setSaptak(12);
      final pitch = detector.freqToSwar(baseSa * 2);
      expect(pitch.expectedFreq, closeTo(baseSa * 2, 0.5));
    });

    test('grading expected freq matches playback freq for Mandra', () {
      detector.setSaptak(-12);
      final pitch = detector.freqToSwar(baseSa / 2);
      expect(pitch.expectedFreq, closeTo(baseSa / 2, 0.5));
    });
  });

  group('EffectiveExerciseSettings with saptak', () {
    test('resolveSettings uses global saptak', () {
      final settings = resolveSettings(
        exerciseDefaults: const ExerciseDefaults(),
        globalSaptak: Saptak.taar,
      );
      expect(settings.saptak, Saptak.taar);
    });

    test('resolveSettings defaults to madhya when no global saptak', () {
      final settings = resolveSettings(
        exerciseDefaults: const ExerciseDefaults(),
      );
      expect(settings.saptak, Saptak.madhya);
    });

    test('resolveSettings uses exercise recommended saptak as fallback', () {
      final settings = resolveSettings(
        exerciseDefaults: const ExerciseDefaults(recommendedSaptak: 'MANDRA'),
      );
      expect(settings.saptak, Saptak.mandra);
    });

    test('global saptak overrides exercise recommendation', () {
      final settings = resolveSettings(
        exerciseDefaults: const ExerciseDefaults(recommendedSaptak: 'MANDRA'),
        globalSaptak: Saptak.taar,
      );
      expect(settings.saptak, Saptak.taar);
    });
  });

  group('ExerciseDefaults saptak parsing', () {
    test('default recommendedSaptak is MADHYA', () {
      const defaults = ExerciseDefaults();
      expect(defaults.recommendedSaptak, 'MADHYA');
    });

    test('fromJson parses recommended_saptak', () {
      final defaults = ExerciseDefaults.fromJson(const {
        'recommended_saptak': 'TAAR',
      });
      expect(defaults.recommendedSaptak, 'TAAR');
    });

    test('fromJson defaults to MADHYA when not specified', () {
      final defaults = ExerciseDefaults.fromJson(const {});
      expect(defaults.recommendedSaptak, 'MADHYA');
    });
  });
}

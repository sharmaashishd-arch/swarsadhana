import 'package:flutter_test/flutter_test.dart';
import 'package:swarsadhana/features/robot_riyaaz/models/exercise.dart';
import 'package:swarsadhana/features/robot_riyaaz/models/grading.dart';
import 'package:swarsadhana/core/models/effective_settings.dart';

void main() {
  group('PracticeMode enum', () {
    test('has exactly 3 values', () {
      expect(PracticeMode.values.length, 3);
    });

    test('singAlong is a valid mode', () {
      expect(PracticeMode.singAlong, isNotNull);
    });

    test('guidedPractice is a valid mode', () {
      expect(PracticeMode.guidedPractice, isNotNull);
    });

    test('selfPractice is a valid mode', () {
      expect(PracticeMode.selfPractice, isNotNull);
    });
  });

  group('RobotSessionState enum', () {
    test('has singAlong state', () {
      expect(RobotSessionState.singAlong, isNotNull);
    });

    test('has demoPhase state', () {
      expect(RobotSessionState.demoPhase, isNotNull);
    });

    test('has practice state', () {
      expect(RobotSessionState.practice, isNotNull);
    });
  });

  group('ExerciseDefaults', () {
    test('default constructor produces Sing Along mode', () {
      const defaults = ExerciseDefaults();
      expect(defaults.defaultMode, 'SING_ALONG');
    });

    test('default BPM is 90', () {
      const defaults = ExerciseDefaults();
      expect(defaults.recommendedBpm, 90);
    });

    test('default taal is Teentaal', () {
      const defaults = ExerciseDefaults();
      expect(defaults.recommendedTaalId, 'TEENTAAL_16');
    });

    test('default notes per beat is 1', () {
      const defaults = ExerciseDefaults();
      expect(defaults.recommendedNotesPerBeat, 1);
    });

    test('fromJson parses correctly', () {
      final json = {
        'default_mode': 'GUIDED_PRACTICE',
        'recommended_taal_id': 'DADRA_6',
        'recommended_bpm': 60,
        'recommended_notes_per_beat': 2,
      };
      final defaults = ExerciseDefaults.fromJson(json);
      expect(defaults.defaultMode, 'GUIDED_PRACTICE');
      expect(defaults.recommendedTaalId, 'DADRA_6');
      expect(defaults.recommendedBpm, 60);
      expect(defaults.recommendedNotesPerBeat, 2);
    });

    test('fromJson uses defaults for missing fields', () {
      final defaults = ExerciseDefaults.fromJson(const {});
      expect(defaults.defaultMode, 'SING_ALONG');
      expect(defaults.recommendedBpm, 90);
      expect(defaults.recommendedTaalId, 'TEENTAAL_16');
      expect(defaults.recommendedNotesPerBeat, 1);
    });

    test('generateFrom uses provided values', () {
      final defaults = ExerciseDefaults.generateFrom(
        tempoBpm: 60,
        taalId: 'DADRA_6',
        swarsPerBeat: 2,
      );
      expect(defaults.defaultMode, 'SING_ALONG');
      expect(defaults.recommendedBpm, 60);
      expect(defaults.recommendedTaalId, 'DADRA_6');
      expect(defaults.recommendedNotesPerBeat, 2);
    });

    test('generateFrom falls back to defaults for null values', () {
      final defaults = ExerciseDefaults.generateFrom();
      expect(defaults.recommendedBpm, 90);
      expect(defaults.recommendedTaalId, 'TEENTAAL_16');
      expect(defaults.recommendedNotesPerBeat, 1);
    });
  });

  group('Exercise.fromJson with defaults', () {
    test('parses defaults block from JSON', () {
      final json = {
        'id': 'TEST_01',
        'title': 'Test Exercise',
        'category': 'Basic',
        'taal_id': 'TEENTAAL_16',
        'tempo_bpm': 90,
        'swars_per_beat': 1,
        'defaults': {
          'default_mode': 'SING_ALONG',
          'recommended_taal_id': 'TEENTAAL_16',
          'recommended_bpm': 90,
          'recommended_notes_per_beat': 1,
        },
      };
      final exercise = Exercise.fromJson(json);
      expect(exercise.defaults.defaultMode, 'SING_ALONG');
      expect(exercise.defaults.recommendedBpm, 90);
    });

    test('generates defaults when defaults block is missing', () {
      final json = {
        'id': 'TEST_02',
        'title': 'Test Exercise 2',
        'category': 'Basic',
        'taal_id': 'DADRA_6',
        'tempo_bpm': 60,
        'swars_per_beat': 2,
      };
      final exercise = Exercise.fromJson(json);
      expect(exercise.defaults.defaultMode, 'SING_ALONG');
      expect(exercise.defaults.recommendedTaalId, 'DADRA_6');
      expect(exercise.defaults.recommendedBpm, 60);
      expect(exercise.defaults.recommendedNotesPerBeat, 2);
    });

    test('exercise default BPM is 90 when not specified', () {
      final json = {
        'id': 'TEST_03',
        'title': 'No BPM Exercise',
        'category': 'Basic',
      };
      final exercise = Exercise.fromJson(json);
      expect(exercise.tempoBpm, 90);
      expect(exercise.defaults.recommendedBpm, 90);
    });
  });

  group('resolveSettings', () {
    test('uses exercise defaults correctly', () {
      const defaults = ExerciseDefaults(
        defaultMode: 'SING_ALONG',
        recommendedTaalId: 'TEENTAAL_16',
        recommendedBpm: 90,
        recommendedNotesPerBeat: 1,
      );
      final settings = resolveSettings(exerciseDefaults: defaults);
      expect(settings.mode, PracticeMode.singAlong);
      expect(settings.bpm, 90);
      expect(settings.taalId, 'TEENTAAL_16');
      expect(settings.notesPerBeat, 1);
      expect(settings.tanpuraEnabled, true);
      expect(settings.tablaEnabled, true);
    });

    test('resolves guided practice mode', () {
      const defaults = ExerciseDefaults(
        defaultMode: 'GUIDED_PRACTICE',
        recommendedBpm: 60,
      );
      final settings = resolveSettings(exerciseDefaults: defaults);
      expect(settings.mode, PracticeMode.guidedPractice);
      expect(settings.bpm, 60);
    });

    test('resolves self practice mode', () {
      const defaults = ExerciseDefaults(
        defaultMode: 'SELF_PRACTICE',
      );
      final settings = resolveSettings(exerciseDefaults: defaults);
      expect(settings.mode, PracticeMode.selfPractice);
    });

    test('falls back to global BPM when exercise BPM is 0', () {
      const defaults = ExerciseDefaults(recommendedBpm: 0);
      final settings = resolveSettings(
        exerciseDefaults: defaults,
        globalDefaultBpm: 90,
      );
      expect(settings.bpm, 90);
    });

    test('uses accompaniment defaults', () {
      const defaults = ExerciseDefaults();
      const acc = AccompanimentDefaults(
        tanpuraEnabled: false,
        tablaEnabled: true,
      );
      final settings = resolveSettings(
        exerciseDefaults: defaults,
        accompanimentDefaults: acc,
      );
      expect(settings.tanpuraEnabled, false);
      expect(settings.tablaEnabled, true);
    });

    test('unknown mode string defaults to singAlong', () {
      const defaults = ExerciseDefaults(defaultMode: 'UNKNOWN_MODE');
      final settings = resolveSettings(exerciseDefaults: defaults);
      expect(settings.mode, PracticeMode.singAlong);
    });
  });
}

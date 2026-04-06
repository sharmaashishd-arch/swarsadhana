import 'package:flutter_test/flutter_test.dart';
import 'package:swarsadhana/core/constants/music_constants.dart';
import 'package:swarsadhana/features/robot_riyaaz/models/exercise.dart';

void main() {
  group('AccompanimentDefaults parsing', () {
    test('parses full accompaniment_defaults from JSON', () {
      final json = {
        'tanpura': {
          'enabled': true,
          'pattern': 'PaSa',
          'volume': 0.55,
        },
        'tabla': {
          'enabled': true,
          'volume': 0.65,
        },
        'count_in_avartans': 1,
        'demo_avartans': 1,
        'practice_avartans': 2,
        'swar_per_matra': 1,
      };

      final defaults = AccompanimentDefaults.fromJson(json);

      expect(defaults.tanpuraEnabled, true);
      expect(defaults.tanpuraPattern, 'PaSa');
      expect(defaults.tanpuraVolume, 0.55);
      expect(defaults.tablaEnabled, true);
      expect(defaults.tablaVolume, 0.65);
      expect(defaults.countInAvartans, 1);
      expect(defaults.demoAvartans, 1);
      expect(defaults.practiceAvartans, 2);
      expect(defaults.swarPerMatra, 1);
    });

    test('uses sensible defaults when JSON is empty', () {
      final defaults = AccompanimentDefaults.fromJson(const {});

      expect(defaults.tanpuraEnabled, PracticeDefaults.tanpuraEnabled);
      expect(defaults.tanpuraPattern, PracticeDefaults.tanpuraPattern);
      expect(defaults.tanpuraVolume, PracticeDefaults.tanpuraVolume);
      expect(defaults.tablaEnabled, PracticeDefaults.tablaEnabled);
      expect(defaults.tablaVolume, PracticeDefaults.tablaVolume);
      expect(defaults.countInAvartans, PracticeDefaults.countInAvartans);
      expect(defaults.demoAvartans, PracticeDefaults.demoAvartans);
      expect(defaults.practiceAvartans, PracticeDefaults.practiceAvartans);
      expect(defaults.swarPerMatra, PracticeDefaults.swarPerMatra);
    });

    test('handles disabled accompaniment', () {
      final json = {
        'tanpura': {'enabled': false, 'volume': 0.3},
        'tabla': {'enabled': false, 'volume': 0.4},
      };

      final defaults = AccompanimentDefaults.fromJson(json);

      expect(defaults.tanpuraEnabled, false);
      expect(defaults.tanpuraVolume, 0.3);
      expect(defaults.tablaEnabled, false);
      expect(defaults.tablaVolume, 0.4);
    });

    test('const default constructor has expected values', () {
      const defaults = AccompanimentDefaults();

      expect(defaults.tanpuraEnabled, PracticeDefaults.tanpuraEnabled);
      expect(defaults.tanpuraPattern, PracticeDefaults.tanpuraPattern);
      expect(defaults.tanpuraVolume, PracticeDefaults.tanpuraVolume);
      expect(defaults.tablaEnabled, PracticeDefaults.tablaEnabled);
      expect(defaults.tablaVolume, PracticeDefaults.tablaVolume);
    });
  });

  group('ExerciseLibrary with accompaniment_defaults', () {
    test('parses accompaniment_defaults from library JSON', () {
      final json = {
        'version': '1.0',
        'title': 'Test',
        'categories': <String>[],
        'exercises': <Map<String, dynamic>>[],
        'taals': <String, dynamic>{},
        'swaras': <String, dynamic>{},
        'accompaniment_defaults': {
          'tanpura': {'enabled': true, 'volume': 0.6},
          'tabla': {'enabled': true, 'volume': 0.7},
          'count_in_avartans': 2,
        },
      };

      final library = ExerciseLibrary.fromJson(json);

      expect(library.accompanimentDefaults.tanpuraEnabled, true);
      expect(library.accompanimentDefaults.tanpuraVolume, 0.6);
      expect(library.accompanimentDefaults.tablaEnabled, true);
      expect(library.accompanimentDefaults.tablaVolume, 0.7);
      expect(library.accompanimentDefaults.countInAvartans, 2);
    });

    test('uses const default when accompaniment_defaults missing', () {
      final json = {
        'version': '1.0',
        'title': 'Test',
        'categories': <String>[],
        'exercises': <Map<String, dynamic>>[],
        'taals': <String, dynamic>{},
        'swaras': <String, dynamic>{},
      };

      final library = ExerciseLibrary.fromJson(json);

      expect(library.accompanimentDefaults.tanpuraEnabled, PracticeDefaults.tanpuraEnabled);
      expect(library.accompanimentDefaults.tanpuraVolume, PracticeDefaults.tanpuraVolume);
      expect(library.accompanimentDefaults.tablaEnabled, PracticeDefaults.tablaEnabled);
      expect(library.accompanimentDefaults.tablaVolume, PracticeDefaults.tablaVolume);
    });
  });

  group('AccompanimentDefaults from real exercise file', () {
    test('parses the actual hindustani_class1.json structure', () {
      final json = {
        'version': '1.0',
        'title': 'Hindustani Class 1 - Exercises',
        'default_settings': {'base_sa': 'C4', 'default_tempo_bpm': 60},
        'accompaniment_defaults': {
          'tanpura': {'enabled': true, 'pattern': 'PaSa', 'volume': 0.55},
          'tabla': {'enabled': true, 'volume': 0.65},
          'count_in_avartans': 1,
          'demo_avartans': 1,
          'practice_avartans': 2,
          'swar_per_matra': 1,
        },
        'taals': {
          'TEENTAAL_16': {
            'id': 'TEENTAAL_16',
            'name': 'Teentaal',
            'beats': 16,
            'vibhag': [4, 4, 4, 4],
            'sam_beat': 1,
            'tali_beats': [1, 5, 13],
            'khali_beats': [9],
          },
        },
        'swaras': {
          'Sa': {'semitone': 0, 'hindi': 'सा'},
        },
        'categories': ['Basic Sargam'],
        'exercises': [
          {
            'id': 'BASIC_01',
            'title': 'Exercise 1',
            'category': 'Basic Sargam',
            'taal_id': 'TEENTAAL_16',
            'tempo_bpm': 60,
            'aaroh': ['Sa'],
          }
        ],
      };

      final library = ExerciseLibrary.fromJson(json);
      final defaults = library.accompanimentDefaults;

      expect(defaults.tanpuraEnabled, true);
      expect(defaults.tanpuraPattern, 'PaSa');
      expect(defaults.tanpuraVolume, 0.55);
      expect(defaults.tablaEnabled, true);
      expect(defaults.tablaVolume, 0.65);
      expect(defaults.countInAvartans, 1);
      expect(defaults.demoAvartans, 1);
      expect(defaults.practiceAvartans, 2);
      expect(defaults.swarPerMatra, 1);

      expect(library.exercises.length, 1);
      expect(library.exercises.first.taalId, 'TEENTAAL_16');
    });
  });
}

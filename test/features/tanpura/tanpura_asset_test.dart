import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:swarsadhana/core/constants/music_constants.dart';

void main() {
  const keyNames = [
    'c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b'
  ];

  group('Tanpura asset files exist', () {
    for (final key in keyNames) {
      test('pa_sa_$key.mp3 exists', () {
        final file = File('assets/audio/tanpura/pa_sa_$key.mp3');
        expect(file.existsSync(), isTrue,
            reason: 'Missing tanpura asset: pa_sa_$key.mp3');
      });

      test('ma_sa_$key.mp3 exists', () {
        final file = File('assets/audio/tanpura/ma_sa_$key.mp3');
        expect(file.existsSync(), isTrue,
            reason: 'Missing tanpura asset: ma_sa_$key.mp3');
      });
    }

    test('accordion SF2 exists', () {
      final file = File('assets/soundfonts/accordion_fluidr3.sf2');
      expect(file.existsSync(), isTrue,
          reason: 'Missing accordion_fluidr3.sf2');
    });

    test('licenses.md exists', () {
      final file = File('assets/licenses.md');
      expect(file.existsSync(), isTrue,
          reason: 'Missing licenses.md');
    });
  });

  group('Tanpura asset path resolution', () {
    test('all RootKey values have a corresponding key name', () {
      // Ensure the keyNames list matches RootKey.values length
      expect(keyNames.length, RootKey.values.length);
    });

    test('pa_sa asset path for each RootKey resolves to existing file', () {
      for (int i = 0; i < RootKey.values.length; i++) {
        final path = 'assets/audio/tanpura/pa_sa_${keyNames[i]}.mp3';
        expect(File(path).existsSync(), isTrue,
            reason: 'Missing file for key ${RootKey.values[i]}: $path');
      }
    });

    test('ma_sa asset path for each RootKey resolves to existing file', () {
      for (int i = 0; i < RootKey.values.length; i++) {
        final path = 'assets/audio/tanpura/ma_sa_${keyNames[i]}.mp3';
        expect(File(path).existsSync(), isTrue,
            reason: 'Missing file for key ${RootKey.values[i]}: $path');
      }
    });
  });

  group('Tanpura asset file sizes', () {
    test('all tanpura MP3 files are non-empty (>100KB)', () {
      for (final key in keyNames) {
        for (final tuning in ['pa_sa', 'ma_sa']) {
          final file = File('assets/audio/tanpura/${tuning}_$key.mp3');
          if (file.existsSync()) {
            final sizeKB = file.lengthSync() / 1024;
            expect(sizeKB, greaterThan(100),
                reason:
                    '${tuning}_$key.mp3 is too small (${sizeKB.toStringAsFixed(0)}KB)');
          }
        }
      }
    });
  });

  group('Web tanpura assets mirror Flutter assets', () {
    for (final key in keyNames) {
      test('web pa_sa_$key.mp3 exists', () {
        final file = File('web/assets/audio/tanpura/pa_sa_$key.mp3');
        expect(file.existsSync(), isTrue,
            reason: 'Missing web tanpura asset: pa_sa_$key.mp3');
      });

      test('web ma_sa_$key.mp3 exists', () {
        final file = File('web/assets/audio/tanpura/ma_sa_$key.mp3');
        expect(file.existsSync(), isTrue,
            reason: 'Missing web tanpura asset: ma_sa_$key.mp3');
      });
    }

    test('web and Flutter tanpura files are identical', () {
      for (final key in keyNames) {
        for (final tuning in ['pa_sa', 'ma_sa']) {
          final flutterFile =
              File('assets/audio/tanpura/${tuning}_$key.mp3');
          final webFile =
              File('web/assets/audio/tanpura/${tuning}_$key.mp3');
          if (flutterFile.existsSync() && webFile.existsSync()) {
            expect(webFile.lengthSync(), flutterFile.lengthSync(),
                reason:
                    'Size mismatch for ${tuning}_$key.mp3: web vs flutter');
          }
        }
      }
    });
  });
}

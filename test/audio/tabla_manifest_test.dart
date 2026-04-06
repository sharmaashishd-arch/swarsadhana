import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Tabla manifest validation', () {
    late Map<String, dynamic> manifest;
    late List<dynamic> samples;

    const allowedLicenses = {
      'CC0',
      'cc0',
      'generated-no-license-needed',
      'pixabay-content-license',
      'samplefocus-royalty-free',
    };

    const requiredBols = {'dha', 'dhin', 'tin', 'na', 'ta', 'ge', 'ke'};
    const requiredVariants = {'v1', 'v2'};
    const requiredFields = {
      'filename',
      'bol',
      'variant',
      'source_url',
      'license',
      'attribution_required',
    };

    setUpAll(() {
      final file = File('assets/audio/tabla/manifest.json');
      expect(file.existsSync(), isTrue, reason: 'manifest.json must exist');
      manifest = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
      samples = manifest['samples'] as List<dynamic>;
    });

    test('manifest has samples', () {
      expect(samples, isNotEmpty);
    });

    test('every sample has required fields', () {
      for (final entry in samples) {
        final map = entry as Map<String, dynamic>;
        for (final field in requiredFields) {
          expect(map.containsKey(field), isTrue,
              reason: '${map['filename']} missing field: $field');
        }
      }
    });

    test('no sample requires attribution', () {
      for (final entry in samples) {
        final map = entry as Map<String, dynamic>;
        expect(map['attribution_required'], isFalse,
            reason: '${map['filename']} has attribution_required=true');
      }
    });

    test('all licenses are in the allowed list', () {
      for (final entry in samples) {
        final map = entry as Map<String, dynamic>;
        final license = map['license'] as String;
        expect(allowedLicenses.contains(license), isTrue,
            reason: '${map['filename']} has unknown license: $license');
      }
    });

    test('every WAV file exists on disk', () {
      for (final entry in samples) {
        final map = entry as Map<String, dynamic>;
        final path = 'assets/audio/tabla/${map['filename']}';
        expect(File(path).existsSync(), isTrue,
            reason: 'Missing WAV: $path');
      }
    });

    test('all required bols are present with v1 and v2 variants', () {
      final bolVariants = <String, Set<String>>{};
      for (final entry in samples) {
        final map = entry as Map<String, dynamic>;
        final bol = map['bol'] as String;
        final variant = map['variant'] as String;
        bolVariants.putIfAbsent(bol, () => {}).add(variant);
      }

      for (final bol in requiredBols) {
        expect(bolVariants.containsKey(bol), isTrue,
            reason: 'Missing bol: $bol');
        for (final v in requiredVariants) {
          expect(bolVariants[bol]!.contains(v), isTrue,
              reason: 'Bol $bol missing variant $v');
        }
      }
    });

    test('web assets mirror Flutter tabla oneshots', () {
      for (final entry in samples) {
        final map = entry as Map<String, dynamic>;
        final flutterPath = 'assets/audio/tabla/${map['filename']}';
        final webPath = 'web/assets/audio/tabla/${map['filename']}';
        expect(File(flutterPath).existsSync(), isTrue,
            reason: 'Missing Flutter: $flutterPath');
        expect(File(webPath).existsSync(), isTrue,
            reason: 'Missing Web: $webPath');
      }
    });
  });
}

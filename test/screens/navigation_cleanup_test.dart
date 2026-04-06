import 'dart:io';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Navigation Cleanup', () {
    late String homeScreenSource;

    setUpAll(() {
      homeScreenSource = File('lib/screens/home_screen.dart').readAsStringSync();
    });

    test('home_screen has no Instruments tab in bottom nav', () {
      expect(homeScreenSource.contains("'Instruments'"), isFalse,
          reason: 'Instruments tab text should be removed from navigation');
    });

    test('home_screen has no BottomNavigationBar or _buildBottomNavBar', () {
      expect(homeScreenSource.contains('_buildBottomNavBar'), isFalse,
          reason: 'Bottom nav bar builder should be removed');
      expect(homeScreenSource.contains('_buildNavItem'), isFalse,
          reason: 'Nav item builder should be removed');
    });

    test('home_screen has no IndexedStack with two tabs', () {
      expect(homeScreenSource.contains('_buildInstrumentsTab'), isFalse,
          reason: 'Instruments tab builder should be removed');
    });

    test('home_screen shows RobotRiyaazScreen directly', () {
      expect(homeScreenSource.contains('RobotRiyaazScreen'), isTrue,
          reason: 'Exercise screen should be shown directly');
    });

    test('home_screen has gear icon for settings', () {
      expect(homeScreenSource.contains('Icons.settings_outlined'), isTrue,
          reason: 'Gear icon should be present');
    });

    test('home_screen has Practice Setup sheet', () {
      expect(homeScreenSource.contains('_showPracticeSetup'), isTrue,
          reason: 'Practice Setup method should exist');
      expect(homeScreenSource.contains('Practice Setup'), isTrue,
          reason: 'Practice Setup title should be present');
    });

    test('Practice Setup contains Key (Sa) picker', () {
      expect(homeScreenSource.contains('Sa (Key)'), isTrue,
          reason: 'Sa key picker should be in Practice Setup');
    });

    test('Practice Setup contains BPM control', () {
      expect(homeScreenSource.contains('Default BPM'), isTrue,
          reason: 'BPM control should be in Practice Setup');
    });

    test('Practice Setup contains Tanpura section', () {
      expect(homeScreenSource.contains("'Tanpura'"), isTrue,
          reason: 'Tanpura section should be in Practice Setup');
    });

    test('Practice Setup contains Tabla section', () {
      expect(homeScreenSource.contains("'Tabla'"), isTrue,
          reason: 'Tabla section should be in Practice Setup');
    });

    test('Practice Setup contains collapsed Diagnostics section', () {
      expect(homeScreenSource.contains('Diagnostics'), isTrue,
          reason: 'Diagnostics section should be present in Practice Setup');
      expect(homeScreenSource.contains('_diagnosticsExpanded'), isTrue,
          reason: 'Diagnostics should be collapsible');
    });

    test('default BPM uses PracticeDefaults.tempo', () {
      expect(homeScreenSource.contains('_currentTempo = PracticeDefaults.tempo'),
          isTrue,
          reason: 'Default tempo should use centralized PracticeDefaults.tempo');
    });
  });

  group('Web Navigation Cleanup', () {
    late String indexHtml;

    setUpAll(() {
      indexHtml = File('web/index.html').readAsStringSync();
    });

    test('no Instruments nav tab in web', () {
      expect(indexHtml.contains('Instruments</button>'), isFalse,
          reason: 'Instruments tab button should not be in nav');
      expect(indexHtml.contains('<nav class="main-nav">'), isFalse,
          reason: 'Main nav bar should be removed');
    });

    test('Sadhana tab is shown by default (no hidden class)', () {
      expect(indexHtml.contains('id="tab-robot-riyaaz"'), isTrue);
      final tabSection = indexHtml.substring(
          indexHtml.indexOf('id="tab-robot-riyaaz"') - 50,
          indexHtml.indexOf('id="tab-robot-riyaaz"') + 30);
      expect(tabSection.contains('hidden'), isFalse,
          reason: 'Sadhana tab should not have hidden class');
    });

    test('Instruments tab is hidden with display:none', () {
      final idx = indexHtml.indexOf('id="tab-instruments"');
      expect(idx, greaterThan(-1));
      final surroundingStart = (idx - 80).clamp(0, indexHtml.length);
      final surroundingEnd = (idx + 80).clamp(0, indexHtml.length);
      final surrounding = indexHtml.substring(surroundingStart, surroundingEnd);
      expect(surrounding.contains('display:none'), isTrue,
          reason: 'Instruments tab should have display:none');
    });

    test('Practice Setup modal exists', () {
      expect(indexHtml.contains('practice-setup-overlay'), isTrue,
          reason: 'Practice Setup overlay should exist');
      expect(indexHtml.contains('Practice Setup'), isTrue,
          reason: 'Practice Setup title should exist');
    });

    test('gear icon opens Practice Setup', () {
      expect(indexHtml.contains('showSettings()'), isTrue);
      expect(indexHtml.contains('practice-setup-overlay'), isTrue);
    });

    test('diagnostics section is collapsed by default', () {
      expect(indexHtml.contains('diagnostics-toggle'), isTrue);
      expect(indexHtml.contains('id="diagnostics-panel" style="display:none"'),
          isTrue,
          reason: 'Diagnostics panel should be hidden by default');
    });

    test('default BPM uses PRACTICE_DEFAULTS.tempo in web', () {
      expect(indexHtml.contains('globalTempo = PRACTICE_DEFAULTS.tempo'), isTrue,
          reason: 'Default global tempo should use PRACTICE_DEFAULTS.tempo');
      expect(indexHtml.contains('value="90"'), isTrue,
          reason: 'BPM slider default value should match centralized tempo (90)');
    });
  });
}

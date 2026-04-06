import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../../core/constants/music_constants.dart';
import '../models/grading.dart';

/// Pitch detector for Flutter
/// 
/// Uses autocorrelation-based pitch detection
/// For production, consider using native implementations via platform channels
class PitchDetector {
  bool _isListening = false;
  Timer? _simulationTimer;
  Function(PitchInfo)? _onPitchCallback;
  
  // Calibration
  double _baseSaFreq = PracticeDefaults.baseSaFreq;
  int _saptakSemitones = 0;
  
  // Swar ratios (Just Intonation)
  static const Map<String, double> swarRatios = {
    'Sa': 1,
    're': 256/243,
    'Re': 9/8,
    'ga': 32/27,
    'Ga': 5/4,
    'Ma': 4/3,
    'ma': 45/32,
    'Pa': 3/2,
    'dha': 128/81,
    'Dha': 5/3,
    'ni': 16/9,
    'Ni': 15/8,
  };
  
  static const List<String> swarList = [
    'Sa', 're', 'Re', 'ga', 'Ga', 'Ma', 'ma', 'Pa', 'dha', 'Dha', 'ni', 'Ni'
  ];

  bool get isListening => _isListening;

  /// Request microphone permission
  Future<bool> requestPermission() async {
    final status = await Permission.microphone.request();
    return status.isGranted;
  }

  /// Start pitch detection
  Future<void> start() async {
    if (_isListening) return;
    
    final hasPermission = await requestPermission();
    if (!hasPermission) {
      debugPrint('❌ Microphone permission denied');
      return;
    }
    
    _isListening = true;
    debugPrint('🎤 Pitch detection started (simulation mode)');
    
    // TODO: Implement actual pitch detection using:
    // - Platform channels to native iOS/Android audio APIs
    // - Or use a package like flutter_sound with FFT analysis
    
    // For MVP, we'll simulate pitch detection
    // In production, replace with actual microphone input + YIN algorithm
    _startSimulation();
  }

  /// Stop pitch detection
  void stop() {
    _isListening = false;
    _simulationTimer?.cancel();
    _simulationTimer = null;
    debugPrint('🛑 Pitch detection stopped');
  }

  /// Set callback for pitch events
  void onPitch(Function(PitchInfo) callback) {
    _onPitchCallback = callback;
  }

  /// Calibrate Sa frequency
  void calibrateSa(double frequency) {
    _baseSaFreq = frequency;
    debugPrint('🎵 Sa calibrated to ${frequency.toStringAsFixed(2)} Hz');
  }

  /// Set saptak shift in semitones (-12, 0, +12)
  void setSaptak(int semitoneShift) {
    _saptakSemitones = semitoneShift;
  }

  /// Sa frequency shifted by saptak
  double get effectiveSaFreq =>
      _baseSaFreq * pow(2, _saptakSemitones / 12.0);

  /// Convert frequency to swar, using saptak-adjusted Sa
  PitchInfo freqToSwar(double freq) {
    final baseSa = effectiveSaFreq;

    // Normalize to same octave as Sa
    var normalizedFreq = freq;
    var octaveShift = 0;
    
    while (normalizedFreq >= baseSa * 2) {
      normalizedFreq /= 2;
      octaveShift++;
    }
    while (normalizedFreq < baseSa) {
      normalizedFreq *= 2;
      octaveShift--;
    }
    
    // Find closest swar
    var closestSwar = 'Sa';
    var minCents = double.infinity;
    var closestRatio = 1.0;
    
    for (final swar in swarList) {
      final targetFreq = baseSa * swarRatios[swar]!;
      final cents = 1200 * log(normalizedFreq / targetFreq) / log(2);
      
      if (cents.abs() < minCents.abs()) {
        minCents = cents;
        closestSwar = swar;
        closestRatio = swarRatios[swar]!;
      }
    }
    
    // Check upper octave Sa
    final upperSaFreq = baseSa * 2;
    final upperSaCents = 1200 * log(normalizedFreq / upperSaFreq) / log(2);
    if (upperSaCents.abs() < minCents.abs()) {
      return PitchInfo(
        frequency: freq,
        swar: '.Sa',
        centsError: upperSaCents.round(),
        octaveShift: octaveShift + 1,
        expectedFreq: upperSaFreq,
        timestamp: DateTime.now().millisecondsSinceEpoch.toDouble(),
      );
    }
    
    return PitchInfo(
      frequency: freq,
      swar: closestSwar,
      centsError: minCents.round(),
      octaveShift: octaveShift,
      expectedFreq: baseSa * closestRatio * pow(2, octaveShift.toDouble()),
      timestamp: DateTime.now().millisecondsSinceEpoch.toDouble(),
    );
  }

  /// Simulate pitch detection for testing
  void _startSimulation() {
    final random = Random();
    
    _simulationTimer = Timer.periodic(
      const Duration(milliseconds: 100),
      (_) {
        if (!_isListening) return;
        
        // Randomly generate a pitch around common swaras
        final swarIndex = random.nextInt(swarList.length);
        final swar = swarList[swarIndex];
        final ratio = swarRatios[swar]!;
        
        // Add some random variation (±30 cents)
        final cents = (random.nextDouble() - 0.5) * 60;
        final freq = _baseSaFreq * ratio * pow(2, cents / 1200);
        
        final pitch = freqToSwar(freq);
        
        if (_onPitchCallback != null) {
          _onPitchCallback!(pitch);
        }
      },
    );
  }
}

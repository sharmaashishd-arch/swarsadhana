import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../../core/constants/music_constants.dart';

/// Provider for Pitch Monitor (Tuner) functionality
/// 
/// Features:
/// - Real-time pitch detection from microphone
/// - Mapping to Indian Swaras
/// - Intonation accuracy display
class PitchMonitorProvider extends ChangeNotifier {
  bool _isEnabled = false; // Pro feature
  bool _isListening = false;
  bool _hasPermission = false;
  
  double _currentFrequency = 0.0;
  Swara? _currentSwara;
  double _centsOffset = 0.0; // How sharp/flat (-50 to +50)
  
  RootKey _referenceKey = PracticeDefaults.key;
  int _referenceOctave = 4;
  
  StreamSubscription? _audioSubscription;

  // Getters
  bool get isEnabled => _isEnabled;
  bool get isListening => _isListening;
  bool get hasPermission => _hasPermission;
  
  double get currentFrequency => _currentFrequency;
  Swara? get currentSwara => _currentSwara;
  double get centsOffset => _centsOffset;
  
  RootKey get referenceKey => _referenceKey;
  int get referenceOctave => _referenceOctave;
  
  /// Reference frequency for Sa
  double get referenceFrequency {
    // A4 = 440 Hz
    const double a4 = 440.0;
    final semitonesFromA4 = (_referenceOctave - 4) * 12 + _referenceKey.semitones - RootKey.A.index;
    return a4 * math.pow(2, semitonesFromA4 / 12.0);
  }
  
  /// Intonation status
  String get intonationStatus {
    if (_currentSwara == null) return '';
    if (_centsOffset.abs() < 5) return 'In Tune';
    if (_centsOffset > 0) return 'Sharp';
    return 'Flat';
  }

  /// Request microphone permission
  Future<bool> requestPermission() async {
    final status = await Permission.microphone.request();
    _hasPermission = status.isGranted;
    notifyListeners();
    return _hasPermission;
  }

  /// Start listening to microphone
  Future<void> startListening() async {
    if (!_isEnabled || _isListening) return;
    
    if (!_hasPermission) {
      final granted = await requestPermission();
      if (!granted) return;
    }
    
    _isListening = true;
    notifyListeners();
    
    // TODO: Implement actual audio input and FFT analysis
    // This would use platform channels to:
    // 1. Access microphone via AVAudioEngine (iOS) or AudioRecord (Android)
    // 2. Perform FFT to find fundamental frequency
    // 3. Map frequency to Swara
    
    // Placeholder: Simulate pitch detection
    _startSimulatedDetection();
  }

  /// Stop listening
  void stopListening() {
    _audioSubscription?.cancel();
    _isListening = false;
    _currentFrequency = 0;
    _currentSwara = null;
    _centsOffset = 0;
    notifyListeners();
  }

  /// Set reference key (Sa position)
  void setReferenceKey(RootKey key) {
    _referenceKey = key;
    notifyListeners();
  }

  /// Set reference octave
  void setReferenceOctave(int octave) {
    _referenceOctave = octave.clamp(2, 6);
    notifyListeners();
  }

  void setEnabled(bool enabled) {
    _isEnabled = enabled;
    if (!enabled) {
      stopListening();
    }
    notifyListeners();
  }

  /// Process detected frequency
  void _processFrequency(double frequency) {
    if (frequency < 50 || frequency > 2000) {
      _currentFrequency = 0;
      _currentSwara = null;
      _centsOffset = 0;
      notifyListeners();
      return;
    }
    
    _currentFrequency = frequency;
    
    // Calculate semitones from reference Sa
    final refFreq = referenceFrequency;
    final semitones = 12 * math.log(frequency / refFreq) / math.ln2;
    
    // Normalize to 0-12 range
    int normalizedSemitones = (semitones.round() % 12 + 12) % 12;
    
    // Map to Swara
    _currentSwara = _semitoneToSwara(normalizedSemitones);
    
    // Calculate cents offset from perfect pitch
    final perfectSemitones = normalizedSemitones.toDouble();
    _centsOffset = (semitones - perfectSemitones) * 100;
    _centsOffset = _centsOffset.clamp(-50.0, 50.0);
    
    notifyListeners();
  }

  /// Maps a semitone offset (0–11) to the corresponding Swara enum value.
  /// Swara enum values are ordered chromatically starting from Sa = 0.
  Swara _semitoneToSwara(int semitone) {
    final idx = semitone.clamp(0, Swara.values.length - 1);
    return Swara.values[idx];
  }

  // Simulated pitch detection for development
  void _startSimulatedDetection() {
    _audioSubscription?.cancel();
    
    // Simulate random pitch changes
    _audioSubscription = Stream.periodic(
      const Duration(milliseconds: 100),
      (i) => 220.0 + (i % 100) * 2.0, // Simulate pitch around 220-420 Hz
    ).listen(_processFrequency);
  }

  @override
  void dispose() {
    _audioSubscription?.cancel();
    super.dispose();
  }
}


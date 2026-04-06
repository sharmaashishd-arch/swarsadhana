import 'package:flutter/foundation.dart';
import '../../../core/audio/audio_engine.dart';

/// Provider for Swarmandal (Indian harp) instrument control
/// 
/// Features:
/// - Manual strum trigger
/// - Auto-strum with interval timing
/// - Volume control
class SwarmandalProvider extends ChangeNotifier {
  AudioEngine _audioEngine;
  
  static const String _trackId = 'swarmandal';
  
  bool _isEnabled = false; // Pro feature
  bool _isAutoPlaying = false;
  double _volume = 0.6;
  int _autoStrumInterval = 4000; // milliseconds

  SwarmandalProvider(this._audioEngine);
  
  void updateEngine(AudioEngine engine) {
    _audioEngine = engine;
  }

  bool get isEnabled => _isEnabled;
  bool get isAutoPlaying => _isAutoPlaying;
  double get volume => _volume;
  int get autoStrumInterval => _autoStrumInterval;

  /// Trigger a single strum
  Future<void> strum() async {
    if (!_isEnabled) return;
    
    try {
      final track = await _audioEngine.createTrack(
        id: '${_trackId}_${DateTime.now().millisecondsSinceEpoch}',
        assetPath: 'assets/audio/swarmandal/swarmandal_strum.wav',
        loop: false,
        volume: _volume,
      );
      
      track.followsGlobalKey = true;
      track.followsGlobalTempo = false;
      
      await track.play();
    } catch (e) {
      debugPrint('Failed to play Swarmandal: $e');
    }
  }

  /// Toggle auto-strum mode
  void toggleAutoStrum() {
    _isAutoPlaying = !_isAutoPlaying;
    notifyListeners();
  }

  void setVolume(double vol) {
    _volume = vol.clamp(0.0, 1.0);
    notifyListeners();
  }

  void setAutoStrumInterval(int ms) {
    _autoStrumInterval = ms.clamp(1000, 10000);
    notifyListeners();
  }

  void setEnabled(bool enabled) {
    _isEnabled = enabled;
    if (!enabled) {
      _isAutoPlaying = false;
    }
    notifyListeners();
  }
}


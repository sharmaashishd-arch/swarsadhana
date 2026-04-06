import 'package:flutter/foundation.dart';
import '../../../core/audio/audio_engine.dart';
import '../../../core/constants/music_constants.dart';

class TanpuraProvider extends ChangeNotifier {
  AudioEngine _audioEngine;

  static const String _track1Id = 'tanpura_1';
  static const String _track2Id = 'tanpura_2';
  static const String _crossfadeTrackId = 'tanpura_crossfade';

  bool _isPlaying1 = false;
  bool _isPlaying2 = false;

  double _volume1 = PracticeDefaults.tanpuraVolume;
  double _volume2 = PracticeDefaults.tanpuraVolume;

  int _fineTune1 = 0;
  int _fineTune2 = 0;

  TanpuraStrings _strings1 = TanpuraStrings.paSaSaSa;
  TanpuraStrings _strings2 = TanpuraStrings.paSaSaSa;

  bool _isEnabled1 = true;
  bool _isEnabled2 = false;

  RootKey _currentKey = PracticeDefaults.key;

  static const List<String> _keyNames = [
    'c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b'
  ];

  TanpuraProvider(this._audioEngine);

  void updateEngine(AudioEngine engine) {
    _audioEngine = engine;
  }

  // Getters
  bool get isPlaying1 => _isPlaying1;
  bool get isPlaying2 => _isPlaying2;
  bool get isPlaying => _isPlaying1 || _isPlaying2;
  double get volume1 => _volume1;
  double get volume2 => _volume2;
  int get fineTune1 => _fineTune1;
  int get fineTune2 => _fineTune2;
  TanpuraStrings get strings1 => _strings1;
  TanpuraStrings get strings2 => _strings2;
  bool get isEnabled1 => _isEnabled1;
  bool get isEnabled2 => _isEnabled2;
  RootKey get currentKey => _currentKey;

  /// Called when the global key changes. Reloads drones to match the new key.
  Future<void> setKey(RootKey key) async {
    if (_currentKey == key) return;
    _currentKey = key;

    if (_isPlaying1) {
      await _crossfadeRestart(_track1Id, _strings1, _volume1, _fineTune1);
    }
    if (_isPlaying2) {
      await _crossfadeRestart(_track2Id, _strings2, _volume2, _fineTune2);
    }
    notifyListeners();
  }

  Future<void> toggleTanpura1() async {
    if (!_isEnabled1) return;
    if (_isPlaying1) {
      await _stopTanpura(_track1Id);
      _isPlaying1 = false;
    } else {
      await _startTanpura(_track1Id, _strings1, _volume1, _fineTune1);
      _isPlaying1 = true;
    }
    notifyListeners();
  }

  Future<void> toggleTanpura2() async {
    if (!_isEnabled2) return;
    if (_isPlaying2) {
      await _stopTanpura(_track2Id);
      _isPlaying2 = false;
    } else {
      await _startTanpura(_track2Id, _strings2, _volume2, _fineTune2);
      _isPlaying2 = true;
    }
    notifyListeners();
  }

  Future<void> play1() async {
    if (_isPlaying1) return;
    await _startTanpura(_track1Id, _strings1, _volume1, _fineTune1);
    _isPlaying1 = true;
    notifyListeners();
  }

  Future<void> stop1() async {
    if (!_isPlaying1) return;
    await _stopTanpura(_track1Id);
    _isPlaying1 = false;
    notifyListeners();
  }

  Future<void> playAll() async {
    if (_isEnabled1 && !_isPlaying1) {
      await _startTanpura(_track1Id, _strings1, _volume1, _fineTune1);
      _isPlaying1 = true;
    }
    if (_isEnabled2 && !_isPlaying2) {
      await _startTanpura(_track2Id, _strings2, _volume2, _fineTune2);
      _isPlaying2 = true;
    }
    notifyListeners();
  }

  Future<void> stopAll() async {
    if (_isPlaying1) {
      await _stopTanpura(_track1Id);
      _isPlaying1 = false;
    }
    if (_isPlaying2) {
      await _stopTanpura(_track2Id);
      _isPlaying2 = false;
    }
    notifyListeners();
  }

  Future<void> _startTanpura(
    String trackId,
    TanpuraStrings strings,
    double volume,
    int fineTuneCents,
  ) async {
    try {
      final assetPath = _getAssetPath(strings, _currentKey);
      final track = await _audioEngine.createTrack(
        id: trackId,
        assetPath: assetPath,
        loop: true,
        volume: volume,
      );

      // No pitch-shifting for key — we load the correct key's recording.
      // Only apply fine-tuning if set.
      track.followsGlobalKey = false;
      track.followsGlobalTempo = false;

      if (fineTuneCents != 0) {
        track.setPitchRatio(1.0 + (fineTuneCents / 1200));
      }

      await track.play();
    } catch (e) {
      debugPrint('Failed to start tanpura ($trackId): $e');
    }
  }

  Future<void> _stopTanpura(String trackId) async {
    await _audioEngine.removeTrack(trackId);
  }

  /// Crossfade from old drone to new drone on the same logical track.
  /// Fades old out over 500ms while fading new in.
  Future<void> _crossfadeRestart(
    String trackId,
    TanpuraStrings strings,
    double volume,
    int fineTuneCents,
  ) async {
    try {
      final oldTrack = _audioEngine.getTrack(trackId);

      // Start new drone on a temporary crossfade track
      final newAssetPath = _getAssetPath(strings, _currentKey);
      final newTrack = await _audioEngine.createTrack(
        id: _crossfadeTrackId,
        assetPath: newAssetPath,
        loop: true,
        volume: 0.0,
      );
      newTrack.followsGlobalKey = false;
      newTrack.followsGlobalTempo = false;
      if (fineTuneCents != 0) {
        newTrack.setPitchRatio(1.0 + (fineTuneCents / 1200));
      }
      await newTrack.play();

      // Crossfade over 500ms (10 steps of 50ms)
      const steps = 10;
      const stepMs = 50;
      for (int i = 1; i <= steps; i++) {
        await Future.delayed(const Duration(milliseconds: stepMs));
        final progress = i / steps;
        newTrack.setVolume(volume * progress);
        oldTrack?.setVolume(volume * (1.0 - progress));
      }

      // Remove old track and rename new track
      await _audioEngine.removeTrack(trackId);

      // Recreate the track under the correct ID
      final finalTrack = await _audioEngine.createTrack(
        id: trackId,
        assetPath: newAssetPath,
        loop: true,
        volume: volume,
      );
      finalTrack.followsGlobalKey = false;
      finalTrack.followsGlobalTempo = false;
      if (fineTuneCents != 0) {
        finalTrack.setPitchRatio(1.0 + (fineTuneCents / 1200));
      }
      await finalTrack.play();

      // Clean up crossfade track
      await _audioEngine.removeTrack(_crossfadeTrackId);
    } catch (e) {
      debugPrint('Crossfade restart failed for $trackId: $e');
      // Fallback: hard restart
      await _stopTanpura(trackId);
      await _startTanpura(trackId, strings, volume, fineTuneCents);
    }
  }

  String _getAssetPath(TanpuraStrings strings, RootKey key) {
    final keyName = _keyNames[key.index];
    switch (strings) {
      case TanpuraStrings.paSaSaSa:
        return 'assets/audio/tanpura/pa_sa_$keyName.mp3';
      case TanpuraStrings.maSaSaSa:
        return 'assets/audio/tanpura/ma_sa_$keyName.mp3';
      case TanpuraStrings.niSaSaSa:
        // Ni-Sa drones not available from Ragajunglism; fall back to Pa-Sa
        // with pitch shift applied in _startTanpura if needed.
        return 'assets/audio/tanpura/pa_sa_$keyName.mp3';
    }
  }

  // Volume controls
  void setVolume1(double volume) {
    _volume1 = volume.clamp(0.0, 1.0);
    _audioEngine.getTrack(_track1Id)?.setVolume(_volume1);
    notifyListeners();
  }

  void setVolume2(double volume) {
    _volume2 = volume.clamp(0.0, 1.0);
    _audioEngine.getTrack(_track2Id)?.setVolume(_volume2);
    notifyListeners();
  }

  // Fine tuning
  void setFineTune1(int cents) {
    _fineTune1 = cents.clamp(-50, 50);
    final track = _audioEngine.getTrack(_track1Id);
    if (track != null) {
      track.setPitchRatio(1.0 + (_fineTune1 / 1200));
    }
    notifyListeners();
  }

  void setFineTune2(int cents) {
    _fineTune2 = cents.clamp(-50, 50);
    final track = _audioEngine.getTrack(_track2Id);
    if (track != null) {
      track.setPitchRatio(1.0 + (_fineTune2 / 1200));
    }
    notifyListeners();
  }

  // String configuration
  Future<void> setStrings1(TanpuraStrings strings) async {
    if (_strings1 == strings) return;
    _strings1 = strings;
    if (_isPlaying1) {
      await _crossfadeRestart(_track1Id, _strings1, _volume1, _fineTune1);
    }
    notifyListeners();
  }

  Future<void> setStrings2(TanpuraStrings strings) async {
    if (_strings2 == strings) return;
    _strings2 = strings;
    if (_isPlaying2) {
      await _crossfadeRestart(_track2Id, _strings2, _volume2, _fineTune2);
    }
    notifyListeners();
  }

  // Enable/disable
  void setEnabled1(bool enabled) {
    _isEnabled1 = enabled;
    if (!enabled && _isPlaying1) {
      _stopTanpura(_track1Id);
      _isPlaying1 = false;
    }
    notifyListeners();
  }

  void setEnabled2(bool enabled) {
    _isEnabled2 = enabled;
    if (!enabled && _isPlaying2) {
      _stopTanpura(_track2Id);
      _isPlaying2 = false;
    }
    notifyListeners();
  }
}


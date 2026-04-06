import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_soloud/flutter_soloud.dart';

import '../../../core/audio/audio_engine.dart';
import '../../../core/constants/music_constants.dart';

/// Sample-based Tabla Engine (TablaKit)
///
/// Plays pre-recorded one-shot WAV samples from assets/audio/tabla/oneshots/.
/// Features:
///   - Round-robin v1/v2 per bol for natural variation
///   - Accent gain hierarchy: sam (1.3×) > tali (1.1×) > normal (1.0×) > khali (0.85×)
///   - Drift-corrected Stopwatch + Timer scheduling
class TablaProvider extends ChangeNotifier {
  AudioEngine _audioEngine;

  bool _isPlaying = false;
  bool _isPaused = false;
  bool _isEnabled = true;

  Taal _currentTaal = Taals.teentaal;
  int _tempo = PracticeDefaults.tempo;
  double _volume = PracticeDefaults.tablaVolume;

  int _currentMatra = 0;
  int _currentVibhag = 0;

  // One-shot sample buffers: "dha_v1" -> AudioSource
  final Map<String, AudioSource> _sampleSources = {};
  bool _samplesLoaded = false;

  // Round-robin tracker per bol
  final Map<String, int> _roundRobin = {};

  // Drift-corrected sequencer
  Timer? _sequencerTimer;
  Stopwatch? _sequencerStopwatch;

  final List<Function(int matra, int vibhag, bool isSam)> _beatCallbacks = [];

  static const _bols = ['dha', 'dhin', 'tin', 'na', 'ta', 'ge', 'ke'];
  static const _variants = ['v1', 'v2'];

  TablaProvider(this._audioEngine);

  void updateEngine(AudioEngine engine) {
    _audioEngine = engine;
  }

  // -- Getters --
  bool get isPlaying => _isPlaying;
  bool get isPaused => _isPaused;
  bool get isEnabled => _isEnabled;
  Taal get currentTaal => _currentTaal;
  int get tempo => _tempo;
  double get volume => _volume;
  int get currentMatra => _currentMatra;
  int get currentVibhag => _currentVibhag;
  bool get isSam => _currentMatra == 0;
  bool get isTali => _currentTaal.talis.contains(_currentMatra + 1);
  bool get isKhali => _currentTaal.khalis.contains(_currentMatra + 1);
  String get layaName => TempoConstants.getLayaName(_tempo);

  // -- Sample Loading --

  Future<void> _loadSamples() async {
    if (_samplesLoaded) return;

    final soLoud = SoLoud.instance;
    for (final bol in _bols) {
      _roundRobin[bol] = 0;
      for (final v in _variants) {
        final key = '${bol}_$v';
        final path = 'assets/audio/tabla/oneshots/$bol/$v.wav';
        try {
          final source = await soLoud.loadAsset(path);
          _sampleSources[key] = source;
        } catch (e) {
          debugPrint('TablaKit: failed to load $key: $e');
        }
      }
    }
    _samplesLoaded = true;
    debugPrint('🥁 TablaKit: ${_sampleSources.length} samples loaded');
  }

  // -- Bol Resolution --

  static const _bolMap = <String, List<String>>{
    'dha':  ['धा', 'dha'],
    'dhin': ['धिं', 'धी', 'dhin', 'dhi'],
    'tin':  ['तिं', 'tin'],
    'na':   ['ना', 'na', 'ne'],
    'ta':   ['ता', 'ta', 'te'],
    'ge':   ['गे', 'घे', 'ge', 'ghe'],
    'ke':   ['के', 'ke'],
  };

  String _resolveBol(String bol) {
    final lower = bol.toLowerCase();
    for (final entry in _bolMap.entries) {
      for (final pattern in entry.value) {
        if (bol.contains(pattern) || lower.contains(pattern.toLowerCase())) {
          return entry.key;
        }
      }
    }
    return 'na'; // fallback
  }

  // -- Playback Controls --

  Future<void> toggle() async {
    if (!_isEnabled) return;
    if (_isPlaying) {
      await stop();
    } else {
      await play();
    }
  }

  Future<void> play() async {
    if (!_isEnabled || _isPlaying) return;

    try {
      await _audioEngine.initialize();
      await _loadSamples();

      _isPlaying = true;
      _isPaused = false;
      _currentMatra = 0;
      _currentVibhag = 0;

      _sequencerStopwatch = Stopwatch()..start();
      _scheduleNextBeat();

      notifyListeners();
    } catch (e) {
      debugPrint('TablaKit: failed to start: $e');
    }
  }

  Future<void> stop() async {
    _isPlaying = false;
    _isPaused = false;
    _sequencerTimer?.cancel();
    _sequencerTimer = null;
    _sequencerStopwatch?.stop();
    _sequencerStopwatch = null;
    _currentMatra = 0;
    _currentVibhag = 0;
    notifyListeners();
  }

  void pause() {
    if (_isPlaying && !_isPaused) {
      _isPaused = true;
      _sequencerTimer?.cancel();
      _sequencerStopwatch?.stop();
      notifyListeners();
    }
  }

  void resume() {
    if (_isPaused) {
      _isPaused = false;
      _sequencerStopwatch?.start();
      _scheduleNextBeat();
      notifyListeners();
    }
  }

  // -- Sequencer (drift-corrected) --

  void _scheduleNextBeat() {
    if (!_isPlaying || _isPaused) return;

    final beatDurationMs = 60000.0 / _tempo;
    final expectedMs = _currentMatra * beatDurationMs;
    final elapsed = _sequencerStopwatch?.elapsedMilliseconds ?? 0;
    final delayMs = (expectedMs - elapsed).round().clamp(0, 60000);

    _sequencerTimer = Timer(Duration(milliseconds: delayMs), () {
      if (!_isPlaying || _isPaused) return;

      _playCurrentBeat();

      _currentMatra = (_currentMatra + 1) % _currentTaal.matras;

      // Update vibhag
      int matraCount = 0;
      for (int i = 0; i < _currentTaal.vibhags.length; i++) {
        matraCount += _currentTaal.vibhags[i];
        if (_currentMatra < matraCount) {
          _currentVibhag = i;
          break;
        }
      }

      notifyListeners();

      if (_currentMatra == 0) {
        _sequencerStopwatch = Stopwatch()..start();
      }
      _scheduleNextBeat();
    });
  }

  void _playCurrentBeat() {
    final bolStr = _currentTaal.bols[_currentMatra];
    final bolName = _resolveBol(bolStr);

    final isSamBeat = _currentMatra == 0;
    final isTaliBeat = _currentTaal.talis.contains(_currentMatra + 1);
    final isKhaliBeat = _currentTaal.khalis.contains(_currentMatra + 1);

    double accentGain = 1.0;
    if (isSamBeat) {
      accentGain = 1.3;
    } else if (isTaliBeat) {
      accentGain = 1.1;
    } else if (isKhaliBeat) {
      accentGain = 0.85;
    }

    _playSample(bolName, accentGain);

    for (final callback in _beatCallbacks) {
      callback(_currentMatra, _currentVibhag, isSamBeat);
    }
  }

  void _playSample(String bolName, double accentGain) {
    final variantIndex = _roundRobin[bolName] ?? 0;
    _roundRobin[bolName] = 1 - variantIndex;
    final key = '${bolName}_v${variantIndex + 1}';

    final source = _sampleSources[key];
    if (source == null) return;

    try {
      final soLoud = SoLoud.instance;
      final effectiveVolume = (_volume * accentGain).clamp(0.0, 1.0);
      soLoud.play(source, volume: effectiveVolume);
    } catch (e) {
      debugPrint('TablaKit: play error for $key: $e');
    }
  }

  // -- Taal Selection --

  Future<void> setTaal(Taal taal) async {
    if (_currentTaal == taal) return;

    _currentTaal = taal;
    _currentMatra = 0;
    _currentVibhag = 0;

    if (_isPlaying) {
      await stop();
      await play();
    }

    notifyListeners();
  }

  // -- Tempo Control --

  void setTempo(int bpm) {
    final newTempo = bpm.clamp(TempoConstants.minBPM, TempoConstants.maxBPM);
    if (_tempo == newTempo) return;
    _tempo = newTempo;

    if (_isPlaying && !_isPaused) {
      _sequencerTimer?.cancel();
      _sequencerStopwatch = Stopwatch()..start();
      _currentMatra = 0;
      _currentVibhag = 0;
      _scheduleNextBeat();
    }

    notifyListeners();
  }

  void increaseTempo([int delta = 5]) => setTempo(_tempo + delta);
  void decreaseTempo([int delta = 5]) => setTempo(_tempo - delta);
  void doubleTempo() => setTempo(_tempo * 2);
  void halveTempo() => setTempo(_tempo ~/ 2);

  // -- Volume Control --

  void setVolume(double vol) {
    _volume = vol.clamp(0.0, 1.0);
    notifyListeners();
  }

  // -- Beat Tracking --

  void onBeat(Function(int matra, int vibhag, bool isSam) callback) {
    _beatCallbacks.add(callback);
  }

  void removeOnBeat(Function(int matra, int vibhag, bool isSam) callback) {
    _beatCallbacks.remove(callback);
  }

  // -- Enable/Disable --

  void setEnabled(bool enabled) {
    _isEnabled = enabled;
    if (!enabled && _isPlaying) {
      stop();
    }
    notifyListeners();
  }

  // -- Utilities --

  String getBol(int matra) {
    if (matra < 0 || matra >= _currentTaal.matras) return '';
    return _currentTaal.bols[matra];
  }

  String getMatraDisplay(int matra) {
    final displayNum = matra + 1;
    if (_currentTaal.talis.contains(displayNum)) {
      return '$displayNum';
    } else if (_currentTaal.khalis.contains(displayNum)) {
      return '०';
    }
    return '$displayNum';
  }

  bool isTaalLocked(Taal taal) => taal.isPro;
}

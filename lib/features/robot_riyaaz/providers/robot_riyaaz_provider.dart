import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_soloud/flutter_soloud.dart';

import '../models/exercise.dart';
import '../models/grading.dart';
import '../../../core/audio/swar_player.dart';
import '../../../core/constants/music_constants.dart';
import '../../tanpura/providers/tanpura_provider.dart';
import '../../tabla/providers/tabla_provider.dart';

class RobotRiyaazProvider extends ChangeNotifier {
  final SwarPlayer _swarPlayer;
  final TanpuraProvider _tanpuraProvider;
  final TablaProvider _tablaProvider;

  ExerciseLibrary? _library;
  bool _isLoading = false;
  String? _error;

  Exercise? _selectedExercise;
  String _selectedCategory = '';
  List<SwarEvent> _currentEvents = [];

  RobotSessionState _sessionState = RobotSessionState.idle;
  PracticeMode _currentMode = PracticeMode.singAlong;
  int _currentEventIndex = 0;
  int _currentBeatIndex = -1;
  int _tempo = PracticeDefaults.tempo;
  int _subdivision = 1;
  SwarEvent? _currentSwar;
  bool _tanpuraEnabled = true;
  bool _tablaEnabled = true;
  Saptak _saptak = PracticeDefaults.saptak;
  Timer? _beatCursorTimer;

  final List<GradeResult> _results = [];
  SessionReport? _report;

  SoundHandle? _activeNoteHandle;

  bool _accompanimentRunning = false;

  RobotRiyaazProvider(
    this._swarPlayer,
    this._tanpuraProvider,
    this._tablaProvider,
  );

  ExerciseLibrary? get library => _library;
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<String> get categories => _library?.categories ?? [];
  String get selectedCategory => _selectedCategory;
  Exercise? get selectedExercise => _selectedExercise;
  List<SwarEvent> get currentEvents => _currentEvents;
  RobotSessionState get sessionState => _sessionState;
  PracticeMode get currentMode => _currentMode;
  int get currentEventIndex => _currentEventIndex;
  int get currentBeatIndex => _currentBeatIndex;
  int get tempo => _tempo;
  int get subdivision => _subdivision;
  SwarEvent? get currentSwar => _currentSwar;
  SessionReport? get report => _report;
  bool get tanpuraEnabled => _tanpuraEnabled;
  bool get tablaEnabled => _tablaEnabled;
  Saptak get saptak => _saptak;
  AccompanimentDefaults get accompanimentDefaults =>
      _library?.accompanimentDefaults ?? const AccompanimentDefaults();

  Future<void> loadExercises() async {
    if (_isLoading || _library != null) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final jsonString = await rootBundle
          .loadString('assets/exercises/hindustani_class1.json');
      final jsonData = json.decode(jsonString) as Map<String, dynamic>;
      _library = ExerciseLibrary.fromJson(jsonData);
      if (_selectedCategory.isEmpty && _library!.categories.isNotEmpty) {
        _selectedCategory = _library!.categories.first;
      }
      _isLoading = false;
      notifyListeners();
      debugPrint('Loaded ${_library!.exercises.length} exercises');
    } catch (e) {
      _error = 'Failed to load exercises: $e';
      _isLoading = false;
      notifyListeners();
      debugPrint('Exercise load error: $_error');
    }
  }

  List<Exercise> getExercisesByCategory(String category) {
    return _library?.exercises
            .where((ex) => ex.category == category)
            .toList() ??
        [];
  }

  ExerciseTaal? getTaal(String? taalId) {
    if (taalId == null) return null;
    return _library?.taals[taalId];
  }

  SwarInfo? getSwarInfo(String swarName) {
    return _library?.swaras[swarName];
  }

  void selectExercise(String exerciseId) {
    _selectedExercise =
        _library?.exercises.firstWhere((ex) => ex.id == exerciseId);
    if (_selectedExercise != null) {
      _selectedCategory = _selectedExercise!.category;
      _currentEvents = _selectedExercise!.flatten();
      _tempo = _selectedExercise!.tempoBpm;
      _subdivision = _selectedExercise!.swarsPerBeat;
      _currentEventIndex = 0;
      _currentBeatIndex = -1;
      _results.clear();
      _report = null;
    }
    notifyListeners();
  }

  void setSelectedCategory(String category) {
    if (_selectedCategory == category) return;
    _selectedCategory = category;
    notifyListeners();
  }

  void setTempo(int bpm) {
    _tempo = bpm.clamp(PracticeDefaults.minTempo, PracticeDefaults.maxTempo);
    notifyListeners();
  }

  void setSubdivision(int n) {
    _subdivision = n.clamp(1, 4);
    notifyListeners();
  }

  Future<void> _startAccompaniment() async {
    if (_tanpuraEnabled && !_tanpuraProvider.isPlaying) {
      await _tanpuraProvider.play1();
    }

    if (_tablaEnabled && !_tablaProvider.isPlaying) {
      _tablaProvider.setTempo(_tempo);
      await _tablaProvider.play();
    }

    _accompanimentRunning = true;
  }

  Future<void> _stopAccompaniment() async {
    if (!_accompanimentRunning) return;
    _accompanimentRunning = false;

    if (_tanpuraProvider.isPlaying) {
      await _tanpuraProvider.stop1();
    }
    if (_tablaProvider.isPlaying) {
      await _tablaProvider.stop();
    }
  }

  void setMode(PracticeMode mode) {
    _currentMode = mode;
    notifyListeners();
  }

  Future<void> setSaptak(Saptak saptak) async {
    if (_saptak == saptak) return;
    _saptak = saptak;

    final wasPlaying = _sessionState != RobotSessionState.idle &&
        _sessionState != RobotSessionState.complete;

    if (wasPlaying) {
      // Stop current playback cleanly, re-render notes, restart
      final mode = _currentMode;
      stopSession();
      await _swarPlayer.setSaptak(saptak.semitoneShift);
      if (_selectedExercise != null) {
        await startSession(mode);
      }
    } else {
      await _swarPlayer.setSaptak(saptak.semitoneShift);
      notifyListeners();
    }
  }

  void toggleTanpura() {
    _tanpuraEnabled = !_tanpuraEnabled;
    if (_accompanimentRunning) {
      if (_tanpuraEnabled && !_tanpuraProvider.isPlaying) {
        _tanpuraProvider.play1();
      } else if (!_tanpuraEnabled && _tanpuraProvider.isPlaying) {
        _tanpuraProvider.stop1();
      }
    }
    notifyListeners();
  }

  void toggleTabla() {
    _tablaEnabled = !_tablaEnabled;
    if (_accompanimentRunning) {
      if (_tablaEnabled && !_tablaProvider.isPlaying) {
        _tablaProvider.setTempo(_tempo);
        _tablaProvider.play();
      } else if (!_tablaEnabled && _tablaProvider.isPlaying) {
        _tablaProvider.stop();
      }
    }
    notifyListeners();
  }

  Future<void> startSession(PracticeMode mode) async {
    if (_selectedExercise == null || _currentEvents.isEmpty) return;

    _currentMode = mode;
    await _stopAccompaniment();
    _beatCursorTimer?.cancel();

    // Ensure swar player has the current saptak shift
    await _swarPlayer.setSaptak(_saptak.semitoneShift);

    _setSessionState(RobotSessionState.counting);
    _currentEventIndex = 0;
    _currentBeatIndex = -1;
    _results.clear();
    _report = null;

    await _startAccompaniment();

    final countIn = _selectedExercise!.playbackPlan?.countInBeats ?? 4;
    final beatDuration = Duration(milliseconds: (60000 / _tempo).round());
    await Future.delayed(beatDuration * countIn);

    if (_sessionState != RobotSessionState.counting) return;

    switch (mode) {
      case PracticeMode.singAlong:
        await _runSingAlong();
        break;
      case PracticeMode.guidedPractice:
        await _runGuidedPractice();
        break;
      case PracticeMode.selfPractice:
        _runSelfPractice();
        break;
    }
  }

  Future<void> _runSingAlong() async {
    _setSessionState(RobotSessionState.singAlong);

    while (_sessionState == RobotSessionState.singAlong) {
      _currentEventIndex = 0;
      notifyListeners();
      await _playSwarSequence();
    }
  }

  Future<void> _runGuidedPractice() async {
    // Demo phase: robot plays one pass
    _setSessionState(RobotSessionState.demoPhase);
    _currentEventIndex = 0;
    notifyListeners();
    await _playSwarSequence();

    if (_sessionState != RobotSessionState.demoPhase) return;

    // Brief transition
    final beatDuration = Duration(milliseconds: (60000 / _tempo).round());
    await Future.delayed(beatDuration);

    if (_sessionState == RobotSessionState.idle) return;

    _setSessionState(RobotSessionState.practice);
    _currentEventIndex = 0;
    notifyListeners();
    await _playSwarSequence();

    if (_sessionState != RobotSessionState.practice) return;

    _setSessionState(RobotSessionState.grading);
    await Future.delayed(const Duration(milliseconds: 500));

    _report = SessionReport.generate(_results, _currentEvents.length);
    await _stopAccompaniment();

    _setSessionState(RobotSessionState.complete);
  }

  void _runSelfPractice() {
    _setSessionState(RobotSessionState.singAlong);
    _startBeatCursor();
  }

  Stopwatch? _beatCursorStopwatch;

  void _startBeatCursor() {
    _beatCursorTimer?.cancel();
    _currentBeatIndex = 0;
    notifyListeners();

    final totalBeats = (_currentEvents.length / _subdivision).ceil();
    final beatDurationMs = 60000.0 / _tempo;
    _beatCursorStopwatch = Stopwatch()..start();
    int nextBeatIndex = 1;

    void scheduleNext() {
      final expectedMs = nextBeatIndex * beatDurationMs;
      final elapsed = _beatCursorStopwatch?.elapsedMilliseconds ?? 0;
      final delayMs = (expectedMs - elapsed).round().clamp(0, 60000);

      _beatCursorTimer = Timer(Duration(milliseconds: delayMs), () {
        if (_sessionState == RobotSessionState.idle) {
          _beatCursorStopwatch?.stop();
          return;
        }
        _currentBeatIndex = nextBeatIndex % totalBeats;
        nextBeatIndex++;
        notifyListeners();
        scheduleNext();
      });
    }

    scheduleNext();
  }

  void stopSession() {
    final wasMode = _currentMode;
    final hadResults = _results.isNotEmpty;

    _beatCursorTimer?.cancel();
    _beatCursorTimer = null;
    _beatCursorStopwatch?.stop();
    _beatCursorStopwatch = null;
    if (_activeNoteHandle != null) {
      try {
        SoLoud.instance.stop(_activeNoteHandle!);
      } catch (_) {}
      _activeNoteHandle = null;
    }
    _stopAccompaniment();

    if (wasMode == PracticeMode.singAlong && hadResults) {
      _report = SessionReport.generate(_results, _currentEvents.length);
      _setSessionState(RobotSessionState.complete);
    } else {
      _setSessionState(RobotSessionState.idle);
    }
  }

  Future<void> _playSwarSequence() async {
    final swarDurationMs = 60000.0 / _tempo / _subdivision;
    final swarDurationSec = swarDurationMs / 1000.0;
    const minGapSec = 0.03;
    final noteDuration =
        (swarDurationSec * 0.9).clamp(0.0, swarDurationSec - minGapSec);
    final stopwatch = Stopwatch()..start();

    for (var i = 0; i < _currentEvents.length; i++) {
      if (_sessionState != RobotSessionState.singAlong &&
          _sessionState != RobotSessionState.demoPhase &&
          _sessionState != RobotSessionState.practice) {
        break;
      }

      final event = _currentEvents[i];
      _currentEventIndex = i;
      _currentSwar = event;
      _currentBeatIndex = i ~/ _subdivision;
      notifyListeners();

      if (_activeNoteHandle != null) {
        _swarPlayer.stopNote(_activeNoteHandle!);
        _activeNoteHandle = null;
      }

      if (event.swar != '-') {
        _activeNoteHandle = await _swarPlayer.playNote(
          event.swar,
          durationSec: noteDuration,
        );
      }

      final nextEventMs = (i + 1) * swarDurationMs;
      final elapsed = stopwatch.elapsedMilliseconds;
      final delayMs = (nextEventMs - elapsed).round().clamp(0, 60000);
      await Future.delayed(Duration(milliseconds: delayMs));
    }

    if (_activeNoteHandle != null) {
      _swarPlayer.stopNote(_activeNoteHandle!);
    }
    _currentSwar = null;
    _activeNoteHandle = null;
    notifyListeners();
  }

  void _setSessionState(RobotSessionState state) {
    _sessionState = state;
    notifyListeners();
  }

  @override
  void dispose() {
    _beatCursorTimer?.cancel();
    super.dispose();
  }
}

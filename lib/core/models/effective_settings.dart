import 'package:equatable/equatable.dart';
import '../../features/robot_riyaaz/models/exercise.dart';
import '../../features/robot_riyaaz/models/grading.dart';
import '../constants/music_constants.dart';

class EffectiveExerciseSettings extends Equatable {
  final PracticeMode mode;
  final int bpm;
  final String taalId;
  final int notesPerBeat;
  final bool tanpuraEnabled;
  final bool tablaEnabled;
  final Saptak saptak;

  const EffectiveExerciseSettings({
    required this.mode,
    required this.bpm,
    required this.taalId,
    required this.notesPerBeat,
    required this.tanpuraEnabled,
    required this.tablaEnabled,
    this.saptak = PracticeDefaults.saptak,
  });

  @override
  List<Object?> get props => [mode, bpm, taalId, notesPerBeat, tanpuraEnabled, tablaEnabled, saptak];
}

Saptak _parseSaptak(String saptakStr) {
  switch (saptakStr.toUpperCase()) {
    case 'MANDRA':
      return Saptak.mandra;
    case 'TAAR':
      return Saptak.taar;
    default:
      return Saptak.madhya;
  }
}

PracticeMode _parseMode(String modeStr) {
  switch (modeStr) {
    case 'GUIDED_PRACTICE':
      return PracticeMode.guidedPractice;
    case 'SELF_PRACTICE':
      return PracticeMode.selfPractice;
    default:
      return PracticeMode.singAlong;
  }
}

/// Resolve effective settings from exercise defaults and global settings.
/// Resolution chain: exercise defaults -> global settings -> per-exercise override.
EffectiveExerciseSettings resolveSettings({
  required ExerciseDefaults exerciseDefaults,
  AccompanimentDefaults? accompanimentDefaults,
  int? globalDefaultBpm,
  Saptak? globalSaptak,
}) {
  final acc = accompanimentDefaults ?? const AccompanimentDefaults();
  final bpm = exerciseDefaults.recommendedBpm > 0
      ? exerciseDefaults.recommendedBpm
      : (globalDefaultBpm ?? PracticeDefaults.tempo);

  final effectiveSaptak = globalSaptak ?? _parseSaptak(exerciseDefaults.recommendedSaptak);

  return EffectiveExerciseSettings(
    mode: _parseMode(exerciseDefaults.defaultMode),
    bpm: bpm,
    taalId: exerciseDefaults.recommendedTaalId,
    notesPerBeat: exerciseDefaults.recommendedNotesPerBeat,
    tanpuraEnabled: acc.tanpuraEnabled,
    tablaEnabled: acc.tablaEnabled,
    saptak: effectiveSaptak,
  );
}

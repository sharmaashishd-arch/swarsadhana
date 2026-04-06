import 'package:equatable/equatable.dart';

/// Individual grade result for a single swar event
class GradeResult extends Equatable {
  final int eventIndex;
  final String expectedSwar;
  final String detectedSwar;
  final bool isCorrectSwar;
  final int centsError;
  final bool isInTune;
  final int timingErrorMs;
  final bool isOnTime;
  final double timestamp;

  const GradeResult({
    required this.eventIndex,
    required this.expectedSwar,
    required this.detectedSwar,
    required this.isCorrectSwar,
    required this.centsError,
    required this.isInTune,
    required this.timingErrorMs,
    required this.isOnTime,
    required this.timestamp,
  });

  @override
  List<Object?> get props => [
        eventIndex,
        expectedSwar,
        detectedSwar,
        isCorrectSwar,
        centsError,
        isInTune,
        timingErrorMs,
        isOnTime,
      ];
}

/// Scores breakdown for a session
class SessionScores extends Equatable {
  final int pitch;
  final int tuning;
  final int rhythm;
  final int completion;
  final int overall;

  const SessionScores({
    required this.pitch,
    required this.tuning,
    required this.rhythm,
    required this.completion,
    required this.overall,
  });

  factory SessionScores.calculate(List<GradeResult> results, int totalEvents) {
    if (results.isEmpty) {
      return const SessionScores(
        pitch: 0,
        tuning: 0,
        rhythm: 0,
        completion: 0,
        overall: 0,
      );
    }

    final graded = results.length;
    final correctSwars = results.where((r) => r.isCorrectSwar).length;
    final inTune = results.where((r) => r.isInTune).length;
    final onTime = results.where((r) => r.isOnTime).length;

    final pitchScore = (correctSwars / graded * 100).round();
    final tuningScore = (inTune / graded * 100).round();
    final rhythmScore = (onTime / graded * 100).round();
    final completionScore = (graded / totalEvents * 100).round();

    // Weighted overall (40% pitch, 20% tuning, 30% rhythm, 10% completion)
    final overallScore = (pitchScore * 0.4 +
            tuningScore * 0.2 +
            rhythmScore * 0.3 +
            completionScore * 0.1)
        .round();

    return SessionScores(
      pitch: pitchScore,
      tuning: tuningScore,
      rhythm: rhythmScore,
      completion: completionScore,
      overall: overallScore,
    );
  }

  String get overallGrade {
    if (overall >= 90) return 'excellent';
    if (overall >= 70) return 'good';
    if (overall >= 50) return 'fair';
    return 'needs-work';
  }

  @override
  List<Object?> get props => [pitch, tuning, rhythm, completion, overall];
}

/// Complete session report
class SessionReport extends Equatable {
  final int totalEvents;
  final int gradedEvents;
  final SessionScores scores;
  final List<GradeResult> results;
  final List<GradeResult> mistakes;
  final String recommendation;

  const SessionReport({
    required this.totalEvents,
    required this.gradedEvents,
    required this.scores,
    required this.results,
    required this.mistakes,
    required this.recommendation,
  });

  factory SessionReport.generate(
      List<GradeResult> results, int totalEvents) {
    final scores = SessionScores.calculate(results, totalEvents);
    final mistakes = results
        .where((r) => !r.isCorrectSwar || !r.isInTune || !r.isOnTime)
        .toList();

    String recommendation;
    if (scores.overall >= 90) {
      recommendation = 'Excellent! Try increasing the tempo.';
    } else if (scores.overall >= 70) {
      recommendation = 'Good progress! Focus on the marked mistakes.';
    } else if (scores.pitch < 60) {
      recommendation =
          'Practice with Robot Demo first. Focus on pitch accuracy.';
    } else if (scores.rhythm < 60) {
      recommendation = 'Try a slower tempo to improve timing.';
    } else {
      recommendation = 'Keep practicing! Repeat this exercise.';
    }

    return SessionReport(
      totalEvents: totalEvents,
      gradedEvents: results.length,
      scores: scores,
      results: results,
      mistakes: mistakes,
      recommendation: recommendation,
    );
  }

  @override
  List<Object?> get props => [totalEvents, gradedEvents, scores, recommendation];
}

/// Detected pitch information
class PitchInfo extends Equatable {
  final double frequency;
  final String swar;
  final int centsError;
  final int octaveShift;
  final double expectedFreq;
  final double timestamp;

  const PitchInfo({
    required this.frequency,
    required this.swar,
    required this.centsError,
    required this.octaveShift,
    required this.expectedFreq,
    required this.timestamp,
  });

  @override
  List<Object?> get props => [frequency, swar, centsError, octaveShift];
}

/// Practice mode selection
enum PracticeMode {
  singAlong,
  guidedPractice,
  selfPractice,
}

/// Session state
enum RobotSessionState {
  idle,
  counting,
  singAlong,
  demoPhase,
  practice,
  grading,
  complete,
}

import 'package:equatable/equatable.dart';
import '../../../core/constants/music_constants.dart';

/// Represents a single exercise in the Sadhana system
class Exercise extends Equatable {
  final String id;
  final String title;
  final String category;
  final String? description;
  final String ragaMode;
  final String? taalId;
  final int tempoBpm;
  final int swarsPerBeat;
  final PlaybackPlan? playbackPlan;
  final List<String>? aaroh;
  final List<String>? avroh;
  final List<List<String>>? aarohPhrases;
  final List<List<String>>? avrohPhrases;
  final List<List<String>>? aarohGroups;
  final List<List<String>>? avrohGroups;
  final List<LessonSection> lessonSections;
  final RagaInfo? raga;
  final DisplayInfo? display;
  final ExerciseDefaults defaults;

  const Exercise({
    required this.id,
    required this.title,
    required this.category,
    this.description,
    this.ragaMode = 'neutral',
    this.taalId,
    this.tempoBpm = PracticeDefaults.tempo,
    this.swarsPerBeat = 1,
    this.playbackPlan,
    this.aaroh,
    this.avroh,
    this.aarohPhrases,
    this.avrohPhrases,
    this.aarohGroups,
    this.avrohGroups,
    this.lessonSections = const [],
    this.raga,
    this.display,
    this.defaults = const ExerciseDefaults(),
  });

  factory Exercise.fromJson(Map<String, dynamic> json) {
    return Exercise(
      id: json['id'] as String,
      title: json['title'] as String,
      category: json['category'] as String,
      description: json['description'] as String?,
      ragaMode: json['raga_mode'] as String? ?? 'neutral',
      taalId: json['taal_id'] as String?,
      tempoBpm: json['tempo_bpm'] as int? ?? PracticeDefaults.tempo,
      swarsPerBeat: json['swars_per_beat'] as int? ?? 1,
      playbackPlan: json['playback_plan'] != null
          ? PlaybackPlan.fromJson(json['playback_plan'])
          : null,
      aaroh: (json['aaroh'] as List<dynamic>?)?.cast<String>(),
      avroh: (json['avroh'] as List<dynamic>?)?.cast<String>(),
      aarohPhrases: (json['aaroh_phrases'] as List<dynamic>?)
          ?.map((p) => (p as List<dynamic>).cast<String>())
          .toList(),
      avrohPhrases: (json['avroh_phrases'] as List<dynamic>?)
          ?.map((p) => (p as List<dynamic>).cast<String>())
          .toList(),
      aarohGroups: (json['aaroh_groups'] as List<dynamic>?)
          ?.map((g) => (g as List<dynamic>).cast<String>())
          .toList(),
      avrohGroups: (json['avroh_groups'] as List<dynamic>?)
          ?.map((g) => (g as List<dynamic>).cast<String>())
          .toList(),
      lessonSections: (json['lesson_sections'] as List<dynamic>?)
              ?.map((s) => LessonSection.fromJson(s as Map<String, dynamic>))
              .toList() ??
          const [],
      raga: json['raga'] != null
          ? RagaInfo.fromJson(json['raga'] as Map<String, dynamic>)
          : null,
      display: json['display'] != null
          ? DisplayInfo.fromJson(json['display'])
          : null,
      defaults: json['defaults'] != null
          ? ExerciseDefaults.fromJson(json['defaults'])
          : ExerciseDefaults.generateFrom(
              tempoBpm: json['tempo_bpm'] as int?,
              taalId: json['taal_id'] as String?,
              swarsPerBeat: json['swars_per_beat'] as int?,
            ),
    );
  }

  /// Flatten exercise into a list of swar events for playback
  List<SwarEvent> flatten({String? scopeId}) {
    final events = <SwarEvent>[];
    var beatIndex = 0;

    final shouldIncludeWholeExercise = scopeId == null || scopeId == 'full';

    void processSwars(List<String>? swars, String direction) {
      if (swars == null) return;
      for (var i = 0; i < swars.length; i++) {
        final swar = swars[i];
        if (swar.isNotEmpty && swar != '-') {
          events.add(
            SwarEvent(
              swar: swar,
              beatIndex: beatIndex,
              direction: direction,
              index: i,
            ),
          );
        }
        beatIndex++;
      }
    }

    void processPhrases(List<List<String>>? phrases, String direction) {
      if (phrases == null) return;
      for (var groupIndex = 0; groupIndex < phrases.length; groupIndex++) {
        final phrase = phrases[groupIndex];
        for (var i = 0; i < phrase.length; i++) {
          final swar = phrase[i];
          if (swar.isNotEmpty && swar != '-') {
            events.add(
              SwarEvent(
                swar: swar,
                beatIndex: beatIndex,
                direction: direction,
                groupIndex: groupIndex,
                index: i,
              ),
            );
          }
          beatIndex++;
        }
      }
    }

    if (shouldIncludeWholeExercise || scopeId == 'aaroh') {
      processSwars(aaroh, 'aaroh');
      processPhrases(aarohPhrases, 'aaroh');
      processPhrases(aarohGroups, 'aaroh');
    }

    if (shouldIncludeWholeExercise || scopeId == 'avroh') {
      processSwars(avroh, 'avroh');
      processPhrases(avrohPhrases, 'avroh');
      processPhrases(avrohGroups, 'avroh');
    }

    void processLessonPhrases(
      List<List<String>> phrases,
      String direction, {
      int groupOffset = 0,
    }) {
      for (var groupIndex = 0; groupIndex < phrases.length; groupIndex++) {
        final phrase = phrases[groupIndex];
        for (var i = 0; i < phrase.length; i++) {
          final swar = phrase[i];
          if (swar.isNotEmpty && swar != '-') {
            events.add(
              SwarEvent(
                swar: swar,
                beatIndex: beatIndex,
                direction: direction,
                groupIndex: groupOffset + groupIndex,
                index: i,
              ),
            );
          }
          beatIndex++;
        }
      }
    }

    for (final section in lessonSections) {
      final includeSection =
          shouldIncludeWholeExercise || scopeId == section.id;
      final matchingParts = section.parts
          .where((part) => scopeId == '${section.id}:${part.id}')
          .toList();
      if (!includeSection && matchingParts.isEmpty) continue;

      final startBeat = section.startBeat;
      final sectionTaalId = taalId ?? defaults.recommendedTaalId;
      final taalBeats = sectionTaalId == 'TEENTAAL_16'
          ? 16
          : sectionTaalId == 'KEHARWA_8'
              ? 8
              : sectionTaalId == 'DADRA_6'
                  ? 6
                  : null;
      if (startBeat != null && taalBeats != null) {
        final targetIndex = (startBeat - 1).clamp(0, taalBeats - 1);
        final currentIndex = beatIndex % taalBeats;
        final padding = (targetIndex - currentIndex + taalBeats) % taalBeats;
        beatIndex += padding;
      }

      if (includeSection) {
        processLessonPhrases(section.phrases, section.id);
      }
      var groupOffset = includeSection ? section.phrases.length : 0;
      final partsToProcess = includeSection ? section.parts : matchingParts;
      for (final part in partsToProcess) {
        processLessonPhrases(
          part.phrases,
          '${section.id}:${part.id}',
          groupOffset: groupOffset,
        );
        groupOffset += part.phrases.length;
      }
    }

    return events;
  }

  List<PracticeScope> practiceScopes() {
    final scopes = <PracticeScope>[
      const PracticeScope(id: 'full', label: 'Full raga'),
    ];

    if (aaroh != null || aarohPhrases != null || aarohGroups != null) {
      scopes.add(const PracticeScope(id: 'aaroh', label: 'Aaroh'));
    }
    if (avroh != null || avrohPhrases != null || avrohGroups != null) {
      scopes.add(const PracticeScope(id: 'avroh', label: 'Avroh'));
    }

    for (final section in lessonSections) {
      scopes.add(
        PracticeScope(
          id: section.id,
          label: section.label,
          labelHindi: section.labelHindi,
          startBeat: section.startBeat,
        ),
      );
      for (final part in section.parts) {
        scopes.add(
          PracticeScope(
            id: '${section.id}:${part.id}',
            label: '${section.label} - ${part.label}',
            labelHindi: '${section.labelHindi ?? section.label} - '
                '${part.labelHindi ?? part.label}',
            startBeat: section.startBeat,
          ),
        );
      }
    }

    return scopes;
  }

  @override
  List<Object?> get props => [id, title, category, lessonSections, raga];
}

class PracticeScope extends Equatable {
  final String id;
  final String label;
  final String? labelHindi;
  final int? startBeat;

  const PracticeScope({
    required this.id,
    required this.label,
    this.labelHindi,
    this.startBeat,
  });

  @override
  List<Object?> get props => [id, label, labelHindi, startBeat];
}

class LessonSection extends Equatable {
  final String id;
  final String label;
  final String? labelHindi;
  final List<List<String>> phrases;
  final List<LessonPart> parts;
  final int? startBeat;

  const LessonSection({
    required this.id,
    required this.label,
    this.labelHindi,
    required this.phrases,
    this.parts = const [],
    this.startBeat,
  });

  factory LessonSection.fromJson(Map<String, dynamic> json) {
    return LessonSection(
      id: json['id'] as String? ?? 'section',
      label: json['label'] as String? ?? 'Section',
      labelHindi: json['label_hindi'] as String?,
      phrases: (json['phrases'] as List<dynamic>?)
              ?.map((p) => (p as List<dynamic>).cast<String>())
              .toList() ??
          const [],
      parts: (json['parts'] as List<dynamic>?)
              ?.map((p) => LessonPart.fromJson(p as Map<String, dynamic>))
              .toList() ??
          const [],
      startBeat: json['start_beat'] as int?,
    );
  }

  @override
  List<Object?> get props => [id, label, labelHindi, phrases, parts, startBeat];
}

class LessonPart extends Equatable {
  final String id;
  final String label;
  final String? labelHindi;
  final List<List<String>> phrases;

  const LessonPart({
    required this.id,
    required this.label,
    this.labelHindi,
    required this.phrases,
  });

  factory LessonPart.fromJson(Map<String, dynamic> json) {
    return LessonPart(
      id: json['id'] as String? ?? 'part',
      label: json['label'] as String? ?? 'Part',
      labelHindi: json['label_hindi'] as String?,
      phrases: (json['phrases'] as List<dynamic>?)
              ?.map((p) => (p as List<dynamic>).cast<String>())
              .toList() ??
          const [],
    );
  }

  @override
  List<Object?> get props => [id, label, labelHindi, phrases];
}

class RagaInfo extends Equatable {
  final String name;
  final String? thaat;
  final String? jati;
  final String? time;
  final String? vadi;
  final String? samvadi;
  final List<String> nyas;
  final String? notes;

  const RagaInfo({
    required this.name,
    this.thaat,
    this.jati,
    this.time,
    this.vadi,
    this.samvadi,
    this.nyas = const [],
    this.notes,
  });

  factory RagaInfo.fromJson(Map<String, dynamic> json) {
    return RagaInfo(
      name: json['name'] as String? ?? 'Raga',
      thaat: json['thaat'] as String?,
      jati: json['jati'] as String?,
      time: json['time'] as String?,
      vadi: json['vadi'] as String?,
      samvadi: json['samvadi'] as String?,
      nyas: (json['nyas'] as List<dynamic>?)?.cast<String>() ?? const [],
      notes: json['notes'] as String?,
    );
  }

  @override
  List<Object?> get props => [
        name,
        thaat,
        jati,
        time,
        vadi,
        samvadi,
        nyas,
        notes,
      ];
}

class PlaybackPlan extends Equatable {
  final int repeatCount;
  final String direction;
  final int countInBeats;

  const PlaybackPlan({
    this.repeatCount = 1,
    this.direction = 'both',
    this.countInBeats = 4,
  });

  factory PlaybackPlan.fromJson(Map<String, dynamic> json) {
    return PlaybackPlan(
      repeatCount: json['repeat_count'] as int? ?? 1,
      direction: json['direction'] as String? ?? 'both',
      countInBeats: json['count_in_beats'] as int? ?? 4,
    );
  }

  @override
  List<Object?> get props => [repeatCount, direction, countInBeats];
}

class DisplayInfo extends Equatable {
  final String? aarohHindi;
  final String? avrohHindi;

  const DisplayInfo({this.aarohHindi, this.avrohHindi});

  factory DisplayInfo.fromJson(Map<String, dynamic> json) {
    return DisplayInfo(
      aarohHindi: json['aaroh_hindi'] as String?,
      avrohHindi: json['avroh_hindi'] as String?,
    );
  }

  @override
  List<Object?> get props => [aarohHindi, avrohHindi];
}

class SwarEvent extends Equatable {
  final String swar;
  final int beatIndex;
  final String direction;
  final int? groupIndex;
  final int index;

  const SwarEvent({
    required this.swar,
    required this.beatIndex,
    required this.direction,
    this.groupIndex,
    required this.index,
  });

  @override
  List<Object?> get props => [swar, beatIndex, direction, groupIndex, index];
}

class ExerciseTaal extends Equatable {
  final String id;
  final String name;
  final String? nameHindi;
  final int beats;
  final List<int> vibhag;
  final int samBeat;
  final List<int> taliBeats;
  final List<int> khaliBeats;
  final List<String>? bols;

  const ExerciseTaal({
    required this.id,
    required this.name,
    this.nameHindi,
    required this.beats,
    required this.vibhag,
    this.samBeat = 1,
    required this.taliBeats,
    required this.khaliBeats,
    this.bols,
  });

  factory ExerciseTaal.fromJson(Map<String, dynamic> json) {
    return ExerciseTaal(
      id: json['id'] as String,
      name: json['name'] as String,
      nameHindi: json['nameHindi'] as String?,
      beats: json['beats'] as int,
      vibhag: (json['vibhag'] as List<dynamic>).cast<int>(),
      samBeat: json['sam_beat'] as int? ?? 1,
      taliBeats: (json['tali_beats'] as List<dynamic>).cast<int>(),
      khaliBeats: (json['khali_beats'] as List<dynamic>).cast<int>(),
      bols: (json['bols'] as List<dynamic>?)?.cast<String>(),
    );
  }

  @override
  List<Object?> get props => [id, name, beats];
}

class SwarInfo extends Equatable {
  final int semitone;
  final String hindi;
  final String? octaveMarker;
  final bool isKomal;
  final bool isTivra;

  const SwarInfo({
    required this.semitone,
    required this.hindi,
    this.octaveMarker,
    this.isKomal = false,
    this.isTivra = false,
  });

  factory SwarInfo.fromJson(Map<String, dynamic> json) {
    return SwarInfo(
      semitone: json['semitone'] as int,
      hindi: json['hindi'] as String,
      octaveMarker: json['octaveMarker'] as String?,
      isKomal: json['isKomal'] as bool? ?? false,
      isTivra: json['isTivra'] as bool? ?? false,
    );
  }

  @override
  List<Object?> get props => [semitone, hindi];
}

class ExerciseDefaults extends Equatable {
  final String defaultMode;
  final String recommendedTaalId;
  final int recommendedBpm;
  final int recommendedNotesPerBeat;
  final String recommendedSaptak;

  const ExerciseDefaults({
    this.defaultMode = 'SING_ALONG',
    this.recommendedTaalId = 'TEENTAAL_16',
    this.recommendedBpm = PracticeDefaults.tempo,
    this.recommendedNotesPerBeat = 1,
    this.recommendedSaptak = PracticeDefaults.recommendedSaptak,
  });

  factory ExerciseDefaults.fromJson(Map<String, dynamic> json) {
    return ExerciseDefaults(
      defaultMode: json['default_mode'] as String? ?? 'SING_ALONG',
      recommendedTaalId:
          json['recommended_taal_id'] as String? ?? 'TEENTAAL_16',
      recommendedBpm: json['recommended_bpm'] as int? ?? PracticeDefaults.tempo,
      recommendedNotesPerBeat: json['recommended_notes_per_beat'] as int? ?? 1,
      recommendedSaptak: json['recommended_saptak'] as String? ??
          PracticeDefaults.recommendedSaptak,
    );
  }

  factory ExerciseDefaults.generateFrom({
    int? tempoBpm,
    String? taalId,
    int? swarsPerBeat,
  }) {
    return ExerciseDefaults(
      defaultMode: 'SING_ALONG',
      recommendedTaalId: taalId ?? 'TEENTAAL_16',
      recommendedBpm: tempoBpm ?? PracticeDefaults.tempo,
      recommendedNotesPerBeat: swarsPerBeat ?? 1,
    );
  }

  @override
  List<Object?> get props => [
        defaultMode,
        recommendedTaalId,
        recommendedBpm,
        recommendedNotesPerBeat,
        recommendedSaptak,
      ];
}

class AccompanimentDefaults extends Equatable {
  final bool tanpuraEnabled;
  final String tanpuraPattern;
  final double tanpuraVolume;
  final bool tablaEnabled;
  final double tablaVolume;
  final int countInAvartans;
  final int demoAvartans;
  final int practiceAvartans;
  final int swarPerMatra;

  const AccompanimentDefaults({
    this.tanpuraEnabled = PracticeDefaults.tanpuraEnabled,
    this.tanpuraPattern = PracticeDefaults.tanpuraPattern,
    this.tanpuraVolume = PracticeDefaults.tanpuraVolume,
    this.tablaEnabled = PracticeDefaults.tablaEnabled,
    this.tablaVolume = PracticeDefaults.tablaVolume,
    this.countInAvartans = 1,
    this.demoAvartans = 1,
    this.practiceAvartans = 2,
    this.swarPerMatra = 1,
  });

  factory AccompanimentDefaults.fromJson(Map<String, dynamic> json) {
    final tanpura = json['tanpura'] as Map<String, dynamic>? ?? {};
    final tabla = json['tabla'] as Map<String, dynamic>? ?? {};
    return AccompanimentDefaults(
      tanpuraEnabled:
          tanpura['enabled'] as bool? ?? PracticeDefaults.tanpuraEnabled,
      tanpuraPattern:
          tanpura['pattern'] as String? ?? PracticeDefaults.tanpuraPattern,
      tanpuraVolume: (tanpura['volume'] as num?)?.toDouble() ??
          PracticeDefaults.tanpuraVolume,
      tablaEnabled: tabla['enabled'] as bool? ?? PracticeDefaults.tablaEnabled,
      tablaVolume:
          (tabla['volume'] as num?)?.toDouble() ?? PracticeDefaults.tablaVolume,
      countInAvartans: json['count_in_avartans'] as int? ?? 1,
      demoAvartans: json['demo_avartans'] as int? ?? 1,
      practiceAvartans: json['practice_avartans'] as int? ?? 2,
      swarPerMatra: json['swar_per_matra'] as int? ?? 1,
    );
  }

  @override
  List<Object?> get props => [
        tanpuraEnabled,
        tanpuraPattern,
        tanpuraVolume,
        tablaEnabled,
        tablaVolume,
        countInAvartans,
        demoAvartans,
        practiceAvartans,
        swarPerMatra,
      ];
}

class ExerciseLibrary {
  final String version;
  final String title;
  final List<String> categories;
  final List<Exercise> exercises;
  final Map<String, ExerciseTaal> taals;
  final Map<String, SwarInfo> swaras;
  final AccompanimentDefaults accompanimentDefaults;

  const ExerciseLibrary({
    required this.version,
    required this.title,
    required this.categories,
    required this.exercises,
    required this.taals,
    required this.swaras,
    this.accompanimentDefaults = const AccompanimentDefaults(),
  });

  factory ExerciseLibrary.fromJson(Map<String, dynamic> json) {
    final taals = <String, ExerciseTaal>{};
    (json['taals'] as Map<String, dynamic>?)?.forEach((key, value) {
      taals[key] = ExerciseTaal.fromJson(value);
    });

    final swaras = <String, SwarInfo>{};
    (json['swaras'] as Map<String, dynamic>?)?.forEach((key, value) {
      swaras[key] = SwarInfo.fromJson(value);
    });

    return ExerciseLibrary(
      version: json['version'] as String? ?? '1.0',
      title: json['title'] as String? ?? 'Exercises',
      categories: (json['categories'] as List<dynamic>?)?.cast<String>() ?? [],
      exercises: (json['exercises'] as List<dynamic>?)
              ?.map((e) => Exercise.fromJson(e))
              .toList() ??
          [],
      taals: taals,
      swaras: swaras,
      accompanimentDefaults: json['accompaniment_defaults'] != null
          ? AccompanimentDefaults.fromJson(json['accompaniment_defaults'])
          : const AccompanimentDefaults(),
    );
  }
}

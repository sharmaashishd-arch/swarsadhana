import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/robot_riyaaz_provider.dart';
import '../models/exercise.dart';
import '../models/grading.dart';
import '../../../core/constants/music_constants.dart';
import '../../../core/theme/app_theme.dart';

/// Main Sadhana Screen - Exercise Browser
class RobotRiyaazScreen extends StatefulWidget {
  const RobotRiyaazScreen({super.key});

  @override
  State<RobotRiyaazScreen> createState() => _RobotRiyaazScreenState();
}

class _RobotRiyaazScreenState extends State<RobotRiyaazScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RobotRiyaazProvider>().loadExercises();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<RobotRiyaazProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading) {
          return const Center(
            child: CircularProgressIndicator(color: AppTheme.gold),
          );
        }

        if (provider.error != null) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.red),
                const SizedBox(height: 16),
                Text(
                  provider.error!,
                  style: const TextStyle(color: Colors.white70),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => provider.loadExercises(),
                  child: const Text('Retry'),
                ),
              ],
            ),
          );
        }

        return Column(
          children: [
            _buildHeader(),
            _buildCategoryTabs(provider),
            Expanded(child: _buildExerciseList(provider)),
          ],
        );
      },
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: const Column(
        children: [
          Text(
            '📚 Exercise Library',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: AppTheme.gold,
            ),
          ),
          SizedBox(height: 4),
          Text(
            'Select an exercise to practice',
            style: TextStyle(color: Colors.white60, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryTabs(RobotRiyaazProvider provider) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: provider.categories.map((category) {
          final isSelected = category == provider.selectedCategory;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              label: Text(category),
              selected: isSelected,
              onSelected: (_) {
                provider.setSelectedCategory(category);
              },
              selectedColor: AppTheme.gold,
              checkmarkColor: Colors.black,
              labelStyle: TextStyle(
                color: isSelected ? Colors.black : AppTheme.gold,
                fontWeight: FontWeight.w600,
              ),
              backgroundColor: AppTheme.surfaceLight,
              side: BorderSide(color: AppTheme.gold.withValues(alpha: 0.5)),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildExerciseList(RobotRiyaazProvider provider) {
    final exercises = provider.getExercisesByCategory(
      provider.selectedCategory,
    );

    if (exercises.isEmpty) {
      return const Center(
        child: Text(
          'No exercises in this category',
          style: TextStyle(color: Colors.white60),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: exercises.length,
      itemBuilder: (context, index) {
        final exercise = exercises[index];
        return _ExerciseCard(
          exercise: exercise,
          taal: provider.getTaal(exercise.taalId),
          onTap: () => _openExercise(exercise),
        );
      },
    );
  }

  void _openExercise(Exercise exercise) {
    final provider = context.read<RobotRiyaazProvider>();
    provider.selectExercise(exercise.id);

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ChangeNotifierProvider.value(
          value: provider,
          child: const ExerciseDetailScreen(),
        ),
      ),
    );
  }
}

class _ExerciseCard extends StatelessWidget {
  final Exercise exercise;
  final ExerciseTaal? taal;
  final VoidCallback onTap;

  const _ExerciseCard({required this.exercise, this.taal, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppTheme.surfaceMedium,
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      exercise.title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
              if (exercise.description != null) ...[
                const SizedBox(height: 8),
                Text(
                  exercise.description!,
                  style: const TextStyle(fontSize: 13, color: Colors.white60),
                ),
              ],
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  if (exercise.raga != null)
                    _buildTag('Raga ${exercise.raga!.name}'),
                  if (taal != null) _buildTag('${taal!.name} (${taal!.beats})'),
                  if (exercise.swarsPerBeat > 1)
                    _buildTag('${exercise.swarsPerBeat}x'),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTag(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLight,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: const TextStyle(fontSize: 11, color: Colors.white70),
      ),
    );
  }
}

/// Exercise Detail Screen
class ExerciseDetailScreen extends StatelessWidget {
  const ExerciseDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<RobotRiyaazProvider>(
      builder: (context, provider, child) {
        final exercise = provider.selectedExercise;
        if (exercise == null) {
          return const Scaffold(
            body: Center(child: Text('No exercise selected')),
          );
        }

        final taal = provider.getTaal(exercise.taalId);

        return Scaffold(
          backgroundColor: AppTheme.primaryDark,
          appBar: AppBar(
            backgroundColor: AppTheme.surfaceMedium,
            title: Text(
              exercise.title,
              style: const TextStyle(color: Colors.white, fontSize: 16),
            ),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: AppTheme.gold),
              onPressed: () => Navigator.pop(context),
            ),
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (exercise.description != null) ...[
                  Text(
                    exercise.description!,
                    style: const TextStyle(color: Colors.white70),
                  ),
                  const SizedBox(height: 16),
                ],
                if (exercise.raga != null) ...[
                  _buildRagaInfo(exercise.raga!),
                  const SizedBox(height: 16),
                ],
                _buildSwarDisplay(exercise, provider),
                if (taal != null) ...[
                  const SizedBox(height: 16),
                  _buildTaalDisplay(taal),
                ],
                const SizedBox(height: 12),
                _buildPracticeScopeSelector(provider),
                const SizedBox(height: 12),
                _buildAccompanimentBadges(provider),
                const SizedBox(height: 16),
                _buildModeSelector(provider),
                const SizedBox(height: 12),
                _buildAccompanimentToggles(provider),
                const SizedBox(height: 16),
                _buildControls(context, provider),
                const SizedBox(height: 24),
                _buildStartButton(context, provider),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSwarDisplay(Exercise exercise, RobotRiyaazProvider provider) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceMedium,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Swar Pattern',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.white60,
            ),
          ),
          const SizedBox(height: 12),
          if (exercise.aaroh != null)
            _buildSwarLine('आरोह', exercise.aaroh!, provider),
          if (exercise.avroh != null) ...[
            const SizedBox(height: 8),
            _buildSwarLine('अवरोह', exercise.avroh!, provider),
          ],
          if (exercise.aarohPhrases != null)
            ...exercise.aarohPhrases!.map(
              (phrase) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _buildSwarLine('आरोह', phrase, provider),
              ),
            ),
          if (exercise.avrohPhrases != null)
            ...exercise.avrohPhrases!.map(
              (phrase) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _buildSwarLine('अवरोह', phrase, provider),
              ),
            ),
          if (exercise.lessonSections.isNotEmpty)
            ...exercise.lessonSections.expand(
              (section) {
                final startBeat = section.startBeat == null
                    ? ''
                    : ' · matra ${section.startBeat}';
                return [
                  ...section.phrases.map(
                    (phrase) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: _buildSwarLine(
                        '${section.labelHindi ?? section.label}$startBeat',
                        phrase,
                        provider,
                      ),
                    ),
                  ),
                  ...section.parts.expand(
                    (part) => part.phrases.map(
                      (phrase) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: _buildSwarLine(
                          '${section.labelHindi ?? section.label} - '
                          '${part.labelHindi ?? part.label}$startBeat',
                          phrase,
                          provider,
                        ),
                      ),
                    ),
                  ),
                ];
              },
            ),
        ],
      ),
    );
  }

  Widget _buildRagaInfo(RagaInfo raga) {
    final chips = <String>[
      if (raga.thaat != null) 'Thaat: ${raga.thaat}',
      if (raga.jati != null) 'Jati: ${raga.jati}',
      if (raga.time != null) 'Time: ${raga.time}',
      if (raga.vadi != null) 'Vadi: ${raga.vadi}',
      if (raga.samvadi != null) 'Samvadi: ${raga.samvadi}',
      if (raga.nyas.isNotEmpty) 'Nyas: ${raga.nyas.join(", ")}',
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceMedium,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Raga ${raga.name}',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.white60,
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: chips.map(_infoBadge).toList(),
          ),
          if (raga.notes != null) ...[
            const SizedBox(height: 10),
            Text(
              raga.notes!,
              style: const TextStyle(color: Colors.white70, fontSize: 13),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPracticeScopeSelector(RobotRiyaazProvider provider) {
    final scopes = provider.practiceScopes;
    if (scopes.length <= 1) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceMedium,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Practice Part',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.white60,
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: scopes.map((scope) {
              final selected = provider.selectedScopeId == scope.id;
              final matra =
                  scope.startBeat == null ? '' : ' · matra ${scope.startBeat}';
              return ChoiceChip(
                label: Text('${scope.labelHindi ?? scope.label}$matra'),
                selected: selected,
                onSelected: (_) => provider.selectPracticeScope(scope.id),
                selectedColor: AppTheme.gold,
                labelStyle: TextStyle(
                  color: selected ? Colors.black : Colors.white70,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
                backgroundColor: AppTheme.surfaceLight,
                side: BorderSide(
                  color: selected
                      ? AppTheme.gold
                      : AppTheme.gold.withValues(alpha: 0.2),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildSwarLine(
    String label,
    List<String> swars,
    RobotRiyaazProvider provider,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: Colors.white54),
        ),
        const SizedBox(height: 4),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: swars.map((swar) {
            final info = provider.getSwarInfo(swar);
            final isRest = swar == '-';
            return Container(
              width: 36,
              height: 36,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                gradient: isRest
                    ? null
                    : const LinearGradient(
                        colors: [AppTheme.gold, AppTheme.goldDark],
                      ),
                color: isRest ? Colors.grey.shade700 : null,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                info?.hindi ?? swar,
                style: TextStyle(
                  color: isRest ? Colors.white54 : Colors.black,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'NotoSansDevanagari',
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildTaalDisplay(ExerciseTaal taal) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceMedium,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${taal.name} ${taal.nameHindi ?? ''}',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.white60,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: List.generate(taal.beats, (index) {
              final beatNum = index + 1;
              final isSam = beatNum == taal.samBeat;
              final isTali = taal.taliBeats.contains(beatNum);
              final isKhali = taal.khaliBeats.contains(beatNum);

              return Container(
                width: 40,
                height: 50,
                decoration: BoxDecoration(
                  color: isSam
                      ? Colors.orange.shade800
                      : isTali
                          ? Colors.blue.shade800
                          : isKhali
                              ? Colors.grey.shade700
                              : AppTheme.surfaceLight,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isSam
                        ? Colors.orange
                        : isTali
                            ? Colors.blue
                            : Colors.transparent,
                    width: 2,
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      '$beatNum',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                    if (taal.bols != null && index < taal.bols!.length)
                      Text(
                        taal.bols![index],
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 10,
                          fontFamily: 'NotoSansDevanagari',
                        ),
                      ),
                  ],
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildAccompanimentBadges(RobotRiyaazProvider provider) {
    final taal = provider.getTaal(provider.selectedExercise?.taalId);
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: [
        _infoBadge('Saptak: ${provider.saptak.label}'),
        _infoBadge('Tanpura: ${provider.tanpuraEnabled ? "ON" : "OFF"}'),
        _infoBadge(
          '${taal?.name ?? "Tabla"}: ${provider.tablaEnabled ? "ON" : "OFF"}',
        ),
      ],
    );
  }

  Widget _infoBadge(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLight.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.gold.withValues(alpha: 0.15)),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white60,
          fontSize: 11,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildAccompanimentToggles(RobotRiyaazProvider provider) {
    final taal = provider.getTaal(provider.selectedExercise?.taalId);
    final taalLabel = taal?.name ?? 'Tabla';

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        FilterChip(
          avatar: const Text('🎵', style: TextStyle(fontSize: 14)),
          label: Text('Tanpura ${provider.tanpuraEnabled ? "ON" : "OFF"}'),
          selected: provider.tanpuraEnabled,
          onSelected: (_) => provider.toggleTanpura(),
          selectedColor: Colors.green.withValues(alpha: 0.3),
          checkmarkColor: Colors.green,
          labelStyle: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: provider.tanpuraEnabled ? Colors.green : Colors.grey,
          ),
          backgroundColor: AppTheme.surfaceLight,
          side: BorderSide(
            color: provider.tanpuraEnabled
                ? Colors.green.withValues(alpha: 0.5)
                : Colors.grey.withValues(alpha: 0.3),
          ),
        ),
        FilterChip(
          avatar: const Text('🥁', style: TextStyle(fontSize: 14)),
          label: Text('$taalLabel ${provider.tablaEnabled ? "ON" : "OFF"}'),
          selected: provider.tablaEnabled,
          onSelected: (_) => provider.toggleTabla(),
          selectedColor: Colors.green.withValues(alpha: 0.3),
          checkmarkColor: Colors.green,
          labelStyle: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: provider.tablaEnabled ? Colors.green : Colors.grey,
          ),
          backgroundColor: AppTheme.surfaceLight,
          side: BorderSide(
            color: provider.tablaEnabled
                ? Colors.green.withValues(alpha: 0.5)
                : Colors.grey.withValues(alpha: 0.3),
          ),
        ),
      ],
    );
  }

  Widget _buildControls(BuildContext context, RobotRiyaazProvider provider) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceMedium,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Row(
            children: [
              const Text('Speed: ', style: TextStyle(color: Colors.white70)),
              Text(
                '${provider.subdivision}x',
                style: const TextStyle(
                  color: AppTheme.gold,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _buildSubdivisionButton(provider, 1),
              const SizedBox(width: 8),
              _buildSubdivisionButton(provider, 2),
              const SizedBox(width: 8),
              _buildSubdivisionButton(provider, 4),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSubdivisionButton(RobotRiyaazProvider provider, int value) {
    final isSelected = provider.subdivision == value;
    return Expanded(
      child: ElevatedButton(
        onPressed: () => provider.setSubdivision(value),
        style: ElevatedButton.styleFrom(
          backgroundColor: isSelected ? AppTheme.gold : AppTheme.surfaceLight,
          foregroundColor: isSelected ? Colors.black : AppTheme.gold,
          padding: const EdgeInsets.symmetric(vertical: 8),
        ),
        child: Text('${value}x'),
      ),
    );
  }

  Widget _buildModeSelector(RobotRiyaazProvider provider) {
    return SegmentedButton<PracticeMode>(
      segments: const [
        ButtonSegment(
          value: PracticeMode.singAlong,
          label: Text('Sing Along'),
          icon: Icon(Icons.music_note),
        ),
        ButtonSegment(
          value: PracticeMode.selfPractice,
          label: Text('Self Practice'),
          icon: Icon(Icons.headphones),
        ),
      ],
      selected: {provider.currentMode},
      onSelectionChanged: (s) => provider.setMode(s.first),
      style: ButtonStyle(
        backgroundColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppTheme.gold;
          }
          return AppTheme.surfaceLight;
        }),
        foregroundColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return Colors.black;
          }
          return Colors.white70;
        }),
      ),
    );
  }

  Widget _buildStartButton(BuildContext context, RobotRiyaazProvider provider) {
    final modeLabels = {
      PracticeMode.singAlong: 'Start Sing Along',
      PracticeMode.selfPractice: 'Start Self Practice',
    };
    final modeIcons = {
      PracticeMode.singAlong: Icons.music_note,
      PracticeMode.selfPractice: Icons.headphones,
    };

    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: () => _startSession(context, provider),
        icon: Icon(modeIcons[provider.currentMode]),
        label: Text(modeLabels[provider.currentMode]!),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.gold,
          foregroundColor: Colors.black,
          padding: const EdgeInsets.symmetric(vertical: 14),
        ),
      ),
    );
  }

  void _startSession(BuildContext context, RobotRiyaazProvider provider) {
    final mode = provider.currentMode;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ChangeNotifierProvider.value(
          value: provider,
          child: RobotSessionScreen(mode: mode),
        ),
      ),
    );
    provider.startSession(mode);
  }
}

/// Robot Session Screen
class RobotSessionScreen extends StatefulWidget {
  final PracticeMode mode;

  const RobotSessionScreen({super.key, required this.mode});

  @override
  State<RobotSessionScreen> createState() => _RobotSessionScreenState();
}

class _RobotSessionScreenState extends State<RobotSessionScreen> {
  final ScrollController _stripScrollController = ScrollController();
  int _lastHighlightedIndex = -1;

  @override
  void dispose() {
    _stripScrollController.dispose();
    super.dispose();
  }

  void _scrollToBeatColumn(int swarIndex, int subdivision) {
    if (!_stripScrollController.hasClients) return;
    final beatCol = swarIndex ~/ subdivision;
    if (beatCol == _lastHighlightedIndex) return;
    _lastHighlightedIndex = beatCol;

    final colWidth = subdivision == 1
        ? 49.0
        : (subdivision * 30.0 + (subdivision - 1) * 2 + 3);
    final targetOffset = (beatCol * colWidth) -
        (MediaQuery.of(context).size.width / 2) +
        (colWidth / 2);
    _stripScrollController.animateTo(
      targetOffset.clamp(0.0, _stripScrollController.position.maxScrollExtent),
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<RobotRiyaazProvider>(
      builder: (context, provider, child) {
        if (provider.sessionState == RobotSessionState.complete &&
            provider.report != null) {
          return _buildReportView(context, provider);
        }

        if (provider.currentEvents.isNotEmpty) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (widget.mode == PracticeMode.selfPractice) {
              _scrollToBeatColumn(
                provider.currentBeatIndex * provider.subdivision,
                provider.subdivision,
              );
            } else {
              _scrollToBeatColumn(
                provider.currentEventIndex,
                provider.subdivision,
              );
            }
          });
        }

        return Scaffold(
          backgroundColor: AppTheme.primaryDark,
          appBar: AppBar(
            backgroundColor: AppTheme.surfaceMedium,
            title: Text(
              provider.selectedExercise?.title ?? 'Session',
              style: const TextStyle(color: Colors.white, fontSize: 16),
            ),
            actions: [
              TextButton(
                onPressed: () {
                  provider.stopSession();
                  Navigator.popUntil(context, (route) => route.isFirst);
                },
                child: const Text('Stop', style: TextStyle(color: Colors.red)),
              ),
            ],
          ),
          body: Column(
            children: [
              _buildSessionStatus(provider),
              _buildSessionSpeedSelector(provider),
              _buildDualStrip(provider),
              Expanded(child: _buildCurrentSwar(provider)),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDualStrip(RobotRiyaazProvider provider) {
    final events = provider.currentEvents;
    if (events.isEmpty) return const SizedBox.shrink();

    final currentIdx = provider.currentEventIndex;
    final exercise = provider.selectedExercise;
    final subdivision = provider.subdivision;
    final taal = provider.getTaal(exercise?.taalId);
    final totalTaalBeats = taal?.beats ?? 16;
    final totalBeatColumns =
        events.isEmpty ? 1 : ((events.length + subdivision - 1) ~/ subdivision);

    final isPlaying = provider.sessionState == RobotSessionState.singAlong ||
        provider.sessionState == RobotSessionState.demoPhase ||
        provider.sessionState == RobotSessionState.practice;
    final currentBeatCol = isPlaying
        ? (provider.currentMode == PracticeMode.selfPractice
            ? provider.currentBeatIndex
            : currentIdx ~/ subdivision)
        : -1;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8),
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.surfaceMedium,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(left: 8, top: 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      height: 46,
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'Taal',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            color: Colors.white.withValues(alpha: 0.4),
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 3),
                    SizedBox(
                      height: 34,
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'Swar',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            color: Colors.white.withValues(alpha: 0.4),
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ShaderMask(
                  shaderCallback: (bounds) => const LinearGradient(
                    colors: [
                      Colors.transparent,
                      Colors.white,
                      Colors.white,
                      Colors.transparent,
                    ],
                    stops: [0.0, 0.04, 0.94, 1.0],
                  ).createShader(bounds),
                  blendMode: BlendMode.dstIn,
                  child: SizedBox(
                    height: 84,
                    child: ListView.builder(
                      controller: _stripScrollController,
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      itemCount: totalBeatColumns,
                      itemBuilder: (context, beatCol) {
                        return _buildBeatColumn(
                          provider,
                          beatCol,
                          currentBeatCol,
                          currentIdx,
                          isPlaying,
                          events,
                          subdivision,
                          taal,
                          totalTaalBeats,
                        );
                      },
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBeatColumn(
    RobotRiyaazProvider provider,
    int beatCol,
    int currentBeatCol,
    int currentSwarIdx,
    bool isPlaying,
    List<SwarEvent> events,
    int subdivision,
    ExerciseTaal? taal,
    int totalTaalBeats,
  ) {
    final taalBeatIdx = beatCol % totalTaalBeats;
    final beatNum = taalBeatIdx + 1;
    final isSam = beatNum == 1;
    final isTali = !isSam && (taal?.taliBeats.contains(beatNum) ?? false);
    final isKhali = taal?.khaliBeats.contains(beatNum) ?? false;
    final isCurrentBeat = beatCol == currentBeatCol;

    final marker = isSam
        ? 'X'
        : isKhali
            ? '०'
            : (isTali ? '|' : '');
    final bol = (taal?.bols != null && taalBeatIdx < taal!.bols!.length)
        ? taal.bols![taalBeatIdx]
        : '';

    Color borderColor = Colors.transparent;
    if (isSam) {
      borderColor = Colors.deepOrange;
    } else if (isTali) {
      borderColor = Colors.blue;
    } else if (isKhali) {
      borderColor = Colors.grey;
    }

    final subcells = <Widget>[];
    for (var s = 0; s < subdivision; s++) {
      final eventIdx = beatCol * subdivision + s;
      final hasEvent = eventIdx < events.length;
      final info =
          hasEvent ? provider.getSwarInfo(events[eventIdx].swar) : null;
      final label = hasEvent ? (info?.hindi ?? events[eventIdx].swar) : '-';

      final isActive = isPlaying && eventIdx == currentSwarIdx;
      final isDone = isPlaying && eventIdx < currentSwarIdx;
      final isEmpty = !hasEvent;

      subcells.add(
        AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          width: subdivision == 1 ? 42 : 28,
          height: 30,
          margin: EdgeInsets.only(left: s > 0 ? 2 : 0),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            gradient: isActive
                ? const LinearGradient(
                    colors: [AppTheme.gold, AppTheme.goldDark],
                  )
                : null,
            color: isActive
                ? null
                : isEmpty
                    ? Colors.white.withValues(alpha: 0.03)
                    : isDone
                        ? AppTheme.surfaceDark
                        : AppTheme.surfaceLight,
            borderRadius: BorderRadius.circular(6),
            boxShadow: isActive
                ? [
                    BoxShadow(
                      color: AppTheme.gold.withValues(alpha: 0.4),
                      blurRadius: 8,
                    ),
                  ]
                : null,
          ),
          child: Text(
            label,
            style: TextStyle(
              fontFamily: 'NotoSansDevanagari',
              fontSize: isActive ? 14 : 11,
              fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
              color: isActive
                  ? Colors.black
                  : isEmpty
                      ? Colors.white24
                      : isDone
                          ? Colors.white24
                          : Colors.white70,
            ),
          ),
        ),
      );
    }

    final colWidth =
        subdivision == 1 ? 46.0 : (subdivision * 30.0 + (subdivision - 1) * 2);

    return Padding(
      padding: const EdgeInsets.only(right: 3),
      child: SizedBox(
        width: colWidth,
        child: Column(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              height: 46,
              decoration: BoxDecoration(
                color: isCurrentBeat
                    ? AppTheme.goldDark
                    : isSam
                        ? Colors.deepOrange.withValues(alpha: 0.15)
                        : isKhali
                            ? Colors.grey.withValues(alpha: 0.1)
                            : AppTheme.surfaceLight,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isCurrentBeat
                      ? AppTheme.gold
                      : borderColor.withValues(alpha: 0.6),
                  width: isCurrentBeat ? 2 : 1.5,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (marker.isNotEmpty)
                    Text(
                      marker,
                      style: TextStyle(
                        fontSize: 8,
                        fontWeight: FontWeight.w700,
                        color: isCurrentBeat ? Colors.white : borderColor,
                      ),
                    ),
                  Text(
                    '$beatNum',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: isCurrentBeat ? Colors.white : Colors.white70,
                    ),
                  ),
                  if (bol.isNotEmpty)
                    Text(
                      bol,
                      style: TextStyle(
                        fontFamily: 'NotoSansDevanagari',
                        fontSize: 8,
                        color: isCurrentBeat ? Colors.white70 : Colors.white38,
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 3),
            Row(children: subcells),
          ],
        ),
      ),
    );
  }

  Widget _buildSessionSpeedSelector(RobotRiyaazProvider provider) {
    final sub = provider.subdivision;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          const Text(
            'Speed',
            style: TextStyle(color: Colors.white70, fontSize: 13),
          ),
          const SizedBox(width: 10),
          for (final v in [1, 2, 4]) ...[
            if (v > 1) const SizedBox(width: 4),
            _buildSpeedChip(provider, v, sub == v),
          ],
        ],
      ),
    );
  }

  Widget _buildSpeedChip(RobotRiyaazProvider provider, int value, bool active) {
    return GestureDetector(
      onTap: () => provider.setSubdivision(value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: active ? AppTheme.gold : AppTheme.surfaceLight,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          '${value}x',
          style: TextStyle(
            color: active ? Colors.black : AppTheme.gold,
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  Widget _buildSessionStatus(RobotRiyaazProvider provider) {
    final statusInfo = _getStatusInfo(provider.sessionState);
    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Text(statusInfo['icon']!, style: const TextStyle(fontSize: 48)),
          const SizedBox(height: 8),
          Text(
            statusInfo['text']!,
            style: const TextStyle(color: Colors.white70, fontSize: 16),
          ),
        ],
      ),
    );
  }

  Map<String, String> _getStatusInfo(RobotSessionState state) {
    switch (state) {
      case RobotSessionState.idle:
        return {'icon': '⏳', 'text': 'Ready'};
      case RobotSessionState.counting:
        return {'icon': '🎵', 'text': 'Count in...'};
      case RobotSessionState.singAlong:
        return {'icon': '🎶', 'text': 'Sing Along...'};
      case RobotSessionState.demoPhase:
        return {'icon': '🕉️', 'text': 'Watch & Listen...'};
      case RobotSessionState.practice:
        return {'icon': '🎤', 'text': 'Your turn!'};
      case RobotSessionState.grading:
        return {'icon': '📊', 'text': 'Analyzing...'};
      case RobotSessionState.complete:
        return {'icon': '✅', 'text': 'Complete!'};
    }
  }

  Widget _buildCurrentSwar(RobotRiyaazProvider provider) {
    final currentSwar = provider.currentSwar;
    final info =
        currentSwar != null ? provider.getSwarInfo(currentSwar.swar) : null;

    return Container(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 150,
            height: 150,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppTheme.gold, AppTheme.goldDark],
              ),
              borderRadius: BorderRadius.circular(75),
            ),
            child: Center(
              child: Text(
                info?.hindi ?? currentSwar?.swar ?? '-',
                style: const TextStyle(
                  fontSize: 64,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                  fontFamily: 'NotoSansDevanagari',
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          LinearProgressIndicator(
            value: provider.currentEvents.isEmpty
                ? 0
                : (provider.currentEventIndex + 1) /
                    provider.currentEvents.length,
            backgroundColor: AppTheme.surfaceLight,
            valueColor: const AlwaysStoppedAnimation(AppTheme.gold),
          ),
        ],
      ),
    );
  }

  Widget _buildReportView(BuildContext context, RobotRiyaazProvider provider) {
    final report = provider.report!;
    final scores = report.scores;

    return Scaffold(
      backgroundColor: AppTheme.primaryDark,
      appBar: AppBar(
        backgroundColor: AppTheme.surfaceMedium,
        title: const Text(
          'Practice Report',
          style: TextStyle(color: Colors.white),
        ),
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildOverallScore(scores),
            const SizedBox(height: 24),
            _buildScoreBreakdown(scores),
            const SizedBox(height: 24),
            _buildRecommendation(report.recommendation),
            const SizedBox(height: 24),
            _buildReportActions(context, provider),
          ],
        ),
      ),
    );
  }

  Widget _buildOverallScore(SessionScores scores) {
    final grade = scores.overallGrade;
    final color = grade == 'excellent'
        ? Colors.green
        : grade == 'good'
            ? Colors.lightGreen
            : grade == 'fair'
                ? Colors.orange
                : Colors.red;

    return Container(
      width: 140,
      height: 140,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color, color.shade700],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '${scores.overall}',
              style: const TextStyle(
                fontSize: 48,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const Text('Overall', style: TextStyle(color: Colors.white70)),
          ],
        ),
      ),
    );
  }

  Widget _buildScoreBreakdown(SessionScores scores) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceMedium,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          _buildScoreRow('Pitch Accuracy', scores.pitch),
          const SizedBox(height: 12),
          _buildScoreRow('Tuning (Cents)', scores.tuning),
          const SizedBox(height: 12),
          _buildScoreRow('Rhythm', scores.rhythm),
          const SizedBox(height: 12),
          _buildScoreRow('Completion', scores.completion),
        ],
      ),
    );
  }

  Widget _buildScoreRow(String label, int score) {
    final color = score >= 90
        ? Colors.green
        : score >= 70
            ? Colors.lightGreen
            : score >= 50
                ? Colors.orange
                : Colors.red;

    return Row(
      children: [
        Expanded(
          flex: 2,
          child: Text(label, style: const TextStyle(color: Colors.white70)),
        ),
        Expanded(
          flex: 3,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: score / 100,
              backgroundColor: AppTheme.surfaceLight,
              valueColor: AlwaysStoppedAnimation(color),
              minHeight: 12,
            ),
          ),
        ),
        const SizedBox(width: 12),
        SizedBox(
          width: 40,
          child: Text(
            '$score%',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }

  Widget _buildRecommendation(String recommendation) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.gold.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.gold.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.lightbulb_outline, color: AppTheme.gold),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              recommendation,
              style: const TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReportActions(
    BuildContext context,
    RobotRiyaazProvider provider,
  ) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(context);
              provider.startSession(provider.currentMode);
            },
            icon: const Icon(Icons.refresh),
            label: const Text('Practice Again'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.gold,
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: () =>
                Navigator.popUntil(context, (route) => route.isFirst),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppTheme.gold),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: const Text(
              'Back to Exercises',
              style: TextStyle(color: AppTheme.gold),
            ),
          ),
        ),
      ],
    );
  }
}

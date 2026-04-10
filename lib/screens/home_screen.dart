import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme/app_theme.dart';
import '../core/audio/audio_engine.dart';
import '../core/audio/swar_player.dart';
import '../core/constants/music_constants.dart';
import '../features/tanpura/providers/tanpura_provider.dart';
import '../features/tabla/providers/tabla_provider.dart';
import '../features/robot_riyaaz/providers/robot_riyaaz_provider.dart';
import '../features/robot_riyaaz/screens/robot_riyaaz_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  RootKey _currentKey = PracticeDefaults.key;
  int _currentTempo = PracticeDefaults.tempo;
  Saptak _currentSaptak = PracticeDefaults.saptak;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFF2D1810),
              Color(0xFF1A0F0A),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              _buildTopBar(),
              const Expanded(
                child: RobotRiyaazScreen(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          ShaderMask(
            shaderCallback: (bounds) => AppTheme.goldGradient.createShader(bounds),
            child: Text(
              'SwarSadhana',
              style: AppTheme.headingSmall.copyWith(
                color: Colors.white,
                letterSpacing: 1,
              ),
            ),
          ),
          const Spacer(),
          _buildSettingsSummary(),
          const SizedBox(width: 4),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            color: AppTheme.gold,
            onPressed: _showPracticeSetup,
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsSummary() {
    final keyName = _currentKey.name;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.gold.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.gold.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _settingsChip(keyName),
          _dividerDot(),
          _settingsChip('$_currentTempo'),
          _dividerDot(),
          _settingsChip(_currentSaptak.label),
        ],
      ),
    );
  }

  Widget _settingsChip(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: AppTheme.gold,
        fontSize: 11,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  Widget _dividerDot() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      child: Text(
        '·',
        style: TextStyle(
          color: AppTheme.gold.withValues(alpha: 0.4),
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  void _showPracticeSetup() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surfaceDark,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.75,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        expand: false,
        builder: (_, scrollController) => _PracticeSetupContent(
          scrollController: scrollController,
          currentKey: _currentKey,
          currentTempo: _currentTempo,
          currentSaptak: _currentSaptak,
          onKeyChanged: (key) {
            setState(() => _currentKey = key);
            context.read<AudioEngine>().setGlobalKey(key);
            context.read<TanpuraProvider>().setKey(key);
          },
          onTempoChanged: (bpm) {
            setState(() => _currentTempo = bpm);
            context.read<AudioEngine>().setGlobalTempo(bpm);
          },
          onSaptakChanged: (saptak) {
            setState(() => _currentSaptak = saptak);
            context.read<RobotRiyaazProvider>().setSaptak(saptak);
          },
        ),
      ),
    );
  }

}

class _PracticeSetupContent extends StatefulWidget {
  final ScrollController scrollController;
  final RootKey currentKey;
  final int currentTempo;
  final Saptak currentSaptak;
  final ValueChanged<RootKey> onKeyChanged;
  final ValueChanged<int> onTempoChanged;
  final ValueChanged<Saptak> onSaptakChanged;

  const _PracticeSetupContent({
    required this.scrollController,
    required this.currentKey,
    required this.currentTempo,
    required this.currentSaptak,
    required this.onKeyChanged,
    required this.onTempoChanged,
    required this.onSaptakChanged,
  });

  @override
  State<_PracticeSetupContent> createState() => _PracticeSetupContentState();
}

class _PracticeSetupContentState extends State<_PracticeSetupContent> {
  late RootKey _key;
  late int _tempo;
  late Saptak _saptak;
  bool _diagnosticsExpanded = false;

  @override
  void initState() {
    super.initState();
    _key = widget.currentKey;
    _tempo = widget.currentTempo;
    _saptak = widget.currentSaptak;
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      controller: widget.scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      children: [
        Center(
          child: Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: AppTheme.textMuted,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ),
        Text(
          'Practice Setup',
          style: AppTheme.headingMedium.copyWith(color: AppTheme.gold),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),

        _buildSectionHeader('Key & Tempo'),
        const SizedBox(height: 12),
        _buildKeyRow(),
        const SizedBox(height: 16),
        _buildSaptakRow(),
        const SizedBox(height: 16),
        _buildTempoRow(),
        const SizedBox(height: 24),

        _buildSectionHeader('Tanpura'),
        const SizedBox(height: 12),
        _buildTanpuraSection(),
        const SizedBox(height: 24),

        _buildSectionHeader('Tabla'),
        const SizedBox(height: 12),
        _buildTablaSection(),
        const SizedBox(height: 24),

        _buildDiagnosticsSection(),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title.toUpperCase(),
      style: AppTheme.labelLarge.copyWith(
        color: AppTheme.gold,
        fontSize: 11,
        letterSpacing: 1.5,
      ),
    );
  }

  Widget _buildKeyRow() {
    return Row(
      children: [
        Text('Sa (Key)', style: AppTheme.bodyMedium),
        const Spacer(),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: AppTheme.surfaceLight,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppTheme.gold.withValues(alpha: 0.3)),
          ),
          child: DropdownButton<RootKey>(
            value: _key,
            dropdownColor: AppTheme.surfaceDark,
            underline: const SizedBox(),
            icon: const Icon(Icons.keyboard_arrow_down, color: AppTheme.gold, size: 20),
            style: AppTheme.bodyLarge.copyWith(color: AppTheme.gold),
            items: RootKey.values.map((k) {
              return DropdownMenuItem(value: k, child: Text(k.name));
            }).toList(),
            onChanged: (k) {
              if (k != null) {
                setState(() => _key = k);
                widget.onKeyChanged(k);
              }
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSaptakRow() {
    return Row(
      children: [
        Text('Saptak', style: AppTheme.bodyMedium),
        const Spacer(),
        ToggleButtons(
          isSelected: Saptak.values.map((s) => s == _saptak).toList(),
          onPressed: (i) {
            final saptak = Saptak.values[i];
            setState(() => _saptak = saptak);
            widget.onSaptakChanged(saptak);
          },
          borderRadius: BorderRadius.circular(20),
          selectedColor: AppTheme.primaryDark,
          fillColor: AppTheme.gold,
          color: AppTheme.textSecondary,
          borderColor: AppTheme.gold.withValues(alpha: 0.3),
          selectedBorderColor: AppTheme.gold,
          constraints: const BoxConstraints(minWidth: 64, minHeight: 32),
          textStyle: AppTheme.bodySmall.copyWith(fontSize: 12),
          children: Saptak.values
              .map((s) => Text(s.label))
              .toList(),
        ),
      ],
    );
  }

  Widget _buildTempoRow() {
    return Row(
      children: [
        Text('Default BPM', style: AppTheme.bodyMedium),
        const Spacer(),
        SizedBox(
          width: 140,
          child: Slider(
            value: _tempo.toDouble(),
            min: PracticeDefaults.minTempo.toDouble(),
            max: PracticeDefaults.maxTempo.toDouble(),
            activeColor: AppTheme.gold,
            inactiveColor: AppTheme.surfaceLight,
            onChanged: (v) {
              setState(() => _tempo = v.round());
            },
            onChangeEnd: (v) {
              widget.onTempoChanged(v.round());
            },
          ),
        ),
        SizedBox(
          width: 36,
          child: Text(
            '$_tempo',
            style: AppTheme.bodyLarge.copyWith(color: AppTheme.gold),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }

  Widget _buildTanpuraSection() {
    return Consumer<TanpuraProvider>(
      builder: (context, tanpura, _) {
        return Column(
          children: [
            Row(
              children: [
                Text('Pattern', style: AppTheme.bodyMedium),
                const Spacer(),
                ToggleButtons(
                  isSelected: [
                    tanpura.strings1 == TanpuraStrings.paSaSaSa,
                    tanpura.strings1 == TanpuraStrings.maSaSaSa,
                    tanpura.strings1 == TanpuraStrings.niSaSaSa,
                  ],
                  onPressed: (i) {
                    tanpura.setStrings1(TanpuraStrings.values[i]);
                  },
                  borderRadius: BorderRadius.circular(20),
                  selectedColor: AppTheme.primaryDark,
                  fillColor: AppTheme.gold,
                  color: AppTheme.textSecondary,
                  borderColor: AppTheme.gold.withValues(alpha: 0.3),
                  selectedBorderColor: AppTheme.gold,
                  constraints: const BoxConstraints(minWidth: 56, minHeight: 32),
                  textStyle: AppTheme.bodySmall.copyWith(fontSize: 12),
                  children: const [
                    Text('Pa-Sa'),
                    Text('Ma-Sa'),
                    Text('Ni-Sa'),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Text('Volume', style: AppTheme.bodyMedium),
                Expanded(
                  child: Slider(
                    value: tanpura.volume1,
                    activeColor: AppTheme.gold,
                    inactiveColor: AppTheme.surfaceLight,
                    onChanged: (v) => tanpura.setVolume1(v),
                  ),
                ),
                SizedBox(
                  width: 36,
                  child: Text(
                    '${(tanpura.volume1 * 100).round()}%',
                    style: AppTheme.bodySmall,
                    textAlign: TextAlign.right,
                  ),
                ),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildTablaSection() {
    return Consumer<TablaProvider>(
      builder: (context, tabla, _) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Default Taal', style: AppTheme.bodyMedium),
            const SizedBox(height: 8),
            SizedBox(
              height: 36,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: Taals.all.length,
                separatorBuilder: (_, __) => const SizedBox(width: 6),
                itemBuilder: (_, i) {
                  final taal = Taals.all[i];
                  final selected = tabla.currentTaal == taal;
                  return ChoiceChip(
                    label: Text('${taal.name} (${taal.matras})'),
                    selected: selected,
                    onSelected: (_) => tabla.setTaal(taal),
                    selectedColor: AppTheme.gold,
                    backgroundColor: AppTheme.surfaceLight,
                    labelStyle: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: selected ? Colors.black : AppTheme.textSecondary,
                    ),
                    side: BorderSide(
                      color: selected
                          ? AppTheme.gold
                          : AppTheme.gold.withValues(alpha: 0.2),
                    ),
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    visualDensity: VisualDensity.compact,
                  );
                },
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Text('Volume', style: AppTheme.bodyMedium),
                Expanded(
                  child: Slider(
                    value: tabla.volume,
                    activeColor: AppTheme.gold,
                    inactiveColor: AppTheme.surfaceLight,
                    onChanged: (v) => tabla.setVolume(v),
                  ),
                ),
                SizedBox(
                  width: 36,
                  child: Text(
                    '${(tabla.volume * 100).round()}%',
                    style: AppTheme.bodySmall,
                    textAlign: TextAlign.right,
                  ),
                ),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildDiagnosticsSection() {
    return Column(
      children: [
        InkWell(
          onTap: () => setState(() => _diagnosticsExpanded = !_diagnosticsExpanded),
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              border: Border.all(color: AppTheme.gold.withValues(alpha: 0.2)),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Text('Diagnostics', style: AppTheme.bodyMedium.copyWith(color: AppTheme.textSecondary)),
                const Spacer(),
                Icon(
                  _diagnosticsExpanded ? Icons.expand_less : Icons.expand_more,
                  color: AppTheme.textMuted,
                  size: 20,
                ),
              ],
            ),
          ),
        ),
        if (_diagnosticsExpanded) ...[
          const SizedBox(height: 12),
          Text(
            'Audio engine initializes automatically when you start any exercise session.',
            style: AppTheme.bodySmall.copyWith(color: AppTheme.textMuted),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {
                final swarPlayer = context.read<SwarPlayer>();
                if (swarPlayer.isInitialized) {
                  swarPlayer.playNote('Sa', durationSec: 1.5);
                }
              },
              icon: const Icon(Icons.volume_up, size: 18),
              label: const Text('Play Test Tone'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.gold,
                side: BorderSide(color: AppTheme.gold.withValues(alpha: 0.4)),
                padding: const EdgeInsets.symmetric(vertical: 10),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

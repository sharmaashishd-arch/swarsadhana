import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/constants/music_constants.dart';
import '../../features/tabla/providers/tabla_provider.dart';
import '../../features/settings/providers/settings_provider.dart';
import 'instrument_card.dart';

class TablaCard extends StatelessWidget {
  const TablaCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer2<TablaProvider, SettingsProvider>(
      builder: (context, tabla, settings, _) {
        return InstrumentCard(
          title: 'Tabla',
          icon: '🥁',
          accentColor: AppTheme.tablaColor,
          isPlaying: tabla.isPlaying,
          isEnabled: tabla.isEnabled,
          onTogglePlay: tabla.toggle,
          collapsedContent: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Current taal indicator
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  tabla.currentTaal.name,
                  style:
                      AppTheme.bodySmall.copyWith(color: AppTheme.tablaColor),
                ),
              ),
              const SizedBox(width: 8),
            ],
          ),
          expandedContent: Column(
            children: [
              const Divider(color: AppTheme.surfaceLight),
              const SizedBox(height: 8),

              // Beat Visualization
              if (tabla.isPlaying) _buildBeatVisualization(tabla),

              const SizedBox(height: 16),

              // Taal Selector
              _buildTaalSelector(context, tabla, settings.isPro),

              const SizedBox(height: 16),

              // Tempo Controls
              _buildTempoControls(tabla),

              const SizedBox(height: 12),

              // Volume
              Row(
                children: [
                  SizedBox(
                    width: 60,
                    child: Text('Volume', style: AppTheme.bodySmall),
                  ),
                  Expanded(
                    child: VolumeSlider(
                      value: tabla.volume,
                      onChanged: tabla.setVolume,
                      activeColor: AppTheme.tablaColor,
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildBeatVisualization(TablaProvider tabla) {
    final taal = tabla.currentTaal;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceDark,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.tablaColor.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          // Theka (pattern)
          Text(
            taal.theka,
            style: AppTheme.bodyMedium.copyWith(
              color: AppTheme.textSecondary,
              fontFamily: 'NotoSansDevanagari',
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 12),

          // Beat indicators
          Wrap(
            spacing: 8,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: List.generate(taal.matras, (index) {
              final matraNum = index + 1;
              final isCurrent = index == tabla.currentMatra;
              final isSam = index == 0;
              final isTali = taal.talis.contains(matraNum);
              final isKhali = taal.khalis.contains(matraNum);

              return AnimatedContainer(
                duration: const Duration(milliseconds: 100),
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isCurrent
                      ? (isSam ? AppTheme.saffron : AppTheme.tablaColor)
                      : AppTheme.surfaceLight,
                  border: Border.all(
                    color: isTali
                        ? AppTheme.gold
                        : isKhali
                            ? AppTheme.textMuted
                            : Colors.transparent,
                    width: 2,
                  ),
                  boxShadow: isCurrent
                      ? [
                          BoxShadow(
                            color:
                                (isSam ? AppTheme.saffron : AppTheme.tablaColor)
                                    .withValues(alpha: 0.5),
                            blurRadius: 10,
                            spreadRadius: 2,
                          ),
                        ]
                      : null,
                ),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        isKhali ? '०' : '$matraNum',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color:
                              isCurrent ? Colors.white : AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),

          const SizedBox(height: 12),

          // Current bol
          Text(
            tabla.getBol(tabla.currentMatra),
            style: AppTheme.swaraText.copyWith(
              fontSize: 28,
              color: AppTheme.tablaColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTaalSelector(
      BuildContext context, TablaProvider tabla, bool isPro) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'SELECT TAAL',
          style: AppTheme.labelLarge.copyWith(fontSize: 11),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: Taals.all.map((taal) {
            final isSelected = taal == tabla.currentTaal;
            final isLocked = taal.isPro && !isPro;

            return GestureDetector(
              onTap: isLocked
                  ? () => _showProUpgradeDialog(context)
                  : () => tabla.setTaal(taal),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  gradient: isSelected ? AppTheme.goldGradient : null,
                  color: isSelected ? null : AppTheme.surfaceLight,
                  borderRadius: BorderRadius.circular(20),
                  border: isLocked
                      ? Border.all(color: AppTheme.textMuted, width: 1)
                      : null,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          taal.name,
                          style: AppTheme.bodyMedium.copyWith(
                            color: isSelected
                                ? AppTheme.primaryDark
                                : (isLocked
                                    ? AppTheme.textMuted
                                    : AppTheme.textPrimary),
                            fontWeight: isSelected
                                ? FontWeight.w600
                                : FontWeight.normal,
                          ),
                        ),
                        Text(
                          '${taal.matras} beats',
                          style: AppTheme.bodySmall.copyWith(
                            fontSize: 10,
                            color: isSelected
                                ? AppTheme.primaryDark.withValues(alpha: 0.7)
                                : AppTheme.textMuted,
                          ),
                        ),
                      ],
                    ),
                    if (isLocked) ...[
                      const SizedBox(width: 6),
                      const Icon(
                        Icons.lock,
                        size: 14,
                        color: AppTheme.textMuted,
                      ),
                    ],
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildTempoControls(TablaProvider tabla) {
    return Row(
      children: [
        // Tempo label
        SizedBox(
          width: 60,
          child: Text('Tempo', style: AppTheme.bodySmall),
        ),

        // Decrease buttons
        _buildTempoButton(
          label: '-5',
          onTap: () => tabla.decreaseTempo(5),
        ),
        _buildTempoButton(
          label: '-1',
          onTap: () => tabla.decreaseTempo(1),
        ),

        // Current tempo display
        Container(
          width: 80,
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: AppTheme.surfaceDark,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            children: [
              Text(
                '${tabla.tempo}',
                style: AppTheme.headingSmall.copyWith(
                  color: AppTheme.tablaColor,
                ),
              ),
              Text(
                'BPM',
                style: AppTheme.bodySmall.copyWith(
                  fontSize: 10,
                  color: AppTheme.textMuted,
                ),
              ),
            ],
          ),
        ),

        // Increase buttons
        _buildTempoButton(
          label: '+1',
          onTap: () => tabla.increaseTempo(1),
        ),
        _buildTempoButton(
          label: '+5',
          onTap: () => tabla.increaseTempo(5),
        ),

        const SizedBox(width: 8),

        // Laya indicator
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: AppTheme.saffron.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            tabla.layaName.split(' ')[0], // Just the Hindi name
            style: AppTheme.bodySmall.copyWith(
              color: AppTheme.saffron,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTempoButton({
    required String label,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: AppTheme.surfaceLight,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: Text(
              label,
              style: AppTheme.bodySmall.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showProUpgradeDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.surfaceDark,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: AppTheme.gold.withValues(alpha: 0.3)),
        ),
        title: Row(
          children: [
            const Text('✨ ', style: TextStyle(fontSize: 24)),
            Text('Pro Feature', style: AppTheme.headingSmall),
          ],
        ),
        content: Text(
          'This taal is part of the Pro subscription. Upgrade to unlock all taals, Swarmandal, Harmonium, Pitch Monitor, and Recording.',
          style: AppTheme.bodyMedium,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Later',
                style: TextStyle(color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: Navigate to payment
            },
            child: const Text('Upgrade'),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/constants/music_constants.dart';
import '../../features/tanpura/providers/tanpura_provider.dart';
import 'instrument_card.dart';

class TanpuraCard extends StatelessWidget {
  const TanpuraCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<TanpuraProvider>(
      builder: (context, tanpura, _) {
        return InstrumentCard(
          title: 'Tanpura',
          icon: '🎵',
          accentColor: AppTheme.tanpuraColor,
          isPlaying: tanpura.isPlaying,
          isEnabled: tanpura.isEnabled1 || tanpura.isEnabled2,
          onTogglePlay: () {
            if (tanpura.isPlaying) {
              tanpura.stopAll();
            } else {
              tanpura.playAll();
            }
          },
          collapsedContent: SizedBox(
            width: 80,
            child: VolumeSlider(
              value: tanpura.volume1,
              onChanged: tanpura.setVolume1,
              showLabel: false,
              activeColor: AppTheme.tanpuraColor,
            ),
          ),
          expandedContent: Column(
            children: [
              const Divider(color: AppTheme.surfaceLight),
              const SizedBox(height: 8),

              // Tanpura 1
              _buildTanpuraControl(
                context: context,
                label: 'Tanpura 1',
                isEnabled: tanpura.isEnabled1,
                isPlaying: tanpura.isPlaying1,
                volume: tanpura.volume1,
                strings: tanpura.strings1,
                fineTune: tanpura.fineTune1,
                onToggle: tanpura.toggleTanpura1,
                onVolumeChanged: tanpura.setVolume1,
                onStringsChanged: tanpura.setStrings1,
                onFineTuneChanged: tanpura.setFineTune1,
                onEnabledChanged: tanpura.setEnabled1,
              ),

              const SizedBox(height: 16),

              // Tanpura 2
              _buildTanpuraControl(
                context: context,
                label: 'Tanpura 2',
                isEnabled: tanpura.isEnabled2,
                isPlaying: tanpura.isPlaying2,
                volume: tanpura.volume2,
                strings: tanpura.strings2,
                fineTune: tanpura.fineTune2,
                onToggle: tanpura.toggleTanpura2,
                onVolumeChanged: tanpura.setVolume2,
                onStringsChanged: tanpura.setStrings2,
                onFineTuneChanged: tanpura.setFineTune2,
                onEnabledChanged: tanpura.setEnabled2,
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTanpuraControl({
    required BuildContext context,
    required String label,
    required bool isEnabled,
    required bool isPlaying,
    required double volume,
    required TanpuraStrings strings,
    required int fineTune,
    required VoidCallback onToggle,
    required ValueChanged<double> onVolumeChanged,
    required Future<void> Function(TanpuraStrings) onStringsChanged,
    required ValueChanged<int> onFineTuneChanged,
    required ValueChanged<bool> onEnabledChanged,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isEnabled
            ? AppTheme.surfaceDark.withValues(alpha: 0.5)
            : AppTheme.surfaceDark,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isPlaying
              ? AppTheme.tanpuraColor.withValues(alpha: 0.5)
              : Colors.transparent,
        ),
      ),
      child: Column(
        children: [
          // Header row
          Row(
            children: [
              // Enable/Disable toggle
              Switch(
                value: isEnabled,
                onChanged: onEnabledChanged,
                activeThumbColor: AppTheme.tanpuraColor,
              ),

              Text(
                label,
                style: AppTheme.bodyLarge.copyWith(
                  color: isEnabled ? AppTheme.textPrimary : AppTheme.textMuted,
                ),
              ),

              const Spacer(),

              if (isEnabled)
                GestureDetector(
                  onTap: onToggle,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: isPlaying
                          ? AppTheme.tanpuraColor
                          : AppTheme.surfaceLight,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      isPlaying ? 'Stop' : 'Play',
                      style: AppTheme.bodySmall.copyWith(
                        color: isPlaying ? Colors.white : AppTheme.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
            ],
          ),

          if (isEnabled) ...[
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
                    value: volume,
                    onChanged: onVolumeChanged,
                    activeColor: AppTheme.tanpuraColor,
                    showLabel: true,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 8),

            // String configuration
            Row(
              children: [
                SizedBox(
                  width: 60,
                  child: Text('Strings', style: AppTheme.bodySmall),
                ),
                Expanded(
                  child: Wrap(
                    spacing: 8,
                    children: TanpuraStrings.values.map((s) {
                      final isSelected = s == strings;
                      return GestureDetector(
                        onTap: () => onStringsChanged(s),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppTheme.tanpuraColor
                                : AppTheme.surfaceLight,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Text(
                            s.name,
                            style: AppTheme.bodySmall.copyWith(
                              color: isSelected
                                  ? Colors.white
                                  : AppTheme.textSecondary,
                              fontWeight: isSelected
                                  ? FontWeight.w600
                                  : FontWeight.normal,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 8),

            // Fine tune
            Row(
              children: [
                SizedBox(
                  width: 60,
                  child: Text('Fine Tune', style: AppTheme.bodySmall),
                ),
                Expanded(
                  child: SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      activeTrackColor: AppTheme.tanpuraColor,
                      inactiveTrackColor: AppTheme.surfaceLight,
                      thumbColor: AppTheme.tanpuraColor,
                    ),
                    child: Slider(
                      value: fineTune.toDouble(),
                      min: -50,
                      max: 50,
                      divisions: 100,
                      onChanged: (v) => onFineTuneChanged(v.round()),
                    ),
                  ),
                ),
                SizedBox(
                  width: 50,
                  child: Text(
                    '${fineTune > 0 ? '+' : ''}$fineTune¢',
                    style: AppTheme.bodySmall,
                    textAlign: TextAlign.right,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

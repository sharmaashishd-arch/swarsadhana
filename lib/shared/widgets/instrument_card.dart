import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

/// Base instrument card widget with expand/collapse functionality
class InstrumentCard extends StatefulWidget {
  final String title;
  final String icon;
  final Color accentColor;
  final bool isPlaying;
  final bool isEnabled;
  final VoidCallback? onTogglePlay;
  final VoidCallback? onToggleEnabled;
  final Widget expandedContent;
  final Widget? collapsedContent;
  final bool initiallyExpanded;

  const InstrumentCard({
    super.key,
    required this.title,
    required this.icon,
    this.accentColor = AppTheme.gold,
    this.isPlaying = false,
    this.isEnabled = true,
    this.onTogglePlay,
    this.onToggleEnabled,
    required this.expandedContent,
    this.collapsedContent,
    this.initiallyExpanded = true,
  });

  @override
  State<InstrumentCard> createState() => _InstrumentCardState();
}

class _InstrumentCardState extends State<InstrumentCard>
    with SingleTickerProviderStateMixin {
  late bool _isExpanded;
  late AnimationController _controller;
  late Animation<double> _expandAnimation;

  @override
  void initState() {
    super.initState();
    _isExpanded = widget.initiallyExpanded;

    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _expandAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    );

    if (_isExpanded) {
      _controller.value = 1.0;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggleExpand() {
    setState(() {
      _isExpanded = !_isExpanded;
      if (_isExpanded) {
        _controller.forward();
      } else {
        _controller.reverse();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: widget.isPlaying
              ? [
                  widget.accentColor.withValues(alpha: 0.2),
                  AppTheme.surfaceDark,
                ]
              : [
                  AppTheme.surfaceMedium,
                  AppTheme.surfaceDark,
                ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: widget.isPlaying
              ? widget.accentColor.withValues(alpha: 0.6)
              : AppTheme.gold.withValues(alpha: 0.2),
          width: widget.isPlaying ? 2 : 1,
        ),
        boxShadow: widget.isPlaying
            ? [
                BoxShadow(
                  color: widget.accentColor.withValues(alpha: 0.3),
                  blurRadius: 20,
                  spreadRadius: 2,
                ),
              ]
            : AppTheme.cardShadow,
      ),
      child: Column(
        children: [
          // Header
          InkWell(
            onTap: _toggleExpand,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  // Icon
                  Text(
                    widget.icon,
                    style: const TextStyle(fontSize: 32),
                  ),
                  const SizedBox(width: 12),

                  // Title
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.title,
                          style: AppTheme.headingSmall.copyWith(
                            color: widget.isPlaying
                                ? widget.accentColor
                                : AppTheme.textPrimary,
                          ),
                        ),
                        if (widget.isPlaying)
                          Text(
                            'Playing',
                            style: AppTheme.bodySmall.copyWith(
                              color: widget.accentColor,
                            ),
                          ),
                      ],
                    ),
                  ),

                  // Collapsed content (volume slider, etc.)
                  if (!_isExpanded && widget.collapsedContent != null)
                    widget.collapsedContent!,

                  // Play/Pause button
                  if (widget.onTogglePlay != null)
                    GestureDetector(
                      onTap: widget.isEnabled ? widget.onTogglePlay : null,
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: widget.isPlaying
                              ? const LinearGradient(
                                  colors: [AppTheme.error, Color(0xFFB71C1C)],
                                )
                              : widget.isEnabled
                                  ? AppTheme.goldGradient
                                  : null,
                          color: widget.isEnabled ? null : AppTheme.surfaceDark,
                        ),
                        child: Icon(
                          widget.isPlaying ? Icons.pause : Icons.play_arrow,
                          color: widget.isEnabled
                              ? (widget.isPlaying
                                  ? Colors.white
                                  : AppTheme.primaryDark)
                              : AppTheme.textMuted,
                        ),
                      ),
                    ),

                  const SizedBox(width: 8),

                  // Expand/Collapse button
                  RotationTransition(
                    turns:
                        Tween(begin: 0.0, end: 0.5).animate(_expandAnimation),
                    child: const Icon(
                      Icons.keyboard_arrow_down,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Expanded content
          SizeTransition(
            sizeFactor: _expandAnimation,
            child: Container(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: widget.expandedContent,
            ),
          ),
        ],
      ),
    );
  }
}

/// Simple volume slider widget
class VolumeSlider extends StatelessWidget {
  final double value;
  final ValueChanged<double> onChanged;
  final Color? activeColor;
  final bool showLabel;

  const VolumeSlider({
    super.key,
    required this.value,
    required this.onChanged,
    this.activeColor,
    this.showLabel = true,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        if (showLabel)
          Icon(
            value > 0 ? Icons.volume_up : Icons.volume_off,
            color: AppTheme.textSecondary,
            size: 20,
          ),
        Expanded(
          child: SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: activeColor ?? AppTheme.gold,
              inactiveTrackColor: AppTheme.surfaceLight,
              thumbColor: activeColor ?? AppTheme.gold,
              overlayColor:
                  (activeColor ?? AppTheme.gold).withValues(alpha: 0.2),
              trackHeight: 4,
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
            ),
            child: Slider(
              value: value,
              onChanged: onChanged,
            ),
          ),
        ),
        if (showLabel)
          SizedBox(
            width: 36,
            child: Text(
              '${(value * 100).round()}%',
              style: AppTheme.bodySmall,
              textAlign: TextAlign.right,
            ),
          ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

/// Placeholder for global controls widget
/// The actual implementation is in home_screen.dart
class GlobalControls extends StatelessWidget {
  const GlobalControls({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: AppTheme.instrumentCardDecoration,
      child: const Center(
        child: Text('Global Controls'),
      ),
    );
  }
}


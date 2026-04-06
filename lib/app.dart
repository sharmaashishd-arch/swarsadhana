import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme/app_theme.dart';
import 'features/settings/providers/settings_provider.dart';
import 'screens/home_screen.dart';
import 'screens/splash_screen.dart';

class SwarSadhanaApp extends StatelessWidget {
  const SwarSadhanaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<SettingsProvider>(
      builder: (context, settings, _) {
        return MaterialApp(
          title: 'SwarSadhana',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.darkTheme,
          locale: Locale(settings.language),
          home: const SplashScreen(),
          routes: {
            '/home': (context) => const HomeScreen(),
          },
        );
      },
    );
  }
}


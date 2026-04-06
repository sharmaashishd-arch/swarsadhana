import 'package:flutter/material.dart';
import 'package:animated_text_kit/animated_text_kit.dart';

import '../core/theme/app_theme.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    
    _controller = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );
    
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.5, curve: Curves.easeOut),
      ),
    );
    
    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.5, curve: Curves.easeOutBack),
      ),
    );
    
    _controller.forward();
    
    // Navigate to home after delay
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/home');
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

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
              Color(0xFF0D0705),
            ],
          ),
        ),
        child: Center(
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              return Opacity(
                opacity: _fadeAnimation.value,
                child: Transform.scale(
                  scale: _scaleAnimation.value,
                  child: child,
                ),
              );
            },
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Om Symbol or Tanpura Icon
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: AppTheme.goldGradient,
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.gold.withValues(alpha: 0.4),
                        blurRadius: 30,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Text(
                      'ॐ',
                      style: TextStyle(
                        fontSize: 60,
                        fontWeight: FontWeight.w300,
                        color: Color(0xFF1A0F0A),
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(height: 40),
                
                // App Name
                ShaderMask(
                  shaderCallback: (bounds) => const LinearGradient(
                    colors: [AppTheme.goldLight, AppTheme.gold, AppTheme.goldDark],
                  ).createShader(bounds),
                  child: Text(
                    'SwarSadhana',
                    style: AppTheme.headingLarge.copyWith(
                      fontSize: 36,
                      letterSpacing: 2,
                      color: Colors.white,
                    ),
                  ),
                ),
                
                const SizedBox(height: 12),
                
                // Tagline with typewriter effect
                DefaultTextStyle(
                  style: AppTheme.bodyMedium.copyWith(
                    color: AppTheme.textSecondary,
                    letterSpacing: 1,
                  ),
                  child: AnimatedTextKit(
                    animatedTexts: [
                      TypewriterAnimatedText(
                        'स्वर साधना',
                        speed: const Duration(milliseconds: 150),
                      ),
                    ],
                    totalRepeatCount: 1,
                  ),
                ),
                
                const SizedBox(height: 8),
                
                Text(
                  'Your Musical Companion',
                  style: AppTheme.bodySmall.copyWith(
                    color: AppTheme.textMuted,
                    letterSpacing: 0.5,
                  ),
                ),
                
                const SizedBox(height: 80),
                
                // Loading indicator
                SizedBox(
                  width: 40,
                  height: 40,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      AppTheme.gold.withValues(alpha: 0.6),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}


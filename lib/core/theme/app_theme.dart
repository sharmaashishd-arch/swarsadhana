import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// SwarSadhana Theme - Traditional Indian Classical Music Aesthetic
/// 
/// Color palette inspired by:
/// - Warm wood tones (Tanpura body)
/// - Gold accents (Brass fittings)
/// - Deep maroons and burgundy (Classical music ambiance)
/// - Saffron highlights (Traditional Indian)
class AppTheme {
  AppTheme._();

  // ============================================
  // COLOR PALETTE
  // ============================================
  
  // Primary Colors - Deep Wood & Gold
  static const Color primaryDark = Color(0xFF1A0F0A);      // Dark rosewood
  static const Color primaryMedium = Color(0xFF2D1810);    // Rosewood
  static const Color primaryLight = Color(0xFF4A2C20);     // Light rosewood
  
  // Accent Colors - Gold & Saffron
  static const Color gold = Color(0xFFD4AF37);             // Brass/Gold
  static const Color goldLight = Color(0xFFE8C864);        // Light gold
  static const Color goldDark = Color(0xFFB8860B);         // Dark gold
  static const Color saffron = Color(0xFFFF9933);          // Indian saffron
  
  // Semantic Colors
  static const Color success = Color(0xFF4CAF50);          // Green - Active
  static const Color warning = Color(0xFFFF9800);          // Orange - Warning
  static const Color error = Color(0xFFE53935);            // Red - Error/Stop
  static const Color info = Color(0xFF2196F3);             // Blue - Info
  
  // Text Colors
  static const Color textPrimary = Color(0xFFF5E6D3);      // Cream white
  static const Color textSecondary = Color(0xFFB8A89A);    // Muted cream
  static const Color textMuted = Color(0xFF7A6A5A);        // Dark cream
  
  // Surface Colors
  static const Color surfaceDark = Color(0xFF251510);      // Card dark
  static const Color surfaceMedium = Color(0xFF352218);    // Card medium
  static const Color surfaceLight = Color(0xFF453225);     // Card light
  
  // Instrument Colors
  static const Color tanpuraColor = Color(0xFF8B4513);     // Saddle brown
  static const Color tablaColor = Color(0xFFCD853F);       // Peru (drum skin)
  static const Color swarmandalColor = Color(0xFF6B4423);  // Dark wood
  static const Color harmoniumColor = Color(0xFF4A3728);   // Dark mahogany

  // ============================================
  // GRADIENTS
  // ============================================
  
  static const LinearGradient woodGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF3D2415),
      Color(0xFF2D1810),
      Color(0xFF1A0F0A),
    ],
  );
  
  static const LinearGradient goldGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFFE8C864),
      Color(0xFFD4AF37),
      Color(0xFFB8860B),
    ],
  );
  
  static const LinearGradient cardGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF352218),
      Color(0xFF251510),
    ],
  );

  // ============================================
  // SHADOWS
  // ============================================
  
  static List<BoxShadow> get cardShadow => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.4),
      blurRadius: 12,
      offset: const Offset(0, 6),
    ),
  ];
  
  static List<BoxShadow> get goldGlow => [
    BoxShadow(
      color: gold.withValues(alpha: 0.3),
      blurRadius: 15,
      spreadRadius: 2,
    ),
  ];

  // ============================================
  // TEXT STYLES
  // ============================================
  
  static TextStyle get headingLarge => GoogleFonts.poppins(
    fontSize: 28,
    fontWeight: FontWeight.w700,
    color: textPrimary,
    letterSpacing: 0.5,
  );
  
  static TextStyle get headingMedium => GoogleFonts.poppins(
    fontSize: 22,
    fontWeight: FontWeight.w600,
    color: textPrimary,
  );
  
  static TextStyle get headingSmall => GoogleFonts.poppins(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: textPrimary,
  );
  
  static TextStyle get bodyLarge => GoogleFonts.poppins(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    color: textPrimary,
  );
  
  static TextStyle get bodyMedium => GoogleFonts.poppins(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: textSecondary,
  );
  
  static TextStyle get bodySmall => GoogleFonts.poppins(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: textMuted,
  );
  
  static TextStyle get labelLarge => GoogleFonts.poppins(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    color: gold,
    letterSpacing: 1.2,
  );
  
  static TextStyle get swaraText => GoogleFonts.notoSansDevanagari(
    fontSize: 24,
    fontWeight: FontWeight.w600,
    color: gold,
  );

  // ============================================
  // DARK THEME
  // ============================================
  
  static ThemeData get darkTheme => ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    
    // Colors
    colorScheme: const ColorScheme.dark(
      primary: gold,
      secondary: saffron,
      surface: primaryDark,
      error: error,
      onPrimary: primaryDark,
      onSecondary: primaryDark,
      onSurface: textPrimary,
      onError: Colors.white,
    ),
    
    scaffoldBackgroundColor: primaryDark,
    
    // AppBar
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: headingMedium,
      iconTheme: const IconThemeData(color: gold),
    ),
    
    // Cards
    cardTheme: CardThemeData(
      color: surfaceDark,
      elevation: 8,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
    ),
    
    // Buttons
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: gold,
        foregroundColor: primaryDark,
        elevation: 4,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        textStyle: GoogleFonts.poppins(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: gold,
        side: const BorderSide(color: gold, width: 1.5),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    ),
    
    // Slider
    sliderTheme: SliderThemeData(
      activeTrackColor: gold,
      inactiveTrackColor: surfaceLight,
      thumbColor: gold,
      overlayColor: gold.withValues(alpha: 0.2),
      trackHeight: 4,
      thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
    ),
    
    // Switch
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return gold;
        return textMuted;
      }),
      trackColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return gold.withValues(alpha: 0.4);
        return surfaceLight;
      }),
    ),
    
    // Divider
    dividerTheme: DividerThemeData(
      color: surfaceLight.withValues(alpha: 0.5),
      thickness: 1,
    ),
    
    // Icons
    iconTheme: const IconThemeData(
      color: gold,
      size: 24,
    ),
    
    // Text
    textTheme: TextTheme(
      displayLarge: headingLarge,
      displayMedium: headingMedium,
      displaySmall: headingSmall,
      bodyLarge: bodyLarge,
      bodyMedium: bodyMedium,
      bodySmall: bodySmall,
      labelLarge: labelLarge,
    ),
  );

  // ============================================
  // DECORATIONS
  // ============================================
  
  static BoxDecoration get cardDecoration => BoxDecoration(
    gradient: cardGradient,
    borderRadius: BorderRadius.circular(16),
    border: Border.all(
      color: gold.withValues(alpha: 0.2),
      width: 1,
    ),
    boxShadow: cardShadow,
  );
  
  static BoxDecoration get instrumentCardDecoration => BoxDecoration(
    gradient: const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [
        Color(0xFF3A2215),
        Color(0xFF2A1810),
      ],
    ),
    borderRadius: BorderRadius.circular(20),
    border: Border.all(
      color: gold.withValues(alpha: 0.3),
      width: 1.5,
    ),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withValues(alpha: 0.5),
        blurRadius: 15,
        offset: const Offset(0, 8),
      ),
    ],
  );
  
  static BoxDecoration activeGlow(Color color) => BoxDecoration(
    borderRadius: BorderRadius.circular(20),
    boxShadow: [
      BoxShadow(
        color: color.withValues(alpha: 0.4),
        blurRadius: 20,
        spreadRadius: 2,
      ),
    ],
  );
}


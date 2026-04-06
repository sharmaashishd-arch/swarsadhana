library music_constants;

/// Indian Classical Music Constants
///
/// Contains all musical definitions for Hindustani and Carnatic music

import 'dart:math' as math;

// ============================================
// SWARAS (Notes)
// ============================================

/// The 12 Swaras in Indian Classical Music
enum Swara {
  sa,     // षड्ज (Shadja) - C
  reKomal, // कोमल ऋषभ (Komal Rishabh) - Db
  re,     // शुद्ध ऋषभ (Shuddh Rishabh) - D
  gaKomal, // कोमल गांधार (Komal Gandhar) - Eb
  ga,     // शुद्ध गांधार (Shuddh Gandhar) - E
  ma,     // शुद्ध मध्यम (Shuddh Madhyam) - F
  maTivra, // तीव्र मध्यम (Tivra Madhyam) - F#
  pa,     // पंचम (Pancham) - G
  dhaKomal, // कोमल धैवत (Komal Dhaivat) - Ab
  dha,    // शुद्ध धैवत (Shuddh Dhaivat) - A
  niKomal, // कोमल निषाद (Komal Nishad) - Bb
  ni,     // शुद्ध निषाद (Shuddh Nishad) - B
}

extension SwaraExtension on Swara {
  String get hindi {
    switch (this) {
      case Swara.sa: return 'सा';
      case Swara.reKomal: return 'रे॒';
      case Swara.re: return 'रे';
      case Swara.gaKomal: return 'ग॒';
      case Swara.ga: return 'ग';
      case Swara.ma: return 'म';
      case Swara.maTivra: return 'म॑';
      case Swara.pa: return 'प';
      case Swara.dhaKomal: return 'ध॒';
      case Swara.dha: return 'ध';
      case Swara.niKomal: return 'नि॒';
      case Swara.ni: return 'नि';
    }
  }
  
  String get english {
    switch (this) {
      case Swara.sa: return 'Sa';
      case Swara.reKomal: return 're';
      case Swara.re: return 'Re';
      case Swara.gaKomal: return 'ga';
      case Swara.ga: return 'Ga';
      case Swara.ma: return 'Ma';
      case Swara.maTivra: return 'ma\'';
      case Swara.pa: return 'Pa';
      case Swara.dhaKomal: return 'dha';
      case Swara.dha: return 'Dha';
      case Swara.niKomal: return 'ni';
      case Swara.ni: return 'Ni';
    }
  }
  
  /// Semitone offset from Sa
  int get semitoneOffset {
    switch (this) {
      case Swara.sa: return 0;
      case Swara.reKomal: return 1;
      case Swara.re: return 2;
      case Swara.gaKomal: return 3;
      case Swara.ga: return 4;
      case Swara.ma: return 5;
      case Swara.maTivra: return 6;
      case Swara.pa: return 7;
      case Swara.dhaKomal: return 8;
      case Swara.dha: return 9;
      case Swara.niKomal: return 10;
      case Swara.ni: return 11;
    }
  }
}

// ============================================
// ROOT KEYS (Sa Positions)
// ============================================

/// Western note names for the root key (Sa)
enum RootKey {
  C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B
}

extension RootKeyExtension on RootKey {
  String get name {
    switch (this) {
      case RootKey.C: return 'C';
      case RootKey.Db: return 'C# / Db';
      case RootKey.D: return 'D';
      case RootKey.Eb: return 'D# / Eb';
      case RootKey.E: return 'E';
      case RootKey.F: return 'F';
      case RootKey.Gb: return 'F# / Gb';
      case RootKey.G: return 'G';
      case RootKey.Ab: return 'G# / Ab';
      case RootKey.A: return 'A';
      case RootKey.Bb: return 'A# / Bb';
      case RootKey.B: return 'B';
    }
  }
  
  /// Frequency in Hz (Octave 4)
  double get frequency {
    const double a4 = 440.0;
    final int semitonesFromA4 = index - RootKey.A.index;
    return a4 * math.pow(2, semitonesFromA4 / 12.0);
  }
  
  /// Pitch shift in semitones from C
  int get semitones => index;
}

// ============================================
// SAPTAK (Octaves)
// ============================================

enum Saptak {
  mandra,
  madhya,
  taar,
}

extension SaptakExtension on Saptak {
  String get label {
    switch (this) {
      case Saptak.mandra: return 'Mandra';
      case Saptak.madhya: return 'Madhya';
      case Saptak.taar: return 'Taar';
    }
  }

  String get hindi {
    switch (this) {
      case Saptak.mandra: return 'मन्द्र';
      case Saptak.madhya: return 'मध्य';
      case Saptak.taar: return 'तार';
    }
  }

  int get semitoneShift {
    switch (this) {
      case Saptak.mandra: return -12;
      case Saptak.madhya: return 0;
      case Saptak.taar: return 12;
    }
  }
}

// ============================================
// TAALS (Rhythmic Cycles)
// ============================================

/// Taal definition with beats and divisions
class Taal {
  final String name;
  final String nameHindi;
  final int matras;          // Total beats
  final List<int> vibhags;   // Division pattern
  final List<String> bols;   // Syllables for each matra
  final String theka;        // Basic pattern
  final int sam;             // First beat (always 1)
  final List<int> talis;     // Clap positions
  final List<int> khalis;    // Wave positions
  final bool isPro;          // Locked behind Pro subscription
  
  const Taal({
    required this.name,
    required this.nameHindi,
    required this.matras,
    required this.vibhags,
    required this.bols,
    required this.theka,
    this.sam = 1,
    required this.talis,
    required this.khalis,
    this.isPro = false,
  });
}

/// All available Taals
class Taals {
  Taals._();
  
  static const Taal teentaal = Taal(
    name: 'Teentaal',
    nameHindi: 'तीनताल',
    matras: 16,
    vibhags: [4, 4, 4, 4],
    bols: ['धा', 'धिं', 'धिं', 'धा', 'धा', 'धिं', 'धिं', 'धा',
           'धा', 'तिं', 'तिं', 'ता', 'ता', 'धिं', 'धिं', 'धा'],
    theka: 'धा धिं धिं धा | धा धिं धिं धा | धा तिं तिं ता | ता धिं धिं धा',
    talis: [1, 5, 13],
    khalis: [9],
    isPro: false,
  );
  
  static const Taal jhaptaal = Taal(
    name: 'Jhaptaal',
    nameHindi: 'झपताल',
    matras: 10,
    vibhags: [2, 3, 2, 3],
    bols: ['धी', 'ना', 'धी', 'धी', 'ना', 'ती', 'ना', 'धी', 'धी', 'ना'],
    theka: 'धी ना | धी धी ना | ती ना | धी धी ना',
    talis: [1, 3, 8],
    khalis: [6],
    isPro: false,
  );
  
  static const Taal ektaal = Taal(
    name: 'Ektaal',
    nameHindi: 'एकताल',
    matras: 12,
    vibhags: [2, 2, 2, 2, 2, 2],
    bols: ['धिं', 'धिं', 'धागे', 'तिरकिट', 'तू', 'ना', 
           'कत', 'ता', 'धागे', 'तिरकिट', 'धी', 'ना'],
    theka: 'धिं धिं | धागे तिरकिट | तू ना | कत ता | धागे तिरकिट | धी ना',
    talis: [1, 3, 7, 11],
    khalis: [5, 9],
    isPro: true,
  );
  
  static const Taal rupak = Taal(
    name: 'Rupak',
    nameHindi: 'रूपक',
    matras: 7,
    vibhags: [3, 2, 2],
    bols: ['ती', 'ती', 'ना', 'धी', 'ना', 'धी', 'ना'],
    theka: 'ती ती ना | धी ना | धी ना',
    talis: [4, 6],
    khalis: [1],
    isPro: false,
  );
  
  static const Taal keherwa = Taal(
    name: 'Keherwa',
    nameHindi: 'कहरवा',
    matras: 8,
    vibhags: [4, 4],
    bols: ['धा', 'गे', 'ना', 'ती', 'ना', 'क', 'धी', 'ना'],
    theka: 'धा गे ना ती | ना क धी ना',
    talis: [1],
    khalis: [5],
    isPro: false,
  );
  
  static const Taal dadra = Taal(
    name: 'Dadra',
    nameHindi: 'दादरा',
    matras: 6,
    vibhags: [3, 3],
    bols: ['धा', 'धी', 'ना', 'ना', 'ती', 'ना'],
    theka: 'धा धी ना | ना ती ना',
    talis: [1],
    khalis: [4],
    isPro: false,
  );
  
  static const Taal deepchandi = Taal(
    name: 'Deepchandi',
    nameHindi: 'दीपचंदी',
    matras: 14,
    vibhags: [3, 4, 3, 4],
    bols: ['धा', 'धी', 'ना', 'धा', 'गे', 'तिरकिट', 'ना',
           'ता', 'ती', 'ना', 'धा', 'गे', 'तिरकिट', 'ना'],
    theka: 'धा धी ना | धा गे तिरकिट ना | ता ती ना | धा गे तिरकिट ना',
    talis: [1, 4, 11],
    khalis: [8],
    isPro: true,
  );
  
  static const Taal tilwada = Taal(
    name: 'Tilwada',
    nameHindi: 'तिलवाड़ा',
    matras: 16,
    vibhags: [4, 4, 4, 4],
    bols: ['धा', 'तिरकिट', 'धी', 'ना', 'धा', 'ना', 'तिं', 'ना',
           'ता', 'तिरकिट', 'धी', 'ना', 'धा', 'धी', 'ना', 'धा'],
    theka: 'धा तिरकिट धी ना | धा ना तिं ना | ता तिरकिट धी ना | धा धी ना धा',
    talis: [1, 5, 13],
    khalis: [9],
    isPro: true,
  );
  
  static List<Taal> get all => [
    teentaal,
    jhaptaal,
    ektaal,
    rupak,
    keherwa,
    dadra,
    deepchandi,
    tilwada,
  ];
  
  static List<Taal> get free => all.where((t) => !t.isPro).toList();
  static List<Taal> get pro => all.where((t) => t.isPro).toList();
}

// ============================================
// TANPURA CONFIGURATIONS
// ============================================

/// Tanpura string configuration
enum TanpuraStrings {
  paSaSaSa,    // Pa-Sa-Sa-Sa (Most common)
  maSaSaSa,    // Ma-Sa-Sa-Sa (For Ragas with komal Pa)
  niSaSaSa,    // Ni-Sa-Sa-Sa (Less common)
}

extension TanpuraStringsExtension on TanpuraStrings {
  String get name {
    switch (this) {
      case TanpuraStrings.paSaSaSa: return 'Pa-Sa-Sa-Sa';
      case TanpuraStrings.maSaSaSa: return 'Ma-Sa-Sa-Sa';
      case TanpuraStrings.niSaSaSa: return 'Ni-Sa-Sa-Sa';
    }
  }
  
  String get hindi {
    switch (this) {
      case TanpuraStrings.paSaSaSa: return 'प-सा-सा-सा';
      case TanpuraStrings.maSaSaSa: return 'म-सा-सा-सा';
      case TanpuraStrings.niSaSaSa: return 'नि-सा-सा-सा';
    }
  }
  
  List<int> get intervals {
    switch (this) {
      case TanpuraStrings.paSaSaSa: return [7, 0, 0, -12]; // Pa, Sa, Sa, Sa(low)
      case TanpuraStrings.maSaSaSa: return [5, 0, 0, -12]; // Ma, Sa, Sa, Sa(low)
      case TanpuraStrings.niSaSaSa: return [11, 0, 0, -12]; // Ni, Sa, Sa, Sa(low)
    }
  }
}

// ============================================
// TEMPO CONSTANTS
// ============================================

class TempoConstants {
  TempoConstants._();
  
  static const int minBPM = 30;
  static const int maxBPM = 300;
  
  // Laya (Speed) classifications
  static const int vilambitMin = 30;   // Slow
  static const int vilambitMax = 60;
  static const int madhyaMin = 61;     // Medium
  static const int madhyaMax = 120;
  static const int drut = 121;         // Fast
  static const int atiDrut = 180;      // Very fast
  
  static String getLayaName(int bpm) {
    if (bpm <= vilambitMax) return 'Vilambit (विलम्बित)';
    if (bpm <= madhyaMax) return 'Madhya (मध्य)';
    if (bpm < atiDrut) return 'Drut (द्रुत)';
    return 'Ati-Drut (अति-द्रुत)';
  }
}

// ============================================
// PRACTICE DEFAULTS (Single source of truth)
// ============================================

/// All default practice settings live here.
/// Every provider, model, and UI widget must reference these
/// instead of hardcoding values.
class PracticeDefaults {
  PracticeDefaults._();

  static const RootKey key = RootKey.Db;
  static const int tempo = 90;
  static const int minTempo = 30;
  static const int maxTempo = 200;
  static const Saptak saptak = Saptak.madhya;

  static const double tanpuraVolume = 0.25;
  static const double tablaVolume = 0.25;
  static const bool tanpuraEnabled = true;
  static const bool tablaEnabled = true;
  static const String tanpuraPattern = 'PaSa';

  static const int countInAvartans = 1;
  static const int demoAvartans = 1;
  static const int practiceAvartans = 2;
  static const int swarPerMatra = 1;

  static const String recommendedSaptak = 'MADHYA';

  /// C#4 frequency in Hz — must match [key].frequency
  static const double baseSaFreq = 277.18;
}


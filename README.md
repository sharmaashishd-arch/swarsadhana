# SwarSadhana (स्वर साधना)

Professional Indian Classical Music Accompaniment App for Web, iOS, and Android.

![Flutter](https://img.shields.io/badge/Flutter-3.0+-blue.svg)
![Web](https://img.shields.io/badge/Web-Audio%20API-orange.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Overview

SwarSadhana is a professional-grade music accompaniment app designed for Indian Classical Music practice (Hindustani & Carnatic). The web version uses real-time audio synthesis via Web Audio API, while the mobile apps use high-quality audio samples with DSP processing.

### Key Features

- 🎵 **Tanpura** - Dual tanpura tracks with Pa-Sa, Ma-Sa, Ni-Sa configurations
  - Authentic Jivari (buzz) effect with adjustable intensity
  - Fine-tuning control in cents
- 🥁 **Tabla** - Multiple Taals (Teentaal, Jhaptaal, Ektaal, Rupak, Keherwa, Dadra)
  - Real-time beat visualization with Sam/Tali/Khali markers
  - Bol display in Devanagari script
  - Laya indicators (Vilambit/Madhya/Drut)
- 🕉️ **Sadhana** -  practice system
  - Structured exercise library (Sargam, Janti, Alankar)
  - Robot Player: Auto-play exercises with tanpura + tabla + swar

### Audio Capabilities

- **Real-time synthesis** - Tanpura and Tabla sounds generated using Web Audio API oscillators
- **Authentic Jivari effect** - LFO modulation and harmonic layering for characteristic tanpura buzz
- **Zero-latency looping** for percussion
- **Time-stretching** - Change tempo without changing pitch
- **Pitch-shifting** - Change key without changing tempo (all 12 keys supported)
- **Real-time mixing** with independent volume controls

## Architecture

### Web Version
```
web/
├── index.html          # Main app UI with embedded audio engine
├── app.js              # Application logic & state management
├── audio-engine.js     # Web Audio API synthesis engine
└── styles.css          # Modern responsive styling
```

### Flutter Version (iOS/Android)
```
lib/
├── core/
│   ├── audio/          # Audio engine with SoLoud integration
│   ├── constants/      # Indian music constants (Swaras, Taals)
│   ├── theme/          # Traditional Indian UI theme
│   └── utils/          # Utility functions
├── features/
│   ├── tanpura/        # Tanpura instrument module
│   ├── tabla/          # Tabla instrument module
│   ├── swarmandal/     # Swarmandal module
│   ├── harmonium/      # Harmonium/Lehra module
│   ├── pitch_monitor/  # Voice tuning module
│   ├── presets/        # Preset management
│   └── settings/       # App settings
├── screens/            # Main app screens
├── shared/
│   └── widgets/        # Reusable UI components
└── services/           # Backend services
```

## Getting Started

### Web Version (Quickest)

No installation required! The web version uses synthesized audio via Web Audio API.

1. Clone the repository:
```bash
git clone https://github.com/yourusername/swarsadhana.git
cd swarsadhana
```

2. Start a local server:
```bash
cd web && python3 -m http.server 8080
```

3. Open http://localhost:8080 in your browser

### Flutter Version (iOS/Android)

#### Prerequisites

- Flutter SDK 3.0+
- Xcode (for iOS)
- Android Studio (for Android)

#### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/swarsadhana.git
cd swarsadhana
```

2. Install dependencies:
```bash
flutter pub get
```

3. Add audio assets to `assets/audio/`:
   - `tanpura/tanpura_pa_sa.wav`
   - `tanpura/tanpura_ma_sa.wav`
   - `tanpura/tanpura_ni_sa.wav`
   - `tabla/teentaal_60bpm.wav`
   - `tabla/jhaptaal_60bpm.wav`
   - etc.

4. Run the app:
```bash
flutter run
```

## Audio Assets (Flutter Version Only)

The web version uses synthesized audio and doesn't require audio files. For the Flutter version, audio samples should be:
- Format: WAV or MP3
- Sample Rate: 44100 Hz or 48000 Hz
- Recorded at 60 BPM (for Tabla) - will be time-stretched dynamically
- Recorded in key of C - will be pitch-shifted dynamically

## Monetization

### Free Features
- Basic Tanpura (1 track)
- Teentaal, Keherwa, Dadra

### Pro Features (Subscription)
- Dual Tanpura
- All Taals (Jhaptaal, Ektaal, Rupak, Deepchandi, Tilwada)
- Swarmandal
- Harmonium/Lehra
- Pitch Monitor
- Recording



## Indian Music Theory

### Swaras (Notes)
| Swara | Western | Hindi |
|-------|---------|-------|
| Sa | C | सा |
| Re (komal) | Db | रे॒ |
| Re | D | रे |
| Ga (komal) | Eb | ग॒ |
| Ga | E | ग |
| Ma | F | म |
| Ma (tivra) | F# | म॑ |
| Pa | G | प |
| Dha (komal) | Ab | ध॒ |
| Dha | A | ध |
| Ni (komal) | Bb | नि॒ |
| Ni | B | नि |

### Taals (Rhythmic Cycles)
- **Teentaal** - 16 beats (4+4+4+4)
- **Jhaptaal** - 10 beats (2+3+2+3)
- **Ektaal** - 12 beats (2+2+2+2+2+2)
- **Rupak** - 7 beats (3+2+2)
- **Keherwa** - 8 beats (4+4)
- **Dadra** - 6 beats (3+3)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
- Indian classical music theory resources from NCERT and Sangeet Natak Akademi




import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:audio_session/audio_session.dart';
import 'package:flutter_soloud/flutter_soloud.dart';

import 'core/audio/audio_engine.dart';
import 'core/audio/swar_player.dart';
import 'features/tanpura/providers/tanpura_provider.dart';
import 'features/tabla/providers/tabla_provider.dart';
import 'features/swarmandal/providers/swarmandal_provider.dart';
import 'features/presets/providers/preset_provider.dart';
import 'features/settings/providers/settings_provider.dart';
import 'features/pitch_monitor/providers/pitch_monitor_provider.dart';
import 'features/robot_riyaaz/providers/robot_riyaaz_provider.dart';
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Hive for local storage
  await Hive.initFlutter();
  
  // Lock orientation to portrait for consistent UI
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF1A0F0A),
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  
  // Configure audio session for music playback
  final session = await AudioSession.instance;
  await session.configure(const AudioSessionConfiguration(
    avAudioSessionCategory: AVAudioSessionCategory.playback,
    avAudioSessionCategoryOptions: AVAudioSessionCategoryOptions.mixWithOthers,
    avAudioSessionMode: AVAudioSessionMode.defaultMode,
    androidAudioAttributes: AndroidAudioAttributes(
      contentType: AndroidAudioContentType.music,
      usage: AndroidAudioUsage.media,
    ),
    androidAudioFocusGainType: AndroidAudioFocusGainType.gain,
  ));
  
  // Initialize the core audio engine
  final audioEngine = AudioEngine();
  await audioEngine.initialize();
  
  // Initialize the SwarPlayer (harmonium SF2 for swara demos)
  final swarPlayer = SwarPlayer(SoLoud.instance);
  await swarPlayer.initialize();
  
  runApp(
    MultiProvider(
      providers: [
        // Core Audio Engine - Singleton
        Provider<AudioEngine>.value(value: audioEngine),
        Provider<SwarPlayer>.value(value: swarPlayer),
        
        // Settings Provider
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
        
        // Instrument Providers
        ChangeNotifierProxyProvider<AudioEngine, TanpuraProvider>(
          create: (context) => TanpuraProvider(audioEngine),
          update: (_, engine, provider) => provider!..updateEngine(engine),
        ),
        ChangeNotifierProxyProvider<AudioEngine, TablaProvider>(
          create: (context) => TablaProvider(audioEngine),
          update: (_, engine, provider) => provider!..updateEngine(engine),
        ),
        ChangeNotifierProxyProvider<AudioEngine, SwarmandalProvider>(
          create: (context) => SwarmandalProvider(audioEngine),
          update: (_, engine, provider) => provider!..updateEngine(engine),
        ),
        
        // Sadhana / Guruji
        ChangeNotifierProxyProvider2<TanpuraProvider, TablaProvider,
            RobotRiyaazProvider>(
          create: (context) {
            final tanpura = context.read<TanpuraProvider>();
            final tabla = context.read<TablaProvider>();
            return RobotRiyaazProvider(swarPlayer, tanpura, tabla);
          },
          update: (_, tanpura, tabla, provider) => provider!,
        ),
        
        // Utility Providers
        ChangeNotifierProvider(create: (_) => PresetProvider()),
        ChangeNotifierProvider(create: (_) => PitchMonitorProvider()),
      ],
      child: const SwarSadhanaApp(),
    ),
  );
}


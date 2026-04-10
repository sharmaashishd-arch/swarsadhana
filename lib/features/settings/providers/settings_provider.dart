import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Provider for app settings
class SettingsProvider extends ChangeNotifier {
  static const String _keyLanguage = 'language';
  static const String _keyBufferSize = 'buffer_size';
  static const String _keyBackgroundPlay = 'background_play';
  static const String _keyIsPro = 'is_pro';
  static const String _keyShowHints = 'show_hints';
  static const String _keySwarNotation = 'swar_notation';

  String _language = 'en';
  int _bufferSize = 256; // Audio buffer size
  bool _backgroundPlay = true;
  bool _isPro = false;
  bool _showHints = true;
  String _swarNotation = 'hindi'; // 'hindi' or 'english'
  
  SettingsProvider() {
    _loadSettings();
  }

  // Getters
  String get language => _language;
  int get bufferSize => _bufferSize;
  bool get backgroundPlay => _backgroundPlay;
  bool get isPro => _isPro;
  bool get showHints => _showHints;
  String get swarNotation => _swarNotation;
  bool get useEnglishNotation => _swarNotation == 'english';

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    
    _language = prefs.getString(_keyLanguage) ?? 'en';
    _bufferSize = prefs.getInt(_keyBufferSize) ?? 256;
    _backgroundPlay = prefs.getBool(_keyBackgroundPlay) ?? true;
    _isPro = prefs.getBool(_keyIsPro) ?? false;
    _showHints = prefs.getBool(_keyShowHints) ?? true;
    _swarNotation = prefs.getString(_keySwarNotation) ?? 'hindi';

    notifyListeners();
  }

  Future<void> setLanguage(String lang) async {
    _language = lang;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyLanguage, lang);
    notifyListeners();
  }

  Future<void> setBufferSize(int size) async {
    _bufferSize = size;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_keyBufferSize, size);
    notifyListeners();
  }

  Future<void> setBackgroundPlay(bool enabled) async {
    _backgroundPlay = enabled;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyBackgroundPlay, enabled);
    notifyListeners();
  }

  Future<void> setPro(bool isPro) async {
    _isPro = isPro;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyIsPro, isPro);
    notifyListeners();
  }

  Future<void> setShowHints(bool show) async {
    _showHints = show;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyShowHints, show);
    notifyListeners();
  }

  Future<void> setSwarNotation(String notation) async {
    _swarNotation = notation;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keySwarNotation, notation);
    notifyListeners();
  }

  /// Reset all settings to defaults
  Future<void> resetSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    
    _language = 'en';
    _bufferSize = 256;
    _backgroundPlay = true;
    _showHints = true;
    _swarNotation = 'hindi';
    // Don't reset isPro
    
    notifyListeners();
  }
}


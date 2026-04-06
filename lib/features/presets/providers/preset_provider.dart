import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../../../core/constants/music_constants.dart';

/// A saved preset configuration
class Preset {
  final String id;
  final String name;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  // Global settings
  final RootKey rootKey;
  final int tempo;
  
  // Tanpura settings
  final bool tanpura1Enabled;
  final bool tanpura2Enabled;
  final double tanpura1Volume;
  final double tanpura2Volume;
  final TanpuraStrings tanpura1Strings;
  final TanpuraStrings tanpura2Strings;
  final int tanpura1FineTune;
  final int tanpura2FineTune;
  
  // Tabla settings
  final bool tablaEnabled;
  final String taalName;
  final double tablaVolume;
  
  // Swarmandal settings
  final bool swarmandalEnabled;
  final double swarmandalVolume;

  Preset({
    required this.id,
    required this.name,
    required this.createdAt,
    required this.updatedAt,
    this.rootKey = PracticeDefaults.key,
    this.tempo = PracticeDefaults.tempo,
    this.tanpura1Enabled = PracticeDefaults.tanpuraEnabled,
    this.tanpura2Enabled = false,
    this.tanpura1Volume = PracticeDefaults.tanpuraVolume,
    this.tanpura2Volume = PracticeDefaults.tanpuraVolume,
    this.tanpura1Strings = TanpuraStrings.paSaSaSa,
    this.tanpura2Strings = TanpuraStrings.paSaSaSa,
    this.tanpura1FineTune = 0,
    this.tanpura2FineTune = 0,
    this.tablaEnabled = false,
    this.taalName = 'Teentaal',
    this.tablaVolume = PracticeDefaults.tablaVolume,
    this.swarmandalEnabled = false,
    this.swarmandalVolume = 0.6,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
    'rootKey': rootKey.index,
    'tempo': tempo,
    'tanpura1Enabled': tanpura1Enabled,
    'tanpura2Enabled': tanpura2Enabled,
    'tanpura1Volume': tanpura1Volume,
    'tanpura2Volume': tanpura2Volume,
    'tanpura1Strings': tanpura1Strings.index,
    'tanpura2Strings': tanpura2Strings.index,
    'tanpura1FineTune': tanpura1FineTune,
    'tanpura2FineTune': tanpura2FineTune,
    'tablaEnabled': tablaEnabled,
    'taalName': taalName,
    'tablaVolume': tablaVolume,
    'swarmandalEnabled': swarmandalEnabled,
    'swarmandalVolume': swarmandalVolume,
  };

  factory Preset.fromJson(Map<String, dynamic> json) => Preset(
    id: json['id'],
    name: json['name'],
    createdAt: DateTime.parse(json['createdAt']),
    updatedAt: DateTime.parse(json['updatedAt']),
    rootKey: RootKey.values[json['rootKey']],
    tempo: json['tempo'],
    tanpura1Enabled: json['tanpura1Enabled'],
    tanpura2Enabled: json['tanpura2Enabled'],
    tanpura1Volume: json['tanpura1Volume'],
    tanpura2Volume: json['tanpura2Volume'],
    tanpura1Strings: TanpuraStrings.values[json['tanpura1Strings']],
    tanpura2Strings: TanpuraStrings.values[json['tanpura2Strings']],
    tanpura1FineTune: json['tanpura1FineTune'],
    tanpura2FineTune: json['tanpura2FineTune'],
    tablaEnabled: json['tablaEnabled'],
    taalName: json['taalName'],
    tablaVolume: json['tablaVolume'],
    swarmandalEnabled: json['swarmandalEnabled'],
    swarmandalVolume: json['swarmandalVolume'],
  );

  Preset copyWith({
    String? name,
    RootKey? rootKey,
    int? tempo,
    bool? tanpura1Enabled,
    bool? tanpura2Enabled,
    double? tanpura1Volume,
    double? tanpura2Volume,
    TanpuraStrings? tanpura1Strings,
    TanpuraStrings? tanpura2Strings,
    int? tanpura1FineTune,
    int? tanpura2FineTune,
    bool? tablaEnabled,
    String? taalName,
    double? tablaVolume,
    bool? swarmandalEnabled,
    double? swarmandalVolume,
  }) {
    return Preset(
      id: id,
      name: name ?? this.name,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
      rootKey: rootKey ?? this.rootKey,
      tempo: tempo ?? this.tempo,
      tanpura1Enabled: tanpura1Enabled ?? this.tanpura1Enabled,
      tanpura2Enabled: tanpura2Enabled ?? this.tanpura2Enabled,
      tanpura1Volume: tanpura1Volume ?? this.tanpura1Volume,
      tanpura2Volume: tanpura2Volume ?? this.tanpura2Volume,
      tanpura1Strings: tanpura1Strings ?? this.tanpura1Strings,
      tanpura2Strings: tanpura2Strings ?? this.tanpura2Strings,
      tanpura1FineTune: tanpura1FineTune ?? this.tanpura1FineTune,
      tanpura2FineTune: tanpura2FineTune ?? this.tanpura2FineTune,
      tablaEnabled: tablaEnabled ?? this.tablaEnabled,
      taalName: taalName ?? this.taalName,
      tablaVolume: tablaVolume ?? this.tablaVolume,
      swarmandalEnabled: swarmandalEnabled ?? this.swarmandalEnabled,
      swarmandalVolume: swarmandalVolume ?? this.swarmandalVolume,
    );
  }
}

/// Provider for managing presets
class PresetProvider extends ChangeNotifier {
  static const String _storageKey = 'presets';
  static const _uuid = Uuid();
  
  List<Preset> _presets = [];
  Preset? _activePreset;
  bool _isLoaded = false;

  List<Preset> get presets => List.unmodifiable(_presets);
  Preset? get activePreset => _activePreset;
  bool get isLoaded => _isLoaded;

  PresetProvider() {
    _loadPresets();
  }

  Future<void> _loadPresets() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonString = prefs.getString(_storageKey);
    
    if (jsonString != null) {
      final List<dynamic> jsonList = json.decode(jsonString);
      _presets = jsonList.map((j) => Preset.fromJson(j)).toList();
    }
    
    _isLoaded = true;
    notifyListeners();
  }

  Future<void> _savePresets() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonString = json.encode(_presets.map((p) => p.toJson()).toList());
    await prefs.setString(_storageKey, jsonString);
  }

  /// Create a new preset
  Future<Preset> createPreset({
    required String name,
    RootKey rootKey = RootKey.C,
    int tempo = 60,
  }) async {
    final preset = Preset(
      id: _uuid.v4(),
      name: name,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      rootKey: rootKey,
      tempo: tempo,
    );
    
    _presets.add(preset);
    await _savePresets();
    notifyListeners();
    
    return preset;
  }

  /// Update a preset
  Future<void> updatePreset(Preset preset) async {
    final index = _presets.indexWhere((p) => p.id == preset.id);
    if (index != -1) {
      _presets[index] = preset;
      if (_activePreset?.id == preset.id) {
        _activePreset = preset;
      }
      await _savePresets();
      notifyListeners();
    }
  }

  /// Delete a preset
  Future<void> deletePreset(String id) async {
    _presets.removeWhere((p) => p.id == id);
    if (_activePreset?.id == id) {
      _activePreset = null;
    }
    await _savePresets();
    notifyListeners();
  }

  /// Load a preset as active
  void loadPreset(Preset preset) {
    _activePreset = preset;
    notifyListeners();
  }

  /// Clear active preset
  void clearActivePreset() {
    _activePreset = null;
    notifyListeners();
  }

  /// Get default presets
  List<Preset> get defaultPresets => [
    Preset(
      id: 'default_1',
      name: 'Basic Tanpura',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      rootKey: PracticeDefaults.key,
      tanpura1Enabled: PracticeDefaults.tanpuraEnabled,
    ),
    Preset(
      id: 'default_2',
      name: 'Teentaal Practice',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      rootKey: PracticeDefaults.key,
      tanpura1Enabled: PracticeDefaults.tanpuraEnabled,
      tablaEnabled: true,
      taalName: 'Teentaal',
    ),
  ];
}


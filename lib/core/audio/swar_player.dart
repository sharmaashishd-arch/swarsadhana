import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_soloud/flutter_soloud.dart';
import 'package:dart_melty_soundfont/dart_melty_soundfont.dart';

import '../constants/music_constants.dart';

/// Plays individual swar notes using the FluidR3 GM Accordion SoundFont (SF2).
///
/// Pre-renders all swar notes at initialization for instant triggered playback.
/// Renders at 48 kHz / 32-bit float for quality parity with the web engine.
/// Uses dart_melty_soundfont for SF2 synthesis and flutter_soloud for output.
class SwarPlayer {
  static const String _sf2Asset = 'assets/soundfonts/accordion_fluidr3.sf2';
  static const int _sampleRate = 48000;
  static const double _maxNoteDuration = 2.0;
  static const int _velocity = 100;
  static const int _channels = 2;

  /// Exposed for tests.
  static int get channelCount => _channels;
  static int get sampleRateHz => _sampleRate;

  final SoLoud _soLoud;
  Synthesizer? _synth;
  RootKey _currentKey = PracticeDefaults.key;
  int _saptakShift = 0;

  final Map<String, AudioSource> _noteCache = {};
  bool _isInitialized = false;

  /// Swar name → semitone offset from Sa.
  /// Matches the exercise JSON "swaras" definitions.
  static const Map<String, int> swarSemitones = {
    'Sa.': -12,
    'Sa': 0,
    're': 1,
    'Re': 2,
    'ga': 3,
    'Ga': 4,
    'Ma': 5,
    'ma': 6,
    'Pa': 7,
    'dha': 8,
    'Dha': 9,
    'ni': 10,
    'Ni': 11,
    '.Sa': 12,
    '.Re': 14,
    '.Ga': 16,
    '.Ma': 17,
    '.Pa': 19,
    '.Dha': 21,
    '.Ni': 23,
  };

  SwarPlayer(this._soLoud);

  bool get isInitialized => _isInitialized;

  /// Load the SF2 and pre-render all swar notes for the current key.
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      final bytes = await rootBundle.load(_sf2Asset);
      _synth = Synthesizer.loadByteData(
        bytes,
        SynthesizerSettings(
          sampleRate: _sampleRate,
          blockSize: 64,
          maximumPolyphony: 8,
          enableReverbAndChorus: true,
        ),
      );

      _synth!.selectPreset(channel: 0, preset: 0);
      await _prerenderAllNotes();
      _isInitialized = true;
      debugPrint('SwarPlayer initialized with ${_noteCache.length} notes');
    } catch (e) {
      debugPrint('SwarPlayer initialization failed: $e');
      rethrow;
    }
  }

  /// Change the key and re-render all cached notes.
  Future<void> setKey(RootKey key) async {
    if (_currentKey == key) return;
    _currentKey = key;
    if (_isInitialized) {
      await _disposeCache();
      await _prerenderAllNotes();
    }
  }

  /// Set saptak shift in semitones (-12, 0, +12) and re-render.
  Future<void> setSaptak(int semitoneShift) async {
    if (_saptakShift == semitoneShift) return;
    _saptakShift = semitoneShift;
    if (_isInitialized) {
      await _disposeCache();
      await _prerenderAllNotes();
    }
  }

  int get saptakShift => _saptakShift;

  static const int _releaseMs = 50;

  /// Play a pre-rendered swar note. Stops after [durationSec] seconds.
  Future<SoundHandle?> playNote(String swarName, {double? durationSec}) async {
    if (!_isInitialized) return null;
    if (swarName == '-') return null;

    final source = _noteCache[swarName];
    if (source == null) {
      debugPrint('SwarPlayer: no cached note for "$swarName"');
      return null;
    }

    final handle = await _soLoud.play(source, volume: 1.0);

    if (durationSec != null && durationSec < _maxNoteDuration) {
      final fadeStart = ((durationSec * 1000) - _releaseMs).round().clamp(0, 60000);
      Future.delayed(Duration(milliseconds: fadeStart), () {
        try {
          _soLoud.fadeVolume(
            handle,
            0,
            const Duration(milliseconds: _releaseMs),
          );
          _soLoud.scheduleStop(
            handle,
            const Duration(milliseconds: _releaseMs),
          );
        } catch (_) {}
      });
    }

    return handle;
  }

  /// Stop a playing note handle with a smooth fade-out.
  void stopNote(SoundHandle handle) {
    try {
      _soLoud.fadeVolume(
        handle,
        0,
        const Duration(milliseconds: _releaseMs),
      );
      _soLoud.scheduleStop(
        handle,
        const Duration(milliseconds: _releaseMs),
      );
    } catch (_) {}
  }

  Future<void> dispose() async {
    await _disposeCache();
    _synth = null;
    _isInitialized = false;
  }

  /// MIDI note for a given swar name at the current key + saptak.
  /// Sa at key C, Madhya saptak = MIDI 60 (C4).
  /// Sa at key C, Mandra saptak = MIDI 48 (C3).
  /// Sa at key C, Taar saptak = MIDI 72 (C5).
  int swarToMidi(String swarName) {
    final baseMidi = 60 + _currentKey.index;
    final offset = swarSemitones[swarName] ?? 0;
    return baseMidi + offset + _saptakShift;
  }

  Future<void> _prerenderAllNotes() async {
    for (final entry in swarSemitones.entries) {
      final swarName = entry.key;
      final midiNote = swarToMidi(swarName);
      final wavBytes = _renderNoteToWav(midiNote, _maxNoteDuration);
      final source = await _soLoud.loadMem(
        'swar_${swarName}_${_currentKey.index}.wav',
        wavBytes,
      );
      _noteCache[swarName] = source;
    }
  }

  Uint8List _renderNoteToWav(int midiNote, double durationSec) {
    final synth = _synth!;
    final totalFrames = (_sampleRate * durationSec).toInt();

    final attackFrames = (totalFrames * 0.8).toInt();

    synth.noteOffAll();
    synth.noteOn(channel: 0, key: midiNote, velocity: _velocity);

    // Stereo interleaved Float32: L0 R0 L1 R1 …
    final allSamples = Float32List(totalFrames * _channels);

    int rendered = 0;
    while (rendered < attackFrames) {
      final chunkSize = (attackFrames - rendered).clamp(0, 512);
      if (chunkSize <= 0) break;
      final buf = Float32List(chunkSize * _channels);
      synth.renderInterleaved(buf);
      allSamples.setRange(
        rendered * _channels,
        rendered * _channels + chunkSize * _channels,
        buf,
      );
      rendered += chunkSize;
    }

    synth.noteOff(channel: 0, key: midiNote);

    while (rendered < totalFrames) {
      final chunkSize = (totalFrames - rendered).clamp(0, 512);
      if (chunkSize <= 0) break;
      final buf = Float32List(chunkSize * _channels);
      synth.renderInterleaved(buf);
      allSamples.setRange(
        rendered * _channels,
        rendered * _channels + chunkSize * _channels,
        buf,
      );
      rendered += chunkSize;
    }

    return float32ToWav(allSamples, _sampleRate, _channels);
  }

  /// Wrap IEEE Float32 PCM samples into a valid WAV byte buffer (format 3).
  @visibleForTesting
  static Uint8List float32ToWav(Float32List samples, int sampleRate, int channels) {
    const bytesPerSample = 4;
    final dataSize = samples.length * bytesPerSample;
    final fileSize = 36 + dataSize;
    final buffer = ByteData(44 + dataSize);

    void writeAscii(int offset, String s) {
      for (int i = 0; i < s.length; i++) {
        buffer.setUint8(offset + i, s.codeUnitAt(i));
      }
    }

    // RIFF header
    writeAscii(0, 'RIFF');
    buffer.setUint32(4, fileSize, Endian.little);
    writeAscii(8, 'WAVE');

    // fmt chunk
    writeAscii(12, 'fmt ');
    buffer.setUint32(16, 16, Endian.little);
    buffer.setUint16(20, 3, Endian.little); // IEEE float format
    buffer.setUint16(22, channels, Endian.little);
    buffer.setUint32(24, sampleRate, Endian.little);
    buffer.setUint32(28, sampleRate * channels * bytesPerSample, Endian.little);
    buffer.setUint16(32, channels * bytesPerSample, Endian.little);
    buffer.setUint16(34, 32, Endian.little);

    // data chunk
    writeAscii(36, 'data');
    buffer.setUint32(40, dataSize, Endian.little);

    for (int i = 0; i < samples.length; i++) {
      buffer.setFloat32(44 + i * bytesPerSample, samples[i], Endian.little);
    }

    return buffer.buffer.asUint8List();
  }

  /// Legacy Int16 WAV encoder — kept for backward compatibility / testing.
  @visibleForTesting
  static Uint8List int16ToWav(Int16List samples, int sampleRate, int channels) {
    final dataSize = samples.length * 2;
    final fileSize = 36 + dataSize;
    final buffer = ByteData(44 + dataSize);

    void writeAscii(int offset, String s) {
      for (int i = 0; i < s.length; i++) {
        buffer.setUint8(offset + i, s.codeUnitAt(i));
      }
    }

    writeAscii(0, 'RIFF');
    buffer.setUint32(4, fileSize, Endian.little);
    writeAscii(8, 'WAVE');

    writeAscii(12, 'fmt ');
    buffer.setUint32(16, 16, Endian.little);
    buffer.setUint16(20, 1, Endian.little); // PCM format
    buffer.setUint16(22, channels, Endian.little);
    buffer.setUint32(24, sampleRate, Endian.little);
    buffer.setUint32(28, sampleRate * channels * 2, Endian.little);
    buffer.setUint16(32, channels * 2, Endian.little);
    buffer.setUint16(34, 16, Endian.little);

    writeAscii(36, 'data');
    buffer.setUint32(40, dataSize, Endian.little);

    for (int i = 0; i < samples.length; i++) {
      buffer.setInt16(44 + i * 2, samples[i], Endian.little);
    }

    return buffer.buffer.asUint8List();
  }

  Future<void> _disposeCache() async {
    for (final source in _noteCache.values) {
      try {
        await _soLoud.disposeSource(source);
      } catch (_) {}
    }
    _noteCache.clear();
  }
}

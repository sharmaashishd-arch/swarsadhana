import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:swarsadhana/core/audio/swar_player.dart';

void main() {
  group('SwarPlayer Float32 WAV rendering', () {
    test('float32ToWav produces valid IEEE float stereo WAV header', () {
      const sampleRate = 48000;
      const channels = 2;
      const frames = 100;
      final samples = Float32List(frames * channels);
      for (int i = 0; i < samples.length; i++) {
        samples[i] = (i % 1000) / 1000.0 - 0.5;
      }

      final wav = SwarPlayer.float32ToWav(samples, sampleRate, channels);

      expect(String.fromCharCodes(wav.sublist(0, 4)), 'RIFF');
      expect(String.fromCharCodes(wav.sublist(8, 12)), 'WAVE');

      final byteData = ByteData.sublistView(wav);
      final fmtFormat = byteData.getUint16(20, Endian.little);
      final fmtChannels = byteData.getUint16(22, Endian.little);
      final fmtSampleRate = byteData.getUint32(24, Endian.little);
      final byteRate = byteData.getUint32(28, Endian.little);
      final blockAlign = byteData.getUint16(32, Endian.little);
      final bitsPerSample = byteData.getUint16(34, Endian.little);

      expect(fmtFormat, 3, reason: 'IEEE float format code');
      expect(fmtChannels, channels);
      expect(fmtSampleRate, sampleRate);
      expect(byteRate, sampleRate * channels * 4);
      expect(blockAlign, channels * 4);
      expect(bitsPerSample, 32);

      final dataSize = byteData.getUint32(40, Endian.little);
      expect(dataSize, frames * channels * 4);
    });

    test('float32ToWav round-trips sample values', () {
      const sampleRate = 48000;
      const channels = 2;
      final samples = Float32List.fromList([0.0, 1.0, -1.0, 0.5]);

      final wav = SwarPlayer.float32ToWav(samples, sampleRate, channels);
      final byteData = ByteData.sublistView(wav);

      for (int i = 0; i < samples.length; i++) {
        final recovered = byteData.getFloat32(44 + i * 4, Endian.little);
        expect(recovered, samples[i], reason: 'sample[$i]');
      }
    });

    test('float32ToWav total file size is correct', () {
      const frames = 200;
      const channels = 2;
      final samples = Float32List(frames * channels);
      final wav = SwarPlayer.float32ToWav(samples, 48000, channels);
      // 44 header + frames * channels * 4 data
      expect(wav.length, 44 + frames * channels * 4);
    });
  });

  group('Legacy int16ToWav (backward compat)', () {
    test('int16ToWav produces valid PCM stereo WAV header', () {
      const sampleRate = 44100;
      const channels = 2;
      const frames = 100;
      final samples = Int16List(frames * channels);
      for (int i = 0; i < samples.length; i++) {
        samples[i] = (i % 1000) - 500;
      }

      final wav = SwarPlayer.int16ToWav(samples, sampleRate, channels);

      expect(String.fromCharCodes(wav.sublist(0, 4)), 'RIFF');
      expect(String.fromCharCodes(wav.sublist(8, 12)), 'WAVE');

      final byteData = ByteData.sublistView(wav);
      expect(byteData.getUint16(20, Endian.little), 1, reason: 'PCM format');
      expect(byteData.getUint16(22, Endian.little), channels);
      expect(byteData.getUint32(24, Endian.little), sampleRate);
      expect(byteData.getUint32(28, Endian.little), sampleRate * channels * 2);
      expect(byteData.getUint16(32, Endian.little), channels * 2);
      expect(byteData.getUint16(34, Endian.little), 16);

      final dataSize = byteData.getUint32(40, Endian.little);
      expect(dataSize, frames * channels * 2);
    });
  });

  group('Audio quality constants', () {
    test('SwarPlayer channel count is 2 (stereo)', () {
      expect(SwarPlayer.channelCount, 2);
    });

    test('SwarPlayer sampleRate is 48000 (matches web engine)', () {
      expect(SwarPlayer.sampleRateHz, 48000);
    });
  });
}

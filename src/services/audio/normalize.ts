import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

const platform = os.platform();
const arch = os.arch();
const platformArch = `${platform}-${arch}`;

const ffmpegBinary = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
const ffprobeBinary = platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';

const ffmpegPath = path.join(process.cwd(), 'node_modules', '@ffmpeg-installer', platformArch, ffmpegBinary);
const ffprobePath = path.join(process.cwd(), 'node_modules', '@ffprobe-installer', platformArch, ffprobeBinary);

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

export interface AudioMetadata {
  duration: number; // in seconds
  format: string;
}

/**
 * Normalizes an audio file to 16kHz Mono WAV format.
 * This ensures compatibility with transcription APIs and reduces file size.
 */
export async function normalizeAudio(inputFilePath: string, outputDir: string): Promise<{ outputPath: string, duration: number }> {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(outputDir, `normalized-${randomUUID()}.wav`);

    ffmpeg(inputFilePath)
      .toFormat('wav')
      // 16kHz is standard for Whisper and most speech-to-text models
      .audioFrequency(16000)
      // Mono channel
      .audioChannels(1)
      .on('start', (commandLine) => {
        console.log('[FFmpeg] Spawned Ffmpeg with command: ' + commandLine);
      })
      .on('stderr', (stderrLine) => {
        console.log('[FFmpeg stderr] ' + stderrLine);
      })
      .on('error', (err: any) => {
        console.error('[FFmpeg] Error normalizing audio:', err);
        reject(err);
      })
      .on('end', async () => {
        try {
          const duration = await getAudioDuration(outputPath);
          resolve({ outputPath, duration });
        } catch (e) {
          reject(e);
        }
      })
      .save(outputPath);
  });
}

/**
 * Gets the duration of an audio file in seconds.
 */
export async function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err: any, metadata: any) => {
      if (err) {
        reject(err);
      } else {
        const duration = metadata.format.duration;
        resolve(duration ? parseFloat(duration.toString()) : 0);
      }
    });
  });
}

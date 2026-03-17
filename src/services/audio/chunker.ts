import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import os from 'os';
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

/**
 * Chunks a large audio file into smaller segments.
 *
 * @param inputFilePath 
 * @param outputDir 
 * @param chunkDurationSeconds 
 * @returns 
 */
export async function chunkAudio(
  inputFilePath: string,
  outputDir: string,
  chunkDurationSeconds: number = 600 // 10 minutes default
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const fileId = randomUUID();
    const outputPattern = path.join(outputDir, `chunk-${fileId}-%03d.wav`);

    ffmpeg(inputFilePath)
      .outputOptions([
        '-f segment',
        `-segment_time ${chunkDurationSeconds}`,
        '-c copy' // Direct copy since it's already normalized
      ])
      .on('error', (err: any) => {
        console.error('Error chunking audio:', err);
        reject(err);
      })
      .on('end', () => {
        // Find generated chunk files
        import('fs').then((fs) => {
          const files = fs.readdirSync(outputDir);
          const chunkFiles = files
            .filter((f) => f.startsWith(`chunk-${fileId}-`))
            .sort() // Ensure sequential order
            .map((f) => path.join(outputDir, f));

          resolve(chunkFiles);
        }).catch(reject);
      })
      .save(outputPattern);
  });
}

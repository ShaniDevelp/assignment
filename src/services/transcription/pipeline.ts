import { normalizeAudio } from '../audio/normalize';
import { chunkAudio } from '../audio/chunker';
import { ITranscriptionProvider, TranscriptionResult, TranscriptionSegment } from './types';
import fs from 'fs';

export class TranscriptionPipeline {
  constructor(
    private provider: ITranscriptionProvider,
    private tempDir: string
  ) {}

  /**
   * Processes an audio file through the full normalization, chunking (if needed),
   * and transcription pipeline.
   *
   * @param inputFilePath Absolute path to the uploaded file
   * @returns Aggregated transcription result
   */
  async process(inputFilePath: string): Promise<TranscriptionResult> {
    let normalizedPath = '';
    let normalizedDuration = 0;
    let chunks: string[] = [];

    try {
      console.log(`[Pipeline] Normalizing audio file: ${inputFilePath}`);
      const normResult = await normalizeAudio(inputFilePath, this.tempDir);
      normalizedPath = normResult.outputPath;
      normalizedDuration = normResult.duration;

      console.log(`[Pipeline] Normalized duration: ${normalizedDuration} seconds`);

      // If duration exceeds ~20 minutes (1200 seconds), chunk it
      // Standard OpenAI Whisper API limit is 25MB, which for 16kHz Mono WAV is roughly:
      // (16000 samples/sec * 2 bytes/sample * 1 channel) = 32KB/sec -> 25MB = ~780 seconds
      // Setting a safe limit of 10 minutes (600 seconds) per chunk
      const CHUNK_DURATION_SEC = 600;

      if (normalizedDuration > CHUNK_DURATION_SEC) {
        console.log(`[Pipeline] Duration exceeds ${CHUNK_DURATION_SEC}s, chunking file...`);
        chunks = await chunkAudio(normalizedPath, this.tempDir, CHUNK_DURATION_SEC);
        console.log(`[Pipeline] Created ${chunks.length} chunks`);

        return await this.processMultipleFiles(chunks, CHUNK_DURATION_SEC);
      } else {
        // Simple case: single file
        console.log(`[Pipeline] Processing single normalized file`);
        return await this.provider.transcribe(normalizedPath);
      }
    } finally {
      // Cleanup ephemeral files ensuring no orphaned files are left in tempDir
      this.cleanupFile(inputFilePath);
      this.cleanupFile(normalizedPath);
      for (const chunk of chunks) {
        this.cleanupFile(chunk);
      }
    }
  }

  /**
   * Transcribes multiple chunks and intelligently aggregates them by offsetting timestamps.
   */
  private async processMultipleFiles(chunkPaths: string[], chunkDuration: number): Promise<TranscriptionResult> {
    const allSegments: TranscriptionSegment[] = [];
    let fullText = '';
    let globalSegmentId = 0;

    // Process sequentially to be gentle on rate limits.
    // In production, this could be parallelized via Promise.all with concurrency limits.
    for (let i = 0; i < chunkPaths.length; i++) {
      const chunkPath = chunkPaths[i];
      const timeOffset = i * chunkDuration;
      
      console.log(`[Pipeline] Processing chunk ${i + 1}/${chunkPaths.length} with time offset +${timeOffset}s`);
      const result = await this.provider.transcribe(chunkPath);

      // Append text
      fullText += (fullText ? ' ' : '') + result.text.trim();

      // Adjust segments relative to timeline
      for (const seg of result.segments) {
        allSegments.push({
          id: globalSegmentId++,
          start: seg.start + timeOffset,
          end: seg.end + timeOffset,
          text: seg.text,
        });
      }
    }

    return {
      text: fullText,
      segments: allSegments,
    };
  }

  private cleanupFile(filePath: string) {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`[Cleanup] Deleted ephemeral file: ${filePath}`);
      } catch (err) {
        console.error(`[Cleanup] Failed to delete file: ${filePath}`, err);
      }
    }
  }
}

import OpenAI from 'openai';
import fs from 'fs';
import { ITranscriptionProvider, TranscriptionResult, TranscriptionSegment } from '../types';

export class OpenAITranscriptionProvider implements ITranscriptionProvider {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async transcribe(audioFilePath: string): Promise<TranscriptionResult> {
    console.log(`[OpenAIProvider] Transcribing: ${audioFilePath}`);
    
    // Create a read stream from the file to handle large files/memory efficiently
    const audioStream = fs.createReadStream(audioFilePath);

    try {
      const response = await this.openai.audio.transcriptions.create({
        file: audioStream,
        model: 'whisper-1',
        // Request verbose json to get the timestamped segments
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'], // get segment level timestamps
      });

      // Map OpenAI's specific response format to our generic format
      const segments: TranscriptionSegment[] = (response.segments || []).map((seg: any) => ({
        id: seg.id,
        start: seg.start,
        end: seg.end,
        text: seg.text,
      }));

      return {
        text: response.text,
        segments,
      };
    } catch (error) {
      console.error('[OpenAIProvider] Error calling Whisper API:', error);
      throw error;
    }
  }
}

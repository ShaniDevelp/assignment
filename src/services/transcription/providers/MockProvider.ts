import { ITranscriptionProvider, TranscriptionResult, TranscriptionSegment } from '../types';

/**
 * A mock provider for testing the pipeline without incurring API costs.
 * It simulates a transcription delay based on file size (or standard delay)
 * and returns dummy segments.
 */
export class MockTranscriptionProvider implements ITranscriptionProvider {
  async transcribe(audioFilePath: string): Promise<TranscriptionResult> {
    console.log(`[MockProvider] Transcribing: ${audioFilePath}`);

    // Simulate network/processing delay (2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate some fake segments
    const segments: TranscriptionSegment[] = [
      {
        id: 0,
        start: 0.0,
        end: 2.5,
        text: 'This is a mock transcription.',
      },
      {
        id: 1,
        start: 2.5,
        end: 5.0,
        text: 'It simulates processing an audio file.',
      },
      {
        id: 2,
        start: 5.0,
        end: 8.5,
        text: 'And returning precise timestamps for segments.',
      },
    ];

    const fullText = segments.map((s) => s.text).join(' ');

    return {
      text: fullText,
      segments,
    };
  }
}

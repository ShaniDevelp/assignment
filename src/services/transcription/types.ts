export interface TranscriptionSegment {
  id: number;
  start: number; // Start time in seconds
  end: number; // End time in seconds
  text: string;
}

export interface TranscriptionResult {
  text: string; // The full aggregated text
  segments: TranscriptionSegment[]; // Detailed timestamped segments
}

export interface ITranscriptionProvider {
  /**
   * Transcribes the given audio file.
   * @param audioFilePath Absolute path to the normalized audio file.
   */
  transcribe(audioFilePath: string): Promise<TranscriptionResult>;
}

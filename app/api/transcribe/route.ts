import { NextRequest, NextResponse } from 'next/server';
import { TranscriptionPipeline } from '@/src/services/transcription/pipeline';
import { OpenAITranscriptionProvider } from '@/src/services/transcription/providers/OpenAIProvider';
import { MockTranscriptionProvider } from '@/src/services/transcription/providers/MockProvider';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const tempDir = path.join(process.cwd(), 'tmp');

  try {
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const formData = await req.formData();
    const file = formData.get('audio') as File | null;
    const useMock = formData.get('useMock') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided in the request.' }, { status: 400 });
    }

    // Save the uploaded File to the temp directory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // We use original extension to help ffmpeg guess the format if needed
    const ext = Array.from(file.name.split('.')).pop() || 'tmp';
    const uploadFilePath = path.join(tempDir, `upload-${randomUUID()}.${ext}`);
    fs.writeFileSync(uploadFilePath, buffer);

    console.log(`[API] Saved uploaded file to ${uploadFilePath} (${file.size} bytes)`);

    // Initialize the provider based on the request flag
    const provider = useMock || !process.env.OPENAI_API_KEY
      ? new MockTranscriptionProvider()
      : new OpenAITranscriptionProvider();

    // Initialize and run the pipeline
    const pipeline = new TranscriptionPipeline(provider, tempDir);
    const result = await pipeline.process(uploadFilePath);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[API] Error processing transcription request:', error);
    return NextResponse.json(
      { error: 'Failed to process audio file.', details: error.message },
      { status: 500 }
    );
  }
}

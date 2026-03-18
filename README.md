# Fullstack Transcription Pipeline

A robust, extensible transcription service built with Next.js that accepts audio files via an API route, standardizes formatting using FFmpeg, automatically chunks large files to bypass API limits, and returns accurate timestamp-level transcripts using the OpenAI Whisper model.

## Getting Started

First, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to upload and test audio files.

### Environment Variables
Configure your project by adding an `.env.local` to the root folder:
```env
OPENAI_API_KEY="sk-..."
```
If no key is configured, the application has a built-in `MockProvider` pattern that simulates processing and accurately reflects the exact formatting structure the real API provides.

---

## Technical Design Decisions

This application prioritizes **engineering resilience** over simplistic API wrappers. We're directly parsing unpredictable, raw files from end-users, thus requiring rigid defense layers.

**1. Audio Format Normalization Strategy (FFmpeg)**
Instead of relying on the transcription API to decipher potentially obscure or highly compressed user formats, we employ an explicit, immediate audio normalization step. Every uploaded file (whether `m4a`, `ogg`, or `mp3`) is piped through `fluent-ffmpeg` and converted strictly to a **16000Hz, 1 Channel (Mono) WAV file**. This strips structural bloat, guarantees the Whisper API receives the exact same optimized payload format every time, and reduces payload bandwidth dynamically.

**2. Handling Long Files & Strict Size Limits**
AI models usually impose strict input caps (e.g. OpenAI's 25MB file limit). Synchronously passing giant buffers can also cause immediate Vercel/Next.js function timeouts.
If our normalized audio exceeds a set duration mathematically computed (e.g., 10 minutes), FFmpeg seamlessly segments the file into multiple 10-minute temporary `.wav` files. The backend synthesizes the final exact timestamps by injecting an offset logic (adding `10 mins` to all timestamps returned from chunk 2, `20 mins` to chunk 3) to stitch the text seamlessly back together for the user as if analyzed whole.

**3. Separation of Concerns (Strategy Pattern)**
The transcription logic itself is completely decoupled behind the `ITranscriptionProvider` interface. The `TranscriptionPipeline` only knows that it gives an audio file and expects a `TranscriptionResult` struct (with absolute timestamps). This allows us to swap, test, and mock the LLM engine instantly without rewriting core orchestration math.




"use client";

import { useState } from 'react';
import { TranscriptionResult } from '../services/transcription/types';

export default function TranscriptionApp() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [useMock, setUseMock] = useState(true);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleTranscribe = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('audio', file);
    formData.append('useMock', useMock.toString());

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transcribe.');
      }

      const data: TranscriptionResult = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Transcription Service</h1>

      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-800 mb-6 transition-colors hover:border-blue-400">
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
          id="audio-upload"
        />
        <label htmlFor="audio-upload" className="cursor-pointer">
          <div className="text-gray-500 dark:text-gray-400 mb-2">
            {file ? (
              <span className="font-semibold text-blue-600 dark:text-blue-400">{file.name}</span>
            ) : (
              <span>Click or drag to upload an audio file</span>
            )}
          </div>
          <div className="text-sm text-gray-400">MP3, WAV, M4A, OGG supported</div>
        </label>
      </div>

      <div className="flex items-center justify-between mb-8">
        <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={useMock}
            onChange={(e) => setUseMock(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <span>Use Mock Processing (No API Key needed)</span>
        </label>

        <button
          onClick={handleTranscribe}
          disabled={!file || isUploading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md shadow transition-colors"
        >
          {isUploading ? 'Processing...' : 'Transcribe Audio'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">Full Text</h2>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
              {result.text}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">Timestamps</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {result.segments.map((seg, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors"
                >
                  <div className="text-sm font-mono text-blue-600 dark:text-blue-400 shrink-0 mt-1">
                    [{formatTime(seg.start)} - {formatTime(seg.end)}]
                  </div>
                  <div className="text-gray-800 dark:text-gray-200">{seg.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

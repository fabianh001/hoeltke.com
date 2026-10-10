import { mkdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

export interface TtsOptions {
  apiKey?: string;
  model?: string;
  voice?: string;
  bitrate?: string;
  responseFormat?: string;
  outputFilePath?: string;
}

const OPENROUTER_TTS_ENDPOINT = 'https://openrouter.ai/api/v1/audio/speech';
const DEFAULT_TTS_MODEL = 'google/gemini-3.1-flash-tts-preview';
const DEFAULT_TTS_VOICE = 'Orus';
const DEFAULT_TTS_BITRATE = '64k';
const BITRATE_PATTERN = /^[1-9]\d{0,3}k$/i;

export function validateBitrate(bitrate: string): string {
  if (!BITRATE_PATTERN.test(bitrate)) {
    throw new Error(`Invalid TTS bitrate "${bitrate}". Expected a value such as 64k or 128k.`);
  }
  return bitrate;
}

/**
 * Wraps raw PCM audio in a valid RIFF WAV header (24kHz 16-bit mono default for Gemini).
 */
export function pcmToWav(
  pcmBuffer: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16,
): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);

  // RIFF chunk descriptor
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8);

  // fmt sub-chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // 16 for PCM
  header.writeUInt16LE(1, 20); // 1 = PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  header.write('data', 36);
  header.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([header, pcmBuffer]);
}

/**
 * Generate speech audio from text using the OpenRouter audio speech API.
 * Supports google/gemini-3.1-flash-tts-preview (PCM -> WAV), openai/gpt-4o-mini-tts (MP3), etc.
 */
export async function synthesizeSpeech(
  text: string,
  options: TtsOptions = {},
): Promise<Buffer> {
  const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const model = options.model || process.env.TTS_MODEL || DEFAULT_TTS_MODEL;
  const voice = options.voice || process.env.TTS_VOICE || DEFAULT_TTS_VOICE;
  const isGemini = model.toLowerCase().includes('gemini');
  const isDeepgram = model.toLowerCase().includes('deepgram');
  const responseFormat = options.responseFormat || (isGemini ? 'pcm' : 'mp3');

  // Gemini TTS preview performs best on bite-sized chunks (500-800 chars).
  // Deepgram strictly enforces a 2,000-character payload limit (HTTP 413).
  // Safe chunk sizing: 700 chars for Gemini, 1,200 chars for Deepgram, 1,500 chars for others.
  const maxChunkChars = isGemini ? 700 : isDeepgram ? 1200 : 1500;
  const chunks = chunkText(text, maxChunkChars);
  const audioBuffers: Buffer[] = [];

  console.log(`  Synthesizing ${chunks.length} audio segment(s) …`);

  for (let i = 0; i < chunks.length; i++) {
    let chunk = chunks[i];
    // Gemini supports [calm] emotion prompts. Non-Gemini models shouldn't read bracket tags.
    if (!isGemini) {
      chunk = chunk.replace(/^\[[a-zA-Z0-9_\-\s]+\]\s*/g, '');
    }
    const input = isGemini && !chunk.startsWith('[calm]') ? `[calm] ${chunk}` : chunk;
    const t0 = Date.now();

    const res = await fetch(OPENROUTER_TTS_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://hoeltke.com',
        'X-Title': 'AI Weekly Audio',
      },
      body: JSON.stringify({
        model,
        input,
        voice,
        response_format: responseFormat,
      }),
    });

    if (!res.ok) {
      let errorDetails = '';
      try {
        const errJson = await res.json();
        errorDetails = JSON.stringify(errJson);
      } catch {
        errorDetails = await res.text();
      }
      throw new Error(`OpenRouter TTS API error ${res.status}: ${errorDetails}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    audioBuffers.push(Buffer.from(arrayBuffer));
    console.log(`  ✓ [${i + 1}/${chunks.length}] synthesized in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }

  let finalBuffer = Buffer.concat(audioBuffers);

  // If PCM was returned (e.g. from Gemini), wrap it in a standard WAV container for browser compatibility
  if (responseFormat === 'pcm') {
    finalBuffer = pcmToWav(finalBuffer);
  }

  if (options.outputFilePath) {
    mkdirSync(dirname(options.outputFilePath), { recursive: true });
    if (options.outputFilePath.endsWith('.mp3')) {
      const bitrate = validateBitrate(options.bitrate || process.env.TTS_BITRATE || DEFAULT_TTS_BITRATE);
      const temporaryPath = `${options.outputFilePath}.tmp-${process.pid}-${Date.now()}.mp3`;
      try {
        const inputArgs = responseFormat === 'pcm' ? ['-f', 'wav'] : [];
        const result = spawnSync('ffmpeg', [
          '-y',
          ...inputArgs,
          '-i', '-',
          '-codec:a', 'libmp3lame',
          '-b:a', bitrate,
          '-ac', '1',
          temporaryPath,
        ], {
          input: finalBuffer,
          stdio: ['pipe', 'ignore', 'pipe'],
        });
        if (result.error) throw result.error;
        if (result.status !== 0) {
          throw new Error(result.stderr?.toString().trim() || `ffmpeg exited with status ${result.status}`);
        }
        renameSync(temporaryPath, options.outputFilePath);
        return finalBuffer;
      } catch (err) {
        try {
          unlinkSync(temporaryPath);
        } catch {}
        throw new Error(`ffmpeg compression to MP3 failed: ${(err as Error).message}`, { cause: err });
      }
    }
    writeFileSync(options.outputFilePath, finalBuffer);
  }

  return finalBuffer;
}

/**
 * Helper to split text on paragraph or sentence boundaries without cutting mid-sentence.
 */
export function chunkText(text: string, maxChars = 650): string[] {
  if (text.length <= maxChars) return [text];

  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + '\n\n' + para).length <= maxChars) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      if (para.length <= maxChars) {
        currentChunk = para;
      } else {
        // Break long paragraph by sentences
        const sentences = para.match(/[^.!?]+[.!?]+|\s*$/g) || [para];
        currentChunk = '';
        for (const sent of sentences) {
          if (!sent.trim()) continue;
          if ((currentChunk + ' ' + sent).length <= maxChars) {
            currentChunk = currentChunk ? `${currentChunk} ${sent}` : sent;
          } else {
            if (currentChunk) chunks.push(currentChunk);
            if (sent.length <= maxChars) {
              currentChunk = sent;
            } else {
              // In case a single sentence is longer than maxChars, break by words
              const words = sent.split(/\s+/);
              currentChunk = '';
              for (const word of words) {
                if (!word.trim()) continue;
                if ((currentChunk + ' ' + word).length <= maxChars) {
                  currentChunk = currentChunk ? `${currentChunk} ${word}` : word;
                } else {
                  if (currentChunk) chunks.push(currentChunk);
                  currentChunk = word;
                }
              }
            }
          }
        }
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks.map((c) => c.trim()).filter(Boolean);
}

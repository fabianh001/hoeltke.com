import OpenAI from 'openai';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  generateSpokenScriptWithAi,
  generateSpokenScriptDeterministic,
  parseDigestMarkdown,
} from './lib/digest-tts-script.js';
import { synthesizeSpeech } from './lib/openrouter-tts.js';

try {
  process.loadEnvFile?.();
} catch { }

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIGEST_DIR = join(ROOT, 'src/content/digest');
const AUDIO_DIR = join(ROOT, 'public/audio/digest');
const DIGEST_MODEL = process.env.DIGEST_SPEECH_MODEL || 'deepseek/deepseek-v4-flash-0731';

interface ProcessOptions {
  slug: string;
  dryRun: boolean;
  force: boolean;
  useAiScript: boolean;
  client?: OpenAI;
  bitrate?: string;
}

export function parseConcurrency(value: string): number {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error(`Invalid TTS concurrency "${value}". Expected a positive integer.`);
  }
  return Number.parseInt(value, 10);
}

export async function processDigestTts({
  slug,
  dryRun,
  force,
  useAiScript,
  client,
  bitrate,
}: ProcessOptions): Promise<string> {
  const mdPath = join(DIGEST_DIR, `${slug}.md`);
  if (!existsSync(mdPath)) {
    throw new Error(`Digest file not found: ${mdPath}`);
  }

  const audioPath = join(AUDIO_DIR, `${slug}.mp3`);
  if (existsSync(audioPath) && !force && !dryRun) {
    console.log(`⚡ Audio already exists for ${slug}, skipping (use --force to overwrite)`);
    return audioPath;
  }

  const mdContent = readFileSync(mdPath, 'utf8');
  const parsed = parseDigestMarkdown(mdContent);

  const aiClient =
    client ??
    (process.env.OPENROUTER_API_KEY
      ? new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY,
        defaultHeaders: { 'HTTP-Referer': 'https://hoeltke.com', 'X-Title': 'AI Weekly' },
      })
      : undefined);

  let script = '';
  if (useAiScript && aiClient && process.env.OPENROUTER_API_KEY) {
    console.log(`🤖 Crafting dynamic AI spoken narration with ${DIGEST_MODEL} for ${slug} …`);
    try {
      script = await generateSpokenScriptWithAi(aiClient, parsed, slug, DIGEST_MODEL);
    } catch (err) {
      console.warn(`⚠ AI script generation failed (${(err as Error).message}), falling back to deterministic template`);
      script = generateSpokenScriptDeterministic(parsed, slug);
    }
  } else {
    script = generateSpokenScriptDeterministic(parsed, slug);
  }

  if (dryRun) {
    console.log(`\n========================================`);
    console.log(`[DRY RUN] Spoken script for ${slug} (${script.length} chars):`);
    console.log(`========================================\n`);
    console.log(script);
    console.log(`\n========================================\n`);
    return audioPath;
  }

  console.log(`🎙 Synthesizing speech for ${slug} (${script.length} chars) …`);
  await synthesizeSpeech(script, {
    outputFilePath: audioPath,
    bitrate,
  });

  console.log(`✓ Generated audio: ${audioPath}`);
  return audioPath;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const processAll = args.includes('--all');
  const noAi = args.includes('--no-ai');

  const slugIdx = args.indexOf('--slug');
  const specifiedSlug = slugIdx !== -1 && args[slugIdx + 1] ? args[slugIdx + 1] : null;

  const bitrateIdx = args.indexOf('--bitrate');
  const bitrate = bitrateIdx !== -1 && args[bitrateIdx + 1] ? args[bitrateIdx + 1] : undefined;

  if (!dryRun && !process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is required');
  }

  const client = process.env.OPENROUTER_API_KEY
    ? new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: { 'HTTP-Referer': 'https://hoeltke.com', 'X-Title': 'AI Weekly' },
    })
    : undefined;

  let slugsToProcess: string[] = [];

  if (specifiedSlug) {
    slugsToProcess = [specifiedSlug.replace(/\.md$/, '')];
  } else if (processAll) {
    slugsToProcess = readdirSync(DIGEST_DIR)
      .filter((f) => f.endsWith('.md') && f !== 'preview.md')
      .map((f) => f.replace(/\.md$/, ''))
      .sort();
  } else {
    // Default: find all digests that do not have an audio file yet, or latest
    const allFiles = readdirSync(DIGEST_DIR)
      .filter((f) => f.endsWith('.md') && f !== 'preview.md')
      .map((f) => f.replace(/\.md$/, ''))
      .sort();

    const missing = allFiles.filter((s) => !existsSync(join(AUDIO_DIR, `${s}.mp3`)));
    slugsToProcess = missing.length > 0 ? missing : [allFiles[allFiles.length - 1]];
  }

  const concurrencyIdx = args.indexOf('--concurrency') !== -1 ? args.indexOf('--concurrency') : args.indexOf('-c');
  const concurrency = concurrencyIdx !== -1
    ? parseConcurrency(args[concurrencyIdx + 1] ?? '')
    : parseConcurrency(process.env.TTS_CONCURRENCY || '3');

  console.log(
    `Found ${slugsToProcess.length} digest(s) to process (concurrency: ${concurrency}): ${slugsToProcess.join(', ')}`,
  );

  const errors: { slug: string; error: Error }[] = [];
  const queue = [...slugsToProcess];

  const workers = Array.from(
    { length: Math.min(concurrency, slugsToProcess.length) },
    async (_, workerId) => {
      while (queue.length > 0) {
        const slug = queue.shift();
        if (!slug) break;
        try {
          await processDigestTts({
            slug,
            dryRun,
            force,
            useAiScript: !noAi,
            client,
            bitrate,
          });
        } catch (err) {
          const error = err as Error;
          console.error(`✗ [worker ${workerId + 1}] Error processing ${slug}: ${error.message}`);
          errors.push({ slug, error });
        }
      }
    },
  );

  await Promise.all(workers);

  if (errors.length > 0) {
    console.error(`\n⚠ Completed with ${errors.length} error(s):`);
    for (const { slug, error } of errors) {
      console.error(` - ${slug}: ${error.message}`);
    }
    if (!dryRun) {
      throw new Error(`${errors.length} digest(s) failed during TTS generation`);
    }
  }
}

// Run directly if called as a script
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(`✗ TTS generation failed: ${err.message}`);
    process.exit(1);
  });
}

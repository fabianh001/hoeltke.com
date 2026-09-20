import OpenAI from 'openai';
import matter from 'gray-matter';

export interface DigestData {
  title: string;
  description: string;
  date: string | Date;
  issue: number;
  tags: string[];
  sources: Array<{ title: string; url: string }>;
}

export interface ParsedStory {
  headline: string;
  summary: string;
  whyItMatters: string;
  sourceTitle: string;
  sourceUrl: string;
}

export interface ParsedDigest {
  data: DigestData;
  intro: string;
  stories: ParsedStory[];
}

/**
 * Parse markdown digest content into structured stories and intro.
 */
export function parseDigestMarkdown(markdownContent: string): ParsedDigest {
  const { data, content } = matter(markdownContent);
  const digestData = data as DigestData;

  const sections = content.trim().split(/\n(?=##\s+)/);
  const intro = sections[0].trim();
  const storySections = sections.slice(1);

  const stories: ParsedStory[] = [];

  for (const sec of storySections) {
    const lines = sec.trim().split('\n');
    const headlineLine = lines[0] || '';
    const headline = headlineLine.replace(/^##\s+/, '').trim();

    const rest = lines.slice(1).join('\n').trim();
    const whyItMattersMatch = rest.match(/\*\*Why it matters:\*\*\s*([\s\S]+)$/i);

    let summary = '';
    let whyItMatters = '';
    let sourceTitle = '';
    let sourceUrl = '';

    if (whyItMattersMatch) {
      summary = rest.substring(0, whyItMattersMatch.index).trim();
      const rawWhy = whyItMattersMatch[1].trim();

      // Extract source link like ([OpenAI News](https://...))
      const linkMatch = rawWhy.match(/\(\[([^\]]+)\]\(([^)]+)\)\)/);
      if (linkMatch) {
        sourceTitle = linkMatch[1];
        sourceUrl = linkMatch[2];
        whyItMatters = rawWhy.replace(/\s*\(\[([^\]]+)\]\(([^)]+)\)\)/, '').trim();
      } else {
        whyItMatters = rawWhy;
      }
    } else {
      summary = rest;
    }

    stories.push({
      headline,
      summary,
      whyItMatters,
      sourceTitle,
      sourceUrl,
    });
  }

  return {
    data: digestData,
    intro,
    stories,
  };
}

/**
 * Clean up text for natural TTS pronunciation.
 */
export function cleanForTts(text: string): string {
  return text
    // Replace markdown bold, italics, code blocks
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Expand multiplier symbols (e.g. 3.2× or 3.2x -> 3.2 times)
    .replace(/(\d+(?:\.\d+)?)\s*[×x]/gi, '$1 times')
    // Expand billions in model names (e.g. 27B -> 27 billion, 70B -> 70 billion)
    .replace(/\b(\d+(?:\.\d+)?)\s*B\b/g, '$1 billion')
    // Expand millions in context (e.g. 7M -> 7 million)
    .replace(/\b(\d+(?:\.\d+)?)\s*M\b/g, '$1 million')
    // Expand precision types (e.g. FP8 -> F-P-8, FP16 -> F-P-16, BF16 -> B-F-16)
    .replace(/\bFP(\d+)\b/g, 'F-P-$1')
    .replace(/\bBF(\d+)\b/g, 'B-F-$1')
    // Normalize ampersand
    .replace(/&/g, ' and ')
    // Em dash to comma pause
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s*–\s*/g, ', ')
    // Common abbreviations
    .replace(/\be\.g\.,?\s*/gi, 'for example, ')
    .replace(/\bi\.e\.,?\s*/gi, 'that is, ')
    .replace(/\bvs\.\s*/gi, 'versus ')
    // Clean excessive whitespaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Ask an LLM to craft a unique, natural podcast-style spoken script
 * with dynamic AI-generated transitions, varied phrasing, and spoken-first delivery.
 */
export async function generateSpokenScriptWithAi(
  client: OpenAI,
  parsed: ParsedDigest,
  slug: string,
  model = 'anthropic/claude-sonnet-4-6',
): Promise<string> {
  const { data, intro, stories } = parsed;

  const storiesSummary = stories
    .map(
      (s, i) =>
        `Story ${i + 1}:
- Headline: ${s.headline}
- Summary: ${s.summary}
- Why it matters: ${s.whyItMatters}
- Source: ${s.sourceTitle || 'curated source'}`,
    )
    .join('\n\n');

  const prompt = `You are the voice of "AI Weekly".
Transform this week's digest (Issue #${data.issue}) into an engaging, smooth, natural audio script for a short 2-3 minute audio briefing.

Issue details:
- Title: ${data.title}
- Subtitle/Hook: ${data.description}
- Published Date: ${typeof data.date === 'string' ? data.date : data.date.toISOString().slice(0, 10)}
- Intro paragraph: ${intro}

Stories:
${storiesSummary}

Guidelines for the spoken script:
1. Tone: Direct, technically literate, calm, dry-witted, zero hype.
2. Structure:
   - Dynamic Intro: A natural, varied opening greeting mentioning AI Weekly issue #${data.issue}, the week's theme, and delivering the big-picture context. Don't introduce yourself.
   - Dynamic Story Transitions: Connect the stories logically with fresh, natural transitions that fit the specific narratives of this week (NEVER use repetitive generic formulas like "Next up:" or "Story two:"). Synthesize thematic links between stories when appropriate.
   - For each story: Introduce the headline naturally, summarize the key technical development clearly, state why it matters for practicing engineers, and cite the source conversationally (e.g., "Reported by OpenAI News", "Simon Willison highlighted that...").
   - Outro: A crisp wrap-up directing listeners to read the full issue with source links at hoeltke.com/digest/${slug}.
3. Spoken Acoustics:
   - Format for text-to-speech: avoid raw symbols, hashes, asterisks, brackets, or URLs.
   - Begin the entire text with the emotion marker \`[calm]\` if appropriate for Gemini TTS.
   - Ensure numbers and technical terms sound natural when read aloud.

Output ONLY the final narration script text to be passed directly to the TTS engine.`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert audio scriptwriter who turns technical newsletter digests into natural, dynamic, spoken-word audio briefings.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('LLM returned empty audio script');
  }

  return cleanForTts(content);
}

/**
 * High-quality deterministic fallback for generating spoken text when offline or in dry-run mode.
 */
export function generateSpokenScriptDeterministic(parsed: ParsedDigest, slug: string): string {
  const { data, intro, stories } = parsed;
  const issueNum = data.issue;

  const parts: string[] = [];

  // Opening
  parts.push(
    `[calm] Welcome to AI Weekly, issue number ${issueNum}. ${cleanForTts(data.description)}`,
  );

  if (intro) {
    parts.push(cleanForTts(intro));
  }

  // Story transitions
  const transitionPrefixes = [
    'Leading off:',
    'Next up:',
    'In other news:',
    'Moving on:',
    'Also this week:',
    'And finally:',
  ];

  stories.forEach((story, idx) => {
    let prefix = '';
    if (idx === 0) {
      prefix = 'First,';
    } else if (idx === stories.length - 1) {
      prefix = 'Finally,';
    } else {
      prefix = transitionPrefixes[idx % transitionPrefixes.length];
    }

    const storyHeadline = cleanForTts(story.headline);
    const storySummary = cleanForTts(story.summary);
    const whyItMatters = story.whyItMatters ? cleanForTts(story.whyItMatters) : '';
    const source = story.sourceTitle ? `Reported by ${cleanForTts(story.sourceTitle)}.` : '';

    let storyText = `${prefix} ${storyHeadline}. ${storySummary}`;
    if (whyItMatters) {
      storyText += ` Why it matters: ${whyItMatters}`;
    }
    if (source) {
      storyText += ` ${source}`;
    }

    parts.push(storyText);
  });

  // Outro
  parts.push(
    `That wraps up issue ${issueNum} of AI Weekly. For all sources and links, visit hoeltke.com/digest/${slug}. Thanks for listening.`,
  );

  return parts.join('\n\n');
}

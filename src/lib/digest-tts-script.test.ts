import { describe, it, expect } from 'vitest';
import {
  parseDigestMarkdown,
  cleanForTts,
  generateSpokenScriptDeterministic,
} from '../../scripts/lib/digest-tts-script';

describe('digest-tts-script', () => {
  const sampleMarkdown = `---
title: 'AI Weekly #11 — pacing, poisoning, and a 27b underdog'
description: 'This week: OpenAI throttles cyber-capable models, Qwen 3.8 27B turns heads.'
date: 2026-08-21
issue: 11
tags: ['policy', 'models']
sources:
  - title: 'OpenAI News'
    url: 'https://openai.com/index/pacing'
---

Two themes dominated this week: frontier labs getting more explicit.

## OpenAI formalizes a pacing framework for cyber-dangerous models

OpenAI published a policy document describing how it intends to slow releases.

**Why it matters:** If this framework holds, it establishes a precedent. ([OpenAI News](https://openai.com/index/pacing))

## Qwen 3.8 27B: strong benchmark scores

Alibaba's Qwen 3.8 27B landed with an FP8 checkpoint and 3.2× speed.

**Why it matters:** A 27B model changes the cost calculus. ([Simon Willison](https://simonwillison.net/2026/Aug/16/qwen-38-27b/))
`;

  it('parses markdown digest into intro and stories', () => {
    const parsed = parseDigestMarkdown(sampleMarkdown);

    expect(parsed.data.issue).toBe(11);
    expect(parsed.data.title).toContain('AI Weekly #11');
    expect(parsed.intro).toContain('Two themes dominated this week');
    expect(parsed.stories).toHaveLength(2);
    expect(parsed.stories[0].headline).toBe('OpenAI formalizes a pacing framework for cyber-dangerous models');
    expect(parsed.stories[0].sourceTitle).toBe('OpenAI News');
    expect(parsed.stories[1].headline).toBe('Qwen 3.8 27B: strong benchmark scores');
  });

  it('cleans and normalizes text for speech acoustics', () => {
    const raw = '3.2× speed with 27B parameters on FP8 and BF16 & e.g., fast RAG';
    const cleaned = cleanForTts(raw);

    expect(cleaned).toContain('3.2 times');
    expect(cleaned).toContain('27 billion');
    expect(cleaned).toContain('F-P-8');
    expect(cleaned).toContain('B-F-16');
    expect(cleaned).toContain('and');
    expect(cleaned).toContain('for example,');
  });

  it('generates a clean deterministic spoken script', () => {
    const parsed = parseDigestMarkdown(sampleMarkdown);
    const script = generateSpokenScriptDeterministic(parsed, '2026-34');

    expect(script).toContain('[calm] Welcome to AI Weekly, issue number 11.');
    expect(script).toContain('First, OpenAI formalizes a pacing framework');
    expect(script).toContain('Reported by OpenAI News.');
    expect(script).toContain('Finally, Qwen 3.8 27 billion: strong benchmark scores.');
    expect(script).toContain('hoeltke.com/digest/2026-34');
  });
});

import { describe, expect, it } from 'vitest';
import { selectDevelopments, type ClassifiedGroup } from '../../scripts/lib/digest-selection';
import { rankCandidates, type RankedCandidate } from '../../scripts/lib/digest-traction';

const items: RankedCandidate[] = rankCandidates([
  { source: 'HN', title: 'DeepInfer', url: 'https://example.com/deepinfer', date: '2026-10-20', snippet: '', hn: [{ id: '1', points: 2327, comments: 887 }] },
  { source: 'HN', title: 'PHP security release', url: 'https://example.com/php-release', date: '2026-10-21', snippet: '', hn: [{ id: '2', points: 1543, comments: 656 }] },
  { source: 'HN', title: 'Kimi', url: 'https://example.com/kimi', date: '2026-10-23', snippet: '', hn: [{ id: '3', points: 1100, comments: 300 }] },
  { source: 'HN', title: 'Voxtral', url: 'https://example.com/voxtral', date: '2026-10-20', snippet: '', hn: [{ id: '4', points: 765, comments: 200 }] },
  { source: 'HN', title: 'Hidden LLM instructions', url: 'https://example.com/instructions', date: '2026-10-19', snippet: '', hn: [{ id: '5', points: 739, comments: 217 }] },
  { source: 'HN', title: 'DeepSeek ban', url: 'https://example.com/ban', date: '2026-10-19', snippet: '', hn: [{ id: '6', points: 578, comments: 543 }] },
  { source: 'PHP Foundation', title: 'How AI helped validate PHP vulnerabilities', url: 'https://example.com/php-primary', date: '2026-10-21', snippet: 'AI-assisted vulnerability research.' },
]);
const group = (id: number, eligible = true): ClassifiedGroup => ({ candidateIds: [id], primaryCandidateId: id, eligible, reason: eligible ? 'Relevant AI development.' : 'General technology with no AI connection.' });
const groups = [group(6), group(5), group(4), group(3), { ...group(2), candidateIds: [2, 7], primaryCandidateId: 7, reason: 'AI-assisted security research led to critical PHP fixes.' }, group(1)];

describe('deterministic digest selection', () => {
  it('selects PHP ahead of a lower-traction story despite the classifier group order', () => {
    const result = selectDevelopments(items, groups);
    expect(result.selected.map(g => g.primary.title)).toEqual([
      'DeepInfer', 'How AI helped validate PHP vulnerabilities', 'Kimi', 'Voxtral', 'Hidden LLM instructions',
    ]);
    expect(result.selected[1].score).toBe(1707);
    expect(result.selected[1].members.map(item => item.url)).toEqual(['https://example.com/php-release', 'https://example.com/php-primary']);
    expect(result.audit.find(g => g.title === 'DeepSeek ban')).toMatchObject({ status: 'below-cutoff', eligible: true });
  });

  it('logs every group and retains the classifier exclusion reason', () => {
    const result = selectDevelopments(items, groups.map(g => g.primaryCandidateId === 1 ? { ...g, eligible: false, reason: 'Already covered without a new development.' } : g));
    expect(result.selected.map(g => g.primary.title)).not.toContain('DeepInfer');
    expect(result.selected).toHaveLength(5);
    expect(result.audit).toHaveLength(6);
    expect(result.audit.find(g => g.title === 'DeepInfer')).toMatchObject({ status: 'excluded', reason: 'Already covered without a new development.', score: 2548.75 });
  });

  it('retains editorial group order when all traction is unavailable', () => {
    const unmeasured = items.map(item => ({ ...item, hn: [], tractionScore: 0 }));
    expect(selectDevelopments(unmeasured, groups).selected.map(g => g.primary.title)).toEqual([
      'DeepSeek ban', 'Hidden LLM instructions', 'Voxtral', 'Kimi', 'How AI helped validate PHP vulnerabilities',
    ]);
  });

  it('allows fewer than five eligible developments without filling with excluded stories', () => {
    const result = selectDevelopments(items, groups.map(g => ({ ...g, eligible: g.primaryCandidateId === 7 })));
    expect(result.selected.map(g => g.primary.title)).toEqual(['How AI helped validate PHP vulnerabilities']);
  });

  it.each([
    { name: 'omitted candidates', groups: groups.slice(0, -1), error: /omitted candidate/ },
    { name: 'unknown candidates', groups: [...groups, group(99)], error: /unknown candidate/ },
    { name: 'duplicate membership', groups: [...groups, group(1)], error: /more than one group/ },
    { name: 'primary outside group', groups: groups.map(g => g.primaryCandidateId === 7 ? { ...g, primaryCandidateId: 1 } : g), error: /primary.*member/ },
    { name: 'empty group', groups: [...groups, { ...group(1), candidateIds: [] }], error: /empty group/ },
    { name: 'empty reason', groups: groups.map(g => ({ ...g, reason: ' ' })), error: /reason/ },
  ])('rejects $name before writing an incomplete or misranked issue', ({ groups, error }) => {
    expect(() => selectDevelopments(items, groups)).toThrow(error);
  });
});

import { z } from 'zod';
import type { RankedCandidate } from './digest-traction.js';
import { NEWSLETTER_MAX_STORIES } from '../../src/lib/newsletter-guidelines.js';

export const ClassificationSchema = z.object({
  groups: z.array(z.object({
    candidateIds: z.array(z.number().int()),
    primaryCandidateId: z.number().int(),
    eligible: z.boolean(),
    reason: z.string(),
  })),
});
export type ClassifiedGroup = z.infer<typeof ClassificationSchema>['groups'][number];

export interface Development {
  id: number;
  primary: RankedCandidate;
  members: RankedCandidate[];
  score: number;
  eligible: boolean;
  reason: string;
}

/** Require a complete classification before taking the highest-scoring eligible groups. */
export function selectDevelopments(items: RankedCandidate[], groups: ClassifiedGroup[]) {
  const seen = new Set<number>();
  const developments: Development[] = groups.map((group, index) => {
    if (!group.candidateIds.length) throw new Error('Classification contains an empty group');
    if (!group.reason.trim()) throw new Error('Every classification group needs a reason');
    if (!group.candidateIds.includes(group.primaryCandidateId)) throw new Error('Classification primary must be a group member');
    const members = group.candidateIds.map(id => {
      if (!Number.isInteger(id) || id < 1 || id > items.length) throw new Error(`Classification cites unknown candidate ${id}`);
      if (seen.has(id)) throw new Error(`Candidate ${id} appears in more than one group`);
      seen.add(id);
      return items[id - 1];
    });
    return {
      id: index + 1,
      primary: items[group.primaryCandidateId - 1],
      members,
      score: Math.max(...members.map(item => item.tractionScore)),
      eligible: group.eligible,
      reason: group.reason,
    };
  });
  const omitted = items.map((_, index) => index + 1).filter(id => !seen.has(id));
  if (omitted.length) throw new Error(`Classification omitted candidate(s): ${omitted.join(', ')}`);

  // Stable ties retain the classifier's editorial ordering, including when an
  // HN outage leaves every candidate unmeasured. Never sum related coverage.
  const ranked = developments.sort((a, b) => b.score - a.score || a.id - b.id);
  const selected = ranked.filter(group => group.eligible).slice(0, NEWSLETTER_MAX_STORIES);
  const selectedIds = new Set(selected.map(group => group.id));
  const audit = ranked.map(group => ({
    id: group.id, title: group.primary.title, sourceUrl: group.primary.url,
    memberUrls: group.members.map(item => item.url), score: group.score,
    eligible: group.eligible, reason: group.reason,
    status: !group.eligible ? 'excluded' : selectedIds.has(group.id) ? 'selected' : 'below-cutoff',
  }));
  return { selected, audit };
}

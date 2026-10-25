# AI Weekly editorial voice

Derived from Fabian's edits to the generated drafts for weeks 39–41 of 2026,
with an earlier example from week 36. The generation instructions live in
`scripts/generate-digest.ts`; this document records the evidence and scope.

## Recurring edits

- **Tell the story directly.** Week 39 replaced “Simon Willison's analysis
  frames…” with the development itself. Week 40 removed the live-blog plug,
  “noted by Simon Willison,” and unnecessary publication attribution. Week 41
  removed a sentence about secondary sources confirming Haiku's availability.
  Keep attribution when it distinguishes a claim, opinion, or experiment from
  an established fact. Keep the citation link.
- **Remove popularity as a selling point.** Week 40 cut “highest-upvoted” and
  an 883-point thread; week 41 cut Mistral's 2,000 upvotes, Tao's 600 HN points,
  Haiku's 1,040-point thread, and Beam's 552 points. Week 36 also removed two
  score references. Keep technical numbers such as parameter counts, prices,
  latency, and benchmark measurements when supported by the supplied sources.
- **Make each issue self-contained.** Week 41 removed the Sonnet issue-number
  clause and a comparison with an operation covered in issue #17. One issue #14
  reference remained in that edit, so the history is not perfectly consistent;
  Fabian's explicit request establishes the rule against newsletter
  backreferences. Factual context about an earlier product can still help.
- **Offer useful options without assuming the reader's stack.** Week 40 changed
  “the model you'll be benchmarking” to “a model you can benchmark.” Keep
  implications conditional and specific to the workload.
- **Cut redundant supporting detail.** Week 41 removed the Pollo AI SKU
  confirmation. Week 39 removed the HN discussion alongside a Bloomberg
  investigation while keeping the investigation itself.

## Selection and copy checks

Week 39 removed a Transformers/llama.cpp story and its intro mention; week 36
removed WeatherNext 3. These isolated removals do not establish a ban on local
inference, weather, or research stories. Continue selecting meaningful stories
for software engineers, and ensure the intro only previews selected stories.

## Structure and selection

Automatic drafts cover at most five distinct developments, ordered by weekly
traction after filtering for AI relevance and recent coverage. A short intro
sets the context; each story contains a headline, what changed, why it matters,
and a source link. Fewer stories are fine in a quiet week; don't pad the issue.

The reading budget is four minutes at 200 words/minute: 800 visible editorial
words, with a 600–700-word drafting target. The advisory count includes the title,
description, intro, headlines, body, inline citation labels, and repeated source
titles in the source list. Markdown syntax and hidden link destinations don't
count. This estimates the editorial copy, excluding fixed site/email chrome.
Generation and email preparation log counts and warn about overages; they never
reject or truncate copy for exceeding these guidelines. Manual edits can exceed
either guideline, and publishing and sending remain possible.

HN submissions from the last seven days supply the initial traction signal:
`points + 0.25 × min(comments, points)`. Comments add at most 25% to the vote
score. Collection paginates the available Algolia search sample (up to 1,000
submissions, above the configured minimum score) before ranking candidates.
These are scores observed at collection time on submissions created in the
window, not historical vote gains within the window.

Normalize tracking parameters to match feed articles with HN submissions,
while keeping original article URLs and titles as citations. Preserve URL
fragments: archive entries and hash-routed pages can identify separate stories
on the same base URL. Alternate anchors can still be grouped by the curator. Use
the strongest matching HN thread, rather than adding reposts together. The
classifier groups different articles about the same development; a group's
score is the highest of its article scores, so it can cite the primary
announcement while inheriting its coverage's traction.

Generation now makes two model calls. The first classifies **every** collected
candidate into exactly one development group, chooses a primary source, and
records an eligibility reason. Missing, unknown, or repeated candidate IDs are
rejected. AI-assisted vulnerability discovery and exploit validation explicitly
qualify, including advisories whose titles only name a non-AI product such as
PHP. General security news still needs an evidenced AI connection.

Code selects the five highest-scoring eligible groups before the second call.
The writer only receives the selected groups and must return exactly one story
per development ID. Code rejects omissions, duplicates, and substitutions,
restores traction order, and attaches source titles and URLs from the selected
candidates. This checks automatic generation only; manual Markdown edits and
email preparation don't enforce that generated selection.

Each group produces a `Selection audit:` JSON log entry containing its primary
and related URLs, score, eligibility, reason, and status (`selected`, `excluded`,
or `below-cutoff`). These logs explain why a collected story did or did not make
an issue. AI relevance and grouping still depend on classifier judgment; the
writer cannot override the resulting selection.

Measured developments take priority for selection. Articles without a matching
HN submission in the collected sample are **unmeasured**, not proven unpopular;
they fill remaining places after qualifying measured stories. If HN fails,
log the failure and use classifier ordering to select among eligible feed groups
whose scores are all zero. The HN-only
discovery cap and minimum points remain configurable in `scripts/sources.json`.

Scores and grouping evidence remain private selection context and never render
in the issue. Past headlines also remain private deduplication context. Article
titles and URLs remain exact citations; editorial rules apply to authored prose,
not original titles. Additional traction providers can be considered later;
the current ranking uses HN only.

The prompt includes before/after examples and a final silent editing pass.
Preserve caveats and substantive attribution, and repair whole sentences when
cutting clauses. The occasional typo or sentence fragment in a manual edit is
not a voice preference. Do not invent missing facts to make a summary fuller.

## Evidence

- [Week 39 edits](https://github.com/fabianh001/hoeltke.com/commit/6c0861f06d98d041f5878123706c28ba5402e56e)
- [Week 40 edits](https://github.com/fabianh001/hoeltke.com/commit/74598e0426c793c19beef887fe5af870869b6663)
- [Week 41 edits](https://github.com/fabianh001/hoeltke.com/commit/7e055bbcf71d947c50faae52193a361afd3ce108)
- [Week 36 edits](https://github.com/fabianh001/hoeltke.com/commit/cb576e577f68a06a98a48ae8c37b03495a5c06fa)

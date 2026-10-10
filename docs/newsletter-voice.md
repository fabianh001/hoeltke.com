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

HN scores still rank candidates during collection, but the model receives only
the discovery-channel name. Past headlines still support deduplication, but the
prompt treats them as private selection context. Article titles and URLs remain
exact citations; editorial rules apply to authored prose, not original titles.

The prompt includes before/after examples and a final silent editing pass.
Preserve caveats and substantive attribution, and repair whole sentences when
cutting clauses. The occasional typo or sentence fragment in a manual edit is
not a voice preference. Do not invent missing facts to make a summary fuller.

## Evidence

- [Week 39 edits](https://github.com/fabianh001/hoeltke.com/commit/6c0861f06d98d041f5878123706c28ba5402e56e)
- [Week 40 edits](https://github.com/fabianh001/hoeltke.com/commit/74598e0426c793c19beef887fe5af870869b6663)
- [Week 41 edits](https://github.com/fabianh001/hoeltke.com/commit/7e055bbcf71d947c50faae52193a361afd3ce108)
- [Week 36 edits](https://github.com/fabianh001/hoeltke.com/commit/cb576e577f68a06a98a48ae8c37b03495a5c06fa)

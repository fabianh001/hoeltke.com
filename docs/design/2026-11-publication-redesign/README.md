# Publication theme evidence

Baseline: `origin/main` at `1d51be1`. Before and after use the same content and latest issue (`2026-44`). No newsletter copy, source generation, or experimental preview routes are included in this change.

The default light theme preserves the existing page structure. OpenAI Sans carries the reading surfaces; the actual console retains JetBrains Mono. Green `#01a240` is restricted to the light theme's status dot and dollar prompts. The original status pulse is retained, with reduced-motion support.

The footer's **Dark mode** switch restores the original dark palette and persists the explicit choice across reloads, pages and tabs. White is the default even when the OS prefers dark. The console panel remains black in both themes, using its own terminal tokens. The original black/green/purple favicon is retained in both themes. Email templates and generated share images follow the default light palette.

Action buttons use 14px corners and compact labels use 7px corners, following the soft rectangular shapes of [Twelve Labs](https://www.twelvelabs.io/).

## Screenshots

- `before-*`: clean main, original dark theme.
- `after-*`: new default light theme.
- `after-dark-*`: retained dark palette selected through the theme preference.
- Home desktop: 1440 × 1000 first viewport; other desktop pages: 1440 × 1000 full page.
- Mobile: 390 × 844 full page. Favicon: 256 × 256 SVG rendering.
- Email captures: actual generated confirmation and latest-issue HTML in Chromium, 800px wide. These are browser renders, not certification across email clients.

## Validation

- 145 tests pass across 25 test files.
- Production build: 29 pages. Confirmation-email template build passes.
- Chromium: 80 route/viewport checks across light and dark themes at 1440, 1024, 390 and 320px; no horizontal overflow or page exceptions.
- Routes: home, archive, latest article, Terminal, About, Travel, pending/confirmed/expired subscription states, and 404.
- Flows: article navigation; audio play/pause, skipping, speed and keyboard scrub; H/T shortcuts; terminal commands, completion, history, error and clear; subscription validation and signed confirmation; expired confirmation; terminal subscription; touch console scrolling; RSS; favicon; share image; status pulse and reduced motion.
- Theme: white default despite dark OS preference, mouse/Space/Enter toggle, accessible switch state, light/dark control contrast, reload/page/tab persistence, and black terminal in both themes.
- JavaScript disabled: readable white default and articles, with the inactive theme switch hidden.

Subscription checks exercised the real local `server/subscribe.mjs` handler, signed tokens and generated confirmation HTML. Only the Resend transport was replaced with an in-memory response; no real email was sent. Browser checks do not establish production delivery or remote deployment health.

Follow-up verification (2026-11-05): rounded actions/labels and fixed original favicon checked in both themes at desktop and mobile sizes.

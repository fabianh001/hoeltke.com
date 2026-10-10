---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: ["src/layouts/Base.astro","src/pages/terminal.astro","src/components/PostRow.astro","src/pages/digest/index.astro"]
---

# Surface brief — Home and Terminal

Scope: homepage, persistent navigation, archive presentation, and /terminal/.
Visitor mode: Read (Blog), Operate (Terminal).
Audience: readers finding recent AI Weekly posts; peers exploring Fabian through the terminal.
Job: recognize a blog immediately, open a recent issue, or switch to the existing interactive terminal.
Constraints: server-rendered posts and real content; existing issue routes, subscription, RSS and terminal commands remain available. No new client framework or CMS.

## Direction contract

THESIS: A publication first, with a working shell one tab away. Replace the terminal-led homepage with the dated reading index the user explicitly requested.

OWN-WORLD: claude.dev's publication structure in the user's explicitly retained dark palette: pure black canvas, white ink, muted gray metadata, thin neutral rules, mono wayfinding and sans post titles. Purple marks interaction; green marks terminal output. Fabian restored the subtle dot grid and cursor-follow spotlight on the Terminal page only. The publication index and all other pages retain plain backgrounds, with no card stack or decorative glow on the index.

STORY: The visitor sees hoeltke.com, Home and Terminal, then a brief introduction and real dated posts. The latest issue leads with its summary. Opening Terminal presents Fabian's introduction and the complete existing command set.

FIRST VIEWPORT: A 95px top navigation band across the page, with brand left, two route tabs centrally, and Subscribe right. Below at 1440px, a 342px introduction column and a wider post list separated by a generous gutter. Dated rows use date/title/reading-time columns; latest is larger with summary. At 390px the intro precedes stacked post rows and both navigation tabs remain visible. Primary action is opening a post; the subscription action stays in the header and index close.

FORM: User-pinned claude.dev publication index, overriding concept seed b5edb855's assignment. Direct implementation from the live reference; no generated comp. Signature interaction: a persistent Home / Terminal route navigation with an explicit active underline, native browser history, and focus feedback. Motion is limited to 150ms hover/focus transitions; terminal cursor obeys reduced motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Navigation feedback extension

User requested working H / T route shortcuts, the reference's small copy animation, and purple hover highlighting for both bracketed keys. Keep native links and the established dark layout. Focal feedback: a 420ms character scramble in the label on hover or focus, resolving left to right. Labels and keys highlight together; aria-label remains stable. No layout movement and no navigation delay. Reduced motion preserves the complete static label and color/focus feedback. Modifier keys, repeats, composition, and editable fields suppress letter shortcuts. Escape from the terminal input focuses the Terminal route link so H / T are available without intercepting command typing.


## Terminal layout preference

Fabian reverted the fullscreen terminal experiment. Preserve the contained terminal plate, introduction column, top Home / Terminal navigation, and page footer. Working H / T shortcuts, the label scramble, and coordinated key/label hover highlighting remain part of the accepted navigation extension.

## Terminal copy refinement

User requested less explanation and an invitation to play, with hidden commands discoverable through exploration. The left intro is “Go on, poke around.” Supporting copy hints that not everything is listed, without revealing command names or destinations. Initial transcript retains only whoami, Fabian's identity, and Datadog affiliation. Repeated help instructions and paragraphs explaining the site were removed; command buttons already expose help. The keyboard hint is shortened to Esc, then H / T to switch views. Layout and command behavior remain the accepted contained terminal.

## Progressive command discovery

Fabian approved teaching exploration through help rather than revealing surprises in the introductory copy. Help lists ls to look around, cd <path> to open a directory, and a short instruction to type a prefix then press Tab for more commands. The -a hint was removed at Fabian's request. Chuck Norris and the travel destination stay unlisted in help and the page introduction. Existing completion and directory behavior provide the discovery path.

## Mobile scrolling

Fabian requested no double scrolling on the terminal page. At widths up to 760px and on coarse pointers (including mobile landscape/tablets), the transcript has no maximum height and expands with its output. The document is the only vertical scroll surface. New output scrolls the prompt into view on the page; desktop fine-pointer layouts retain the bounded internal transcript and its existing follow behavior. The contained plate and surrounding layout remain unchanged.

## Terminal elevation

Fabian requested a little background shadow so the terminal window feels floating. The contained window now uses a soft downward black shadow plus a restrained purple ambient halo. The effect belongs only to the terminal window; layout, scrolling, and the Terminal-only grid/spotlight remain unchanged.

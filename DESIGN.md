# Reading Copy

The design system for the HTML that `vault-publish` writes.

## Concept

A note that leaves a private vault becomes a handout: the copy you print from your own notebook and pass across a table. Reading Copy borrows from that object. Off-white paper, near-black ink, one blue pencil for links, a yellow highlighter for `==marks==`, and margins wide enough to write in. It is deliberately quiet, because the pages are someone's notes, not a brand: the system should disappear behind the text and still look made on purpose. The one structural idea is the reading column: 38rem wide, about 70 characters a line, set in a book face built for long reading on screens.

## Tokens

Defined as CSS custom properties at the top of `theme/style.css`. Contrast ratios are checked in `test/design.test.ts` (WCAG 2.1 relative luminance).

### Colour, light

| Token       | Hex       | Use                           | Contrast on paper     |
| ----------- | --------- | ----------------------------- | --------------------- |
| `--paper`   | `#fbf8f1` | page                          |                       |
| `--ink`     | `#1c1b19` | body text, headings           | 16.2 : 1              |
| `--muted`   | `#5b574f` | dates, tags, captions         | 6.8 : 1               |
| `--link`    | `#1d4f91` | links (blue pencil)           | 7.7 : 1               |
| `--rule`    | `#d9d1c1` | hairlines, borders (non-text) |                       |
| `--mark`    | `#f7e58a` | highlighter behind ink        | ink on mark 13.6 : 1  |
| `--aside`   | `#f2ede1` | callout ground                | ink on aside 14.7 : 1 |
| `--caution` | `#8a3b12` | caution callout title         | 6.6 : 1 on aside      |

### Colour, dark (`prefers-color-scheme: dark`)

| Token       | Hex       | Contrast on paper     |
| ----------- | --------- | --------------------- |
| `--paper`   | `#171613` |                       |
| `--ink`     | `#ebe6db` | 14.5 : 1              |
| `--muted`   | `#a9a396` | 7.2 : 1               |
| `--link`    | `#93b8ec` | 8.9 : 1               |
| `--rule`    | `#3a372f` |                       |
| `--mark`    | `#5a4b12` | ink on mark 6.9 : 1   |
| `--aside`   | `#211f1b` | ink on aside 13.2 : 1 |
| `--caution` | `#f0a57a` | 8.1 : 1 on aside      |

(The test file holds the exact computed values; the table rounds them.)

### Type

- **Literata** 400, 400 italic, 600 (SIL Open Font License), for everything you read. A book face designed for screens, with sturdy serifs at small sizes and a true italic. Notes are prose, so the body face matters most.
- **Atkinson Hyperlegible** 400, 700 (SIL Open Font License), for everything you scan: the masthead, dates, tags, callout titles, table headers. Designed by the Braille Institute for letter distinction, which suits the small labels.
- Both are self-hosted from `@fontsource` and copied into `fonts/` next to the pages. No webfont service, no system-font fallback stack as the design.

Scale (1rem = 16px): body 1.0625rem / 1.65; small 0.875rem; h3 1.125rem; h2 1.375rem; h1 2rem / 1.2. Headings are Literata 600, never all caps. Labels are Atkinson 0.8125rem, letter-spacing 0.04em.

### Space, shape, depth

Spacing steps 0.25, 0.5, 1, 1.5, 2.5 and 4 rem. Reading column `max-width: 38rem`, side gutter 1.25rem (so 375px screens keep 20px margins). Radius 2px on callouts and code, none elsewhere: paper has square corners. Borders are 1px `--rule` hairlines; callouts have a 3px left rule instead of a box. No shadows, no elevation: everything sits on one sheet.

## Motion

None. The pages are documents; nothing animates, so there is nothing to reduce for `prefers-reduced-motion`. Link underlines change thickness on hover without a transition.

## Iconography

None. Words do the work: "Notes" in the masthead, the date as text, tags as small labels. A callout is marked by its title and its left rule, not an icon.

## Core components

1. **Masthead**: one link back to the index, Atkinson, muted, over a hairline.
2. **Reading column**: the article, h1 title, a meta line (date and tags), then the note.
3. **Link**: blue-pencil colour, underline offset 0.18em, 1px, thickening to 2px on hover and focus.
4. **Callout** (`aside.callout`): aside ground, 3px left rule, Atkinson title; `caution`, `warning` and `danger` titles take `--caution`.
5. **Highlight** (`mark`): highlighter yellow behind ink, no padding change.
6. **Table**: hairline rows, Atkinson headers, horizontal scroll inside its own box on narrow screens.

Focus is always visible: a 2px `--link` outline with 2px offset on every interactive element, and a skip link to the text.

## Rules

1. Never use colour as the only signal. Links are underlined; callout types are named in their titles.
2. Never add a second accent. Blue pencil is for links, the highlighter only for marks, the caution tone only for caution titles.
3. Never let the column grow past 38rem or fall under 1.25rem of gutter; long lines are where reading copy stops being readable.

## Not the website

This theme does not reuse speyyman.github.io's Herbarium system (forest and parchment, vermilion accent, Big Shoulders Display and Geist Mono, numbered plates and rulers). Different object, different job: the site is a catalogue, this is a handout.

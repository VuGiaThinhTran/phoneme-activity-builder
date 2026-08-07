# Phoneme Activity Builder — Assessment 1

A Next.js (React) frontend builder for Speech Pathology teachers, producing two
phoneme-based classroom activities -- **Wordle** and **Word Search** -- each exportable
as a single, standalone, playable `.html` file.

Scaffolded with `npx create-next-app` (App Router, Tailwind CSS), then converted to
**TypeScript**. Every source file under `app/`, `components/`, and `lib/` is `.tsx` or
`.css` only — no `.js`, `.jsx`, or `.ts` files, per the lecturer's guidance that the
frontend should be TSX/CSS only.

## Before you submit

- [ ] Replace the placeholder name/student number in `components/Footer.jsx` and `app/about/page.js`
- [ ] Record your video walkthrough and embed/link it on the About page
- [ ] Fill in the reference list below (minimum 5 sources, APA 7th) and cite them in the video
- [ ] Run `rm -rf node_modules .next` before zipping for submission
- [ ] Confirm the GitHub repo link is included with your submission

## Running locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

`npm run build && npm run start` runs a production build.

## Project structure

```
app/
  layout.tsx           root layout: navbar, footer, cookie-based theme
  page.tsx              Home
  about/page.tsx        About (author, video, project scope)
  wordle/page.tsx       Wordle builder + live preview + Generate
  wordsearch/page.tsx   Word Search builder + live preview + Generate
  settings/page.tsx     Light/dark mode + layout preference (cookies)
components/
  Navbar.tsx            Responsive nav with hamburger menu on mobile
  Footer.tsx
  ThemeToggle.tsx
  PhonemeTile.tsx        Signature element: phoneme tile with IPA hover tooltip
  PhonemeKey.tsx         Phoneme keyboard key with IPA hover tooltip
lib/
  phonemes.tsx            Phoneme reference data + parser for the word-list textarea
  wordsearch.tsx           Word search grid placement algorithm (token-per-cell)
  exportHtml.tsx            Builds the standalone, downloadable .html files
```

### Word Search input format

Teachers type one word per line, with each phoneme separated by a space (this
mirrors how multi-character phonemes like `tʃ` or `dʒ` are written), e.g.:

```
ʃ ɪ p
tʃ ɪ n
θ ɪ n
```

Rows/Cols are configurable, **Generate Puzzle** reshuffles the grid, and
**Show Answers** toggles a dashed outline over the placed words without
revealing them by default.

## Design decisions (talking points for the video)

**Component structure & scalability.** `PhonemeTile` and `PhonemeKey` are the
reusable atoms shared by every page and by the exported HTML's own script -- the
phoneme dataset in `lib/phonemes.js` is the single source of truth, so adding a
word list or database in Assessment 2 only means swapping what feeds these
components, not rebuilding the UI.

**Usability.** Teachers move through a consistent three-step pattern --
configure, preview, generate -- on both the Wordle and Word Search pages, so the
workflow stays predictable even though the two activities are different games.
The Generate button always sits in the same place in the builder panel.

**Accessibility.** Tiles and keys expose the phoneme via `title`/`aria-label`
(not hover alone), guess/board updates go through an `aria-live="polite"`
status region, focus states are visible (`:focus-visible` outline), and colour
is never the only signal -- tile state is also carried in the label text and
border style. `prefers-reduced-motion` disables the tooltip transition.

**Trade-offs.** Assessment 1 fixes the Wordle target word and the Word Search
list rather than letting teachers type arbitrary words -- this keeps the frontend
demonstrable without a backend, at the cost of flexibility that Assessment 2's
database will restore. The exported HTML re-implements the game logic in plain
JS rather than importing React, so the output has zero external dependencies
and opens in any browser exactly as the brief requires.

**Supporting Speech Pathology students and teachers.** Every phoneme is shown
with its English grapheme first (so the interface is not intimidating to a
non-linguist teacher), with the IPA symbol and an example word available on
demand -- mirroring how phonics is usually introduced before IPA notation in
the classroom.

## References

Nielsen, J. (1994). 10 usability heuristics for user interface design. Nielsen Norman   Group. https://www.nngroup.com/articles/ten-usability-heuristics/

Meta Open Source. (n.d.). React documentation. React. Retrieved August 7, 2026, from   https://react.dev/

van Kleeck, A., Gillam, R. B., & McFadden, T. U. (1998). A study of classroom-based   phonological awareness training for preschoolers with speech and/or language   disorders. American Journal of Speech-Language Pathology, 7(3), 65–76.   https://doi.org/10.1044/1058-0360.0703.65

Vercel. (n.d.). Next.js documentation. Next.js. Retrieved August 7, 2026, from   https://nextjs.org/docs

World Wide Web Consortium. (2023). Web Content Accessibility Guidelines (WCAG) 2.2   (W3C Recommendation, updated December 12, 2024). https://www.w3.org/TR/WCAG22/

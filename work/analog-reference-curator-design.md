# Analog Reference Curator Design

Date: 2026-08-12

## Goal

Build a local web workflow that collects five fresh analog/cute/dense web UI references every day, lets the user quickly review them, keeps only selected references, and converts kept references into lightweight development-ready UI briefs instead of accumulating heavy URL piles.

## Confirmed Requirements

- Show candidate websites in a local web UI with direct open links.
- Let the user mark candidates as `KEEP`, `KILL`, or `MAYBE`.
- Preserve `KEEP` items across daily refreshes.
- Drop non-kept candidates during the next daily refresh.
- Collect five new candidates per day at `00:05`.
- Email the user when collection is complete.
- Send a reminder at `21:00` if the user has not marked the day as reviewed.
- Provide a neon-sign style review toggle that can be switched between reviewed and not reviewed.
- Let the user create folders and save kept references into a selected folder.
- Add an `Export Brief` feature that produces a development-ready design brief for a selected folder.
- Prefer extracting frontend essence over storing raw URL bundles.

## Key Product Shape

The app is a small local reference curator, not a generic bookmark manager.

Each candidate card includes:

- Title
- Source URL
- `Open Site` button
- Short aesthetic summary
- Extracted frontend elements
- `KEEP`, `KILL`, `MAYBE` controls
- Folder picker
- New folder control
- Notes field

The dashboard header includes a neon-sign style review indicator:

- `REVIEW OFF`: today has not been confirmed.
- `REVIEW ON`: today has been confirmed.
- The user can click it to toggle either way.

## Data Model

Use JSON files so Codex automations and future development tasks can read them directly.

```txt
work/analog-reference-curator/
  app/
    index.html
    styles.css
    app.js
    server.js
  data/
    candidates.json
    folders.json
    review-state.json
    extraction-cache.json
  library/
    <folder-slug>/
      manifest.json
      design-brief.md
      notes.md
```

## Extracted Candidate Shape

Do not keep only URLs. Each candidate becomes a compact UI ingredient record.

```json
{
  "id": "2026-08-12-kawaii-db",
  "title": "Kawaii DB",
  "url": "https://kawaiie.taniweb.jp/",
  "sourceType": "gallery",
  "status": "MAYBE",
  "folder": null,
  "summary": "Japanese cute web gallery with soft commercial layouts.",
  "frontendElements": {
    "typography": ["small captions", "friendly rounded headings"],
    "layout": ["dense gallery grid", "compact metadata", "small category tags"],
    "color": ["soft pastels", "low-contrast borders"],
    "texture": ["paper-like whitespace", "sticker-like thumbnails"],
    "components": ["tiny badges", "thumbnail cards", "category filters"],
    "motion": ["gentle hover emphasis"]
  },
  "avoid": ["large SaaS hero", "dark startup gradient"],
  "notes": "",
  "createdAt": "2026-08-12T00:05:00+09:00",
  "keptAt": null
}
```

## Folder Manifest Shape

When an item is kept into a folder, the folder manifest stores only the compressed design material needed for future UI work.

```json
{
  "folder": "stationery-desk",
  "updatedAt": "2026-08-12T00:05:00+09:00",
  "mood": ["analog", "cute", "dense", "stationery"],
  "references": [
    {
      "title": "Kawaii DB",
      "url": "https://kawaiie.taniweb.jp/",
      "summary": "Soft Japanese cute layout references.",
      "uiCues": ["small labels", "gentle colors", "compact captions"]
    }
  ],
  "tokens": {
    "density": "compact",
    "radius": "small",
    "shadow": "paper lift",
    "colorMood": "soft mixed pastels",
    "typeMood": "friendly editorial"
  }
}
```

## Export Brief

The `Export Brief` button generates or updates `library/<folder>/design-brief.md`.

The brief includes:

- Folder mood
- Best-use cases
- Visual principles
- Typography guidance
- Layout guidance
- Component ideas
- Color/texture guidance
- Motion guidance
- Things to avoid
- Source references for traceability

The brief is the thing to feed future development work:

> Build this using `work/analog-reference-curator/library/stationery-desk/design-brief.md`.

## Daily Refresh

At `00:05`:

1. Read existing candidates and folders.
2. Preserve all `KEEP` items.
3. Remove old `KILL` and unkept `MAYBE` candidates.
4. Gather five new candidates.
5. For each candidate, extract frontend elements into compact JSON.
6. Save the new candidate list.
7. Set today's review state to not reviewed.
8. Send Gmail collection-complete email.

## Reminder

At `21:00`:

1. Read `review-state.json`.
2. If today's state is reviewed, do nothing.
3. If not reviewed, send a Gmail reminder.

## Extraction Strategy

Extraction should prioritize lightweight frontend essence.

For each candidate, store:

- typography cues
- layout cues
- color cues
- texture cues
- component cues
- motion cues
- avoid cues
- short summary

Screenshots are optional later, but the v1 should avoid a screenshot archive because it can become heavy. If screenshots are added later, keep only one thumbnail per kept item and never use them as the primary development input.

## Implementation Notes

- Use a small local Node server because browser-only `localStorage` would not be readable by scheduled automation.
- Keep file formats plain JSON/Markdown for easy future Codex use.
- Use direct links with `target="_blank"` for source inspection.
- Use stable folder slugs so future prompts can reference folders by name.
- The first collector can use a curated seed list plus web-search expansion. Later versions can add smarter source rotation.

## Open Point

No blocker remains. The main tradeoff is that automated frontend extraction from arbitrary sites is approximate unless the collector fetches pages and possibly screenshots them. For v1, store concise human-usable UI cues inferred from source metadata and page summaries. For v2, add browser-based extraction for CSS colors, font families, layout density, and thumbnails.


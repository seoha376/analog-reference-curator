# Local Curator MVP Design

Date: 2026-08-12

## Scope

Build the first usable local version of Analog Reference Curator. The MVP reads and writes plain JSON, shows the current candidate references, lets the user update review status, add notes, create folders, assign kept references to folders, and toggle today's review state.

## Architecture

Use a small Node HTTP server with no external dependencies so the app can run immediately in this repository. Static assets live in `work/analog-reference-curator/app/`; JSON data lives in `work/analog-reference-curator/data/`; future exported library material will live in `work/analog-reference-curator/library/`.

## User Experience

The first screen is the working review board, not a landing page. It uses a dense analog desk feel: compact cards, small labels, visible source links, status controls, folder controls, notes, and a neon-style review toggle in the header.

## Data

The server persists:

- `data/candidates.json`
- `data/folders.json`
- `data/review-state.json`

Candidate data is seeded from `outputs/analog-cute-web-template-candidates.md` and enriched with lightweight UI cues from the existing design notes.

## Exclusions

This MVP does not automate the 00:05 collection job, Gmail notifications, 21:00 reminders, or `Export Brief`. It creates the local workflow those later tasks will use.

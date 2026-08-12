# Local Curator MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dependency-free local web app for reviewing analog/cute web references.

**Architecture:** A Node HTTP server serves static files and small JSON APIs. Browser JavaScript owns rendering and sends explicit updates back to JSON files.

**Tech Stack:** Node.js built-in `http`, `fs/promises`, HTML, CSS, browser JavaScript.

## Global Constraints

- Keep data as plain JSON and Markdown-compatible structures.
- Do not use browser-only `localStorage` for source-of-truth state.
- Keep the app small enough for scheduled automation to read and update later.

---

### Task 1: Server and Seed Data

**Files:**
- Create: `work/analog-reference-curator/app/server.js`
- Create: `work/analog-reference-curator/data/candidates.json`
- Create: `work/analog-reference-curator/data/folders.json`
- Create: `work/analog-reference-curator/data/review-state.json`

**Interfaces:**
- Produces: `GET /api/state`, `PATCH /api/candidates/:id`, `POST /api/folders`, `PATCH /api/review-state`

- [x] Create the server with static file serving and JSON helpers.
- [x] Seed candidate data from the existing candidate board.
- [x] Seed folders and review state.

### Task 2: Review Board UI

**Files:**
- Create: `work/analog-reference-curator/app/index.html`
- Create: `work/analog-reference-curator/app/styles.css`
- Create: `work/analog-reference-curator/app/app.js`

**Interfaces:**
- Consumes: `GET /api/state`
- Produces: candidate status, notes, folder, and review-state updates through API calls.

- [x] Render the dashboard header and neon review toggle.
- [x] Render candidate cards with source links and UI cue chips.
- [x] Add `KEEP`, `KILL`, and `MAYBE` controls.
- [x] Add folder creation, folder assignment, and notes editing.

### Task 3: Local Verification

**Files:**
- Read: `work/analog-reference-curator/app/server.js`

**Verification:**
- [x] Run the server with Node.
- [x] Request `/api/state` and confirm valid JSON.
- [x] Confirm static `index.html` is served.

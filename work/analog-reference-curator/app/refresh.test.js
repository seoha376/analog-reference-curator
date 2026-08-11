const assert = require("node:assert/strict");
const test = require("node:test");
const { refreshCandidates } = require("./refresh");

const today = "2026-08-12";
const now = "2026-08-12T00:05:00+09:00";

const existing = [
  {
    id: "kept-reference",
    title: "Kept Reference",
    url: "https://example.com/kept",
    status: "KEEP",
    folder: "stationery-desk",
    notes: "still useful",
    createdAt: "2026-08-11T00:05:00+09:00"
  },
  {
    id: "old-maybe",
    title: "Old Maybe",
    url: "https://example.com/maybe",
    status: "MAYBE",
    folder: null,
    notes: "",
    createdAt: "2026-08-11T00:05:00+09:00"
  },
  {
    id: "old-kill",
    title: "Old Kill",
    url: "https://example.com/kill",
    status: "KILL",
    folder: null,
    notes: "",
    createdAt: "2026-08-11T00:05:00+09:00"
  }
];

const seeds = Array.from({ length: 8 }, (_, index) => ({
  id: `seed-${index + 1}`,
  title: `Seed ${index + 1}`,
  url: `https://example.com/seed-${index + 1}`,
  sourceType: "Gallery",
  summary: "Seed summary",
  frontendElements: {
    typography: ["small captions"],
    layout: ["compact grid"],
    color: ["soft accents"],
    texture: [],
    components: [],
    motion: []
  },
  avoid: ["large SaaS hero"]
}));

test("refreshCandidates preserves kept items and fills five new candidates", () => {
  const refreshed = refreshCandidates(existing, seeds, today, now);

  assert.equal(refreshed.length, 6);
  assert.equal(refreshed[0].id, "kept-reference");
  assert.equal(refreshed[0].status, "KEEP");
  assert.equal(refreshed.filter((candidate) => candidate.status === "MAYBE").length, 5);
  assert.equal(refreshed.some((candidate) => candidate.id === "old-maybe"), false);
  assert.equal(refreshed.some((candidate) => candidate.id === "old-kill"), false);
});

test("refreshCandidates skips seed urls already preserved", () => {
  const refreshed = refreshCandidates(
    [
      {
        ...existing[0],
        url: "https://example.com/seed-1"
      }
    ],
    seeds,
    today,
    now
  );

  assert.equal(refreshed.some((candidate) => candidate.id === `${today}-seed-1`), false);
  assert.equal(refreshed.filter((candidate) => candidate.status === "MAYBE").length, 5);
});

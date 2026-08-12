const assert = require("node:assert/strict");
const test = require("node:test");
const { buildDesignBrief, buildFolderManifest } = require("./brief");

const folders = [
  {
    slug: "stationery-desk",
    name: "Stationery Desk",
    mood: ["analog", "cute", "dense", "stationery"]
  }
];

const candidates = [
  {
    title: "Kawaii DB",
    url: "https://kawaiie.taniweb.jp/",
    status: "KEEP",
    folder: "stationery-desk",
    summary: "Soft Japanese cute layout references.",
    frontendElements: {
      typography: ["small captions"],
      layout: ["dense gallery grid"],
      color: ["soft pastels"],
      texture: ["paper-like whitespace"],
      components: ["tiny badges"],
      motion: ["gentle hover emphasis"]
    },
    avoid: ["large SaaS hero"],
    notes: "Keep the tiny captions."
  },
  {
    title: "Neocities Cute Tag",
    url: "https://neocities.org/browse?tag=cute",
    status: "MAYBE",
    folder: "stationery-desk",
    summary: "Should not be exported.",
    frontendElements: {},
    avoid: []
  }
];

test("buildFolderManifest compresses kept references for one folder", () => {
  const manifest = buildFolderManifest("stationery-desk", candidates, folders, "2026-08-12T05:00:00+09:00");

  assert.equal(manifest.folder, "stationery-desk");
  assert.deepEqual(manifest.mood, ["analog", "cute", "dense", "stationery"]);
  assert.equal(manifest.references.length, 1);
  assert.deepEqual(manifest.references[0].uiCues, [
    "small captions",
    "dense gallery grid",
    "soft pastels",
    "paper-like whitespace",
    "tiny badges",
    "gentle hover emphasis"
  ]);
  assert.deepEqual(manifest.cueGroups.typography, ["small captions"]);
  assert.deepEqual(manifest.cueGroups.layout, ["dense gallery grid"]);
  assert.deepEqual(manifest.noteHighlights, ["Keep the tiny captions."]);
});

test("buildDesignBrief renders a development-ready markdown brief", () => {
  const manifest = buildFolderManifest("stationery-desk", candidates, folders, "2026-08-12T05:00:00+09:00");
  const brief = buildDesignBrief(manifest);

  assert.match(brief, /^# Stationery Desk Design Brief/);
  assert.match(brief, /## Typography/);
  assert.match(brief, /small captions/);
  assert.match(brief, /## Implementation Directions/);
  assert.match(brief, /Use this folder when building personal portfolio, small brand hub, project notebook/);
  assert.match(brief, /Keep the tiny captions\./);
  assert.match(brief, /## Things To Avoid/);
  assert.match(brief, /large SaaS hero/);
  assert.match(brief, /https:\/\/kawaiie\.taniweb\.jp\//);
});

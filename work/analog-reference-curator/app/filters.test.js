const assert = require("node:assert/strict");
const test = require("node:test");
const { applyBoardFilters } = require("./filters");

const candidates = [
  {
    title: "Kawaii DB",
    sourceType: "Gallery",
    status: "KEEP",
    folder: "stationery-desk",
    summary: "Soft Japanese cute layout references.",
    notes: "tiny captions"
  },
  {
    title: "Neocities Cute Tag",
    sourceType: "Personal Web",
    status: "KEEP",
    folder: null,
    summary: "Personal handmade web source.",
    notes: ""
  },
  {
    title: "SANKOU! Cute",
    sourceType: "Gallery",
    status: "MAYBE",
    folder: null,
    summary: "Commercial Japanese examples.",
    notes: ""
  }
];

test("applyBoardFilters limits candidates by status", () => {
  const result = applyBoardFilters(candidates, { status: "KEEP", folder: "ALL", query: "", special: "ALL" });

  assert.deepEqual(result.map((candidate) => candidate.title), ["Kawaii DB", "Neocities Cute Tag"]);
});

test("applyBoardFilters limits candidates by folder", () => {
  const result = applyBoardFilters(candidates, {
    status: "ALL",
    folder: "stationery-desk",
    query: "",
    special: "ALL"
  });

  assert.deepEqual(result.map((candidate) => candidate.title), ["Kawaii DB"]);
});

test("applyBoardFilters finds text across title summary source type and notes", () => {
  const result = applyBoardFilters(candidates, { status: "ALL", folder: "ALL", query: "handmade", special: "ALL" });

  assert.deepEqual(result.map((candidate) => candidate.title), ["Neocities Cute Tag"]);
});

test("applyBoardFilters can show kept candidates without folders", () => {
  const result = applyBoardFilters(candidates, {
    status: "ALL",
    folder: "ALL",
    query: "",
    special: "UNFILED_KEEP"
  });

  assert.deepEqual(result.map((candidate) => candidate.title), ["Neocities Cute Tag"]);
});

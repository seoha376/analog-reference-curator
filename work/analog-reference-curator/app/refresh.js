const path = require("path");
const fs = require("fs/promises");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");

function refreshCandidates(existingCandidates, seedCandidates, date, now) {
  const kept = existingCandidates.filter((candidate) => candidate.status === "KEEP");
  const knownUrls = new Set(kept.map((candidate) => candidate.url));
  const fresh = [];

  for (const seed of seedCandidates) {
    if (knownUrls.has(seed.url)) continue;
    fresh.push({
      ...seed,
      id: `${date}-${seed.id}`,
      status: "MAYBE",
      folder: null,
      notes: "",
      createdAt: now,
      keptAt: null
    });
    knownUrls.add(seed.url);
    if (fresh.length === 5) break;
  }

  return [...kept, ...fresh];
}

function todayKst() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function nowKstIso() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace("Z", "+09:00");
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function writeJson(file, value) {
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function runDailyRefresh() {
  const date = todayKst();
  const now = nowKstIso();
  const candidatesFile = path.join(DATA_DIR, "candidates.json");
  const seedsFile = path.join(DATA_DIR, "seed-candidates.json");
  const reviewStateFile = path.join(DATA_DIR, "review-state.json");

  const [existingCandidates, seedCandidates] = await Promise.all([
    readJson(candidatesFile),
    readJson(seedsFile)
  ]);

  const candidates = refreshCandidates(existingCandidates, seedCandidates, date, now);
  await writeJson(candidatesFile, candidates);
  await writeJson(reviewStateFile, { date, reviewed: false, updatedAt: now });

  return {
    date,
    kept: candidates.filter((candidate) => candidate.status === "KEEP").length,
    fresh: candidates.filter((candidate) => candidate.status === "MAYBE").length
  };
}

if (require.main === module) {
  runDailyRefresh()
    .then((result) => {
      console.log(`Daily refresh complete: ${result.kept} kept, ${result.fresh} fresh for ${result.date}`);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

module.exports = {
  refreshCandidates,
  runDailyRefresh
};

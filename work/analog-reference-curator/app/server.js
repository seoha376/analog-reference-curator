const http = require("http");
const path = require("path");
const fs = require("fs/promises");
const { buildDesignBrief, buildFolderManifest } = require("./brief");
const { analyzeCandidateUrl } = require("./analyze");

const PORT = Number(process.env.PORT || 4173);
const ROOT = path.resolve(__dirname, "..");
const APP_DIR = path.join(ROOT, "app");
const DATA_DIR = path.join(ROOT, "data");
const LIBRARY_DIR = path.join(ROOT, "library");

const FILES = {
  candidates: path.join(DATA_DIR, "candidates.json"),
  folders: path.join(DATA_DIR, "folders.json"),
  reviewState: path.join(DATA_DIR, "review-state.json")
};

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

function sendJson(res, status, value) {
  send(res, status, JSON.stringify(value, null, 2));
}

async function readJson(file) {
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw);
}

async function writeJson(file, value) {
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function nowKstIso() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace("Z", "+09:00");
}

async function getState() {
  const [candidates, folders, reviewState] = await Promise.all([
    readJson(FILES.candidates),
    readJson(FILES.folders),
    readJson(FILES.reviewState)
  ]);
  return { candidates, folders, reviewState };
}

async function updateCandidate(id, patch) {
  const allowed = new Set(["status", "folder", "notes"]);
  const candidates = await readJson(FILES.candidates);
  const index = candidates.findIndex((candidate) => candidate.id === id);
  if (index === -1) return null;

  const next = { ...candidates[index] };
  for (const [key, value] of Object.entries(patch)) {
    if (allowed.has(key)) next[key] = value;
  }

  if (patch.status && patch.status !== candidates[index].status) {
    next.keptAt = patch.status === "KEEP" ? nowKstIso() : null;
    if (patch.status !== "KEEP") next.folder = null;
  }

  candidates[index] = next;
  await writeJson(FILES.candidates, candidates);
  return next;
}

async function createFolder(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) {
    const error = new Error("Folder name is required.");
    error.statusCode = 400;
    throw error;
  }

  const folders = await readJson(FILES.folders);
  const baseSlug = slugify(trimmed) || `folder-${Date.now()}`;
  let slug = baseSlug;
  let count = 2;
  while (folders.some((folder) => folder.slug === slug)) {
    slug = `${baseSlug}-${count}`;
    count += 1;
  }

  const folder = {
    slug,
    name: trimmed,
    mood: [],
    createdAt: nowKstIso()
  };
  folders.push(folder);
  await writeJson(FILES.folders, folders);
  return folder;
}

async function exportBrief(folderSlug) {
  const [candidates, folders] = await Promise.all([readJson(FILES.candidates), readJson(FILES.folders)]);
  const manifest = buildFolderManifest(folderSlug, candidates, folders, nowKstIso());
  const folderDir = path.join(LIBRARY_DIR, folderSlug);
  await fs.mkdir(folderDir, { recursive: true });
  await writeJson(path.join(folderDir, "manifest.json"), manifest);
  await fs.writeFile(path.join(folderDir, "design-brief.md"), buildDesignBrief(manifest), "utf8");
  return {
    folder: manifest.folder,
    referenceCount: manifest.references.length,
    manifestPath: `library/${folderSlug}/manifest.json`,
    briefPath: `library/${folderSlug}/design-brief.md`
  };
}

async function analyzeCandidate(id) {
  const candidates = await readJson(FILES.candidates);
  const index = candidates.findIndex((candidate) => candidate.id === id);
  if (index === -1) return null;

  const analysis = await analyzeCandidateUrl(candidates[index].url);
  candidates[index] = {
    ...candidates[index],
    analysis,
    analyzedAt: nowKstIso()
  };
  await writeJson(FILES.candidates, candidates);
  return candidates[index];
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(APP_DIR, requested));

  if (!filePath.startsWith(APP_DIR)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  try {
    const body = await fs.readFile(filePath);
    send(res, 200, body, MIME[path.extname(filePath)] || "application/octet-stream");
  } catch (error) {
    if (error.code === "ENOENT") {
      sendJson(res, 404, { error: "Not found" });
      return;
    }
    throw error;
  }
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/api/state") {
    sendJson(res, 200, await getState());
    return;
  }

  const candidateMatch = url.pathname.match(/^\/api\/candidates\/([^/]+)$/);
  if (req.method === "PATCH" && candidateMatch) {
    const candidate = await updateCandidate(candidateMatch[1], await readBody(req));
    if (!candidate) {
      sendJson(res, 404, { error: "Candidate not found" });
      return;
    }
    sendJson(res, 200, candidate);
    return;
  }

  const analysisMatch = url.pathname.match(/^\/api\/candidates\/([^/]+)\/analyze$/);
  if (req.method === "POST" && analysisMatch) {
    const candidate = await analyzeCandidate(analysisMatch[1]);
    if (!candidate) {
      sendJson(res, 404, { error: "Candidate not found" });
      return;
    }
    sendJson(res, 200, candidate);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/folders") {
    sendJson(res, 201, await createFolder((await readBody(req)).name));
    return;
  }

  const exportMatch = url.pathname.match(/^\/api\/folders\/([^/]+)\/export-brief$/);
  if (req.method === "POST" && exportMatch) {
    sendJson(res, 201, await exportBrief(exportMatch[1]));
    return;
  }

  if (req.method === "PATCH" && url.pathname === "/api/review-state") {
    const current = await readJson(FILES.reviewState);
    const patch = await readBody(req);
    const next = {
      ...current,
      reviewed: Boolean(patch.reviewed),
      updatedAt: nowKstIso()
    };
    await writeJson(FILES.reviewState, next);
    sendJson(res, 200, next);
    return;
  }

  sendJson(res, 404, { error: "API route not found" });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/")) {
      await handleApi(req, res);
      return;
    }
    await serveStatic(req, res);
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: error.message || "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Analog Reference Curator running at http://localhost:${PORT}`);
});

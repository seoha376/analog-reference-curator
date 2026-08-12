const board = document.querySelector("#board");
const stats = document.querySelector("#stats");
const reviewToggle = document.querySelector("#reviewToggle");
const folderForm = document.querySelector("#folderForm");
const folderName = document.querySelector("#folderName");
const briefFolder = document.querySelector("#briefFolder");
const briefResult = document.querySelector("#briefResult");
const exportBrief = document.querySelector("#exportBrief");
const statusFilter = document.querySelector("#statusFilter");
const folderFilter = document.querySelector("#folderFilter");
const searchFilter = document.querySelector("#searchFilter");
const unfiledKeepFilter = document.querySelector("#unfiledKeepFilter");
const template = document.querySelector("#candidateTemplate");
const { applyBoardFilters } = window.AnalogReferenceFilters;

let state = {
  candidates: [],
  folders: [],
  reviewState: { reviewed: false }
};

let boardFilters = {
  status: "ALL",
  folder: "ALL",
  query: "",
  special: "ALL"
};

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

async function loadState() {
  state = await request("/api/state");
  render();
}

function render() {
  renderReviewToggle();
  renderStats();
  renderBriefControls();
  renderFilterControls();
  renderBoard();
}

function renderReviewToggle() {
  const reviewed = Boolean(state.reviewState.reviewed);
  reviewToggle.textContent = reviewed ? "REVIEW ON" : "REVIEW OFF";
  reviewToggle.classList.toggle("is-on", reviewed);
  reviewToggle.setAttribute("aria-pressed", String(reviewed));
}

function renderStats() {
  const counts = state.candidates.reduce(
    (memo, candidate) => {
      memo[candidate.status] = (memo[candidate.status] || 0) + 1;
      return memo;
    },
    { KEEP: 0, KILL: 0, MAYBE: 0 }
  );

  stats.innerHTML = `
    <span>${state.candidates.length} candidates</span>
    <span>${counts.KEEP} keep</span>
    <span>${counts.MAYBE} maybe</span>
    <span>${counts.KILL} kill</span>
  `;
}

function renderFilterControls() {
  const currentFolder = folderFilter.value || boardFilters.folder;
  folderFilter.replaceChildren(new Option("All folders", "ALL"));
  state.folders.forEach((folder) => {
    folderFilter.append(new Option(folder.name, folder.slug));
  });
  folderFilter.value = [...folderFilter.options].some((option) => option.value === currentFolder)
    ? currentFolder
    : "ALL";
  boardFilters.folder = folderFilter.value;
}

function renderBriefControls() {
  briefFolder.replaceChildren();
  state.folders.forEach((folder) => {
    const keptCount = state.candidates.filter(
      (candidate) => candidate.status === "KEEP" && candidate.folder === folder.slug
    ).length;
    briefFolder.append(new Option(`${folder.name} (${keptCount})`, folder.slug));
  });
  exportBrief.disabled = !state.folders.length;
}

function renderBoard() {
  board.replaceChildren();
  const candidates = applyBoardFilters(state.candidates, boardFilters);
  if (!candidates.length) {
    board.innerHTML = `<p class="empty-state">No references match this view.</p>`;
    return;
  }

  candidates.forEach((candidate) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.status = candidate.status;
    node.querySelector(".source-type").textContent = candidate.sourceType;
    node.querySelector("h2").textContent = candidate.title;
    node.querySelector(".open-link").href = candidate.url;
    node.querySelector(".summary").textContent = candidate.summary;
    node.querySelector(".cue-list").replaceChildren(...cueChips(candidate));
    node.querySelector(".analysis").replaceChildren(...analysisChips(candidate));
    node.querySelector(".analyze-button").addEventListener("click", () => analyzeCandidate(candidate.id));

    const statusRow = node.querySelector(".status-row");
    ["KEEP", "MAYBE", "KILL"].forEach((status) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "status-button";
      button.textContent = status;
      button.ariaPressed = String(candidate.status === status);
      button.addEventListener("click", () => saveCandidate(candidate.id, { status }));
      statusRow.append(button);
    });

    const folderSelect = node.querySelector(".folder-select");
    folderSelect.disabled = candidate.status !== "KEEP";
    folderSelect.append(new Option("No folder", ""));
    state.folders.forEach((folder) => {
      folderSelect.append(new Option(folder.name, folder.slug));
    });
    folderSelect.value = candidate.folder || "";
    folderSelect.addEventListener("change", () => {
      saveCandidate(candidate.id, { folder: folderSelect.value || null });
    });

    const notes = node.querySelector(".notes");
    notes.value = candidate.notes || "";
    notes.addEventListener("change", () => {
      saveCandidate(candidate.id, { notes: notes.value });
    });

    board.append(node);
  });
}

function analysisChips(candidate) {
  if (!candidate.analysis) {
    const empty = document.createElement("span");
    empty.className = "analysis-empty";
    empty.textContent = "No v2 analysis yet.";
    return [empty];
  }

  return [
    `density: ${candidate.analysis.density}`,
    ...candidate.analysis.colors.slice(0, 3).map((color) => `color: ${color}`),
    ...candidate.analysis.fontFamilies.slice(0, 2).map((font) => `font: ${font}`)
  ].map((value) => {
    const chip = document.createElement("span");
    chip.className = "analysis-chip";
    chip.textContent = value;
    return chip;
  });
}

function cueChips(candidate) {
  const groups = candidate.frontendElements || {};
  return Object.entries(groups).flatMap(([group, values]) =>
    values.slice(0, 3).map((value) => {
      const chip = document.createElement("span");
      chip.className = "cue-chip";
      chip.textContent = `${group}: ${value}`;
      return chip;
    })
  );
}

async function saveCandidate(id, patch) {
  await request(`/api/candidates/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
  await loadState();
}

async function analyzeCandidate(id) {
  await request(`/api/candidates/${id}/analyze`, { method: "POST" });
  await loadState();
}

reviewToggle.addEventListener("click", async () => {
  await request("/api/review-state", {
    method: "PATCH",
    body: JSON.stringify({ reviewed: !state.reviewState.reviewed })
  });
  await loadState();
});

folderForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = folderName.value.trim();
  if (!name) return;
  await request("/api/folders", {
    method: "POST",
    body: JSON.stringify({ name })
  });
  folderName.value = "";
  await loadState();
});

exportBrief.addEventListener("click", async () => {
  const slug = briefFolder.value;
  if (!slug) return;
  briefResult.textContent = "Exporting...";
  const result = await request(`/api/folders/${slug}/export-brief`, { method: "POST" });
  briefResult.innerHTML = `${result.referenceCount} references exported to <code>${result.briefPath}</code>`;
});

statusFilter.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-status]");
  if (!button) return;
  boardFilters.status = button.dataset.status;
  statusFilter.querySelectorAll("button").forEach((item) => {
    item.setAttribute("aria-pressed", String(item === button));
  });
  renderBoard();
});

folderFilter.addEventListener("change", () => {
  boardFilters.folder = folderFilter.value;
  renderBoard();
});

searchFilter.addEventListener("input", () => {
  boardFilters.query = searchFilter.value;
  renderBoard();
});

unfiledKeepFilter.addEventListener("change", () => {
  boardFilters.special = unfiledKeepFilter.checked ? "UNFILED_KEEP" : "ALL";
  renderBoard();
});

loadState().catch((error) => {
  board.innerHTML = `<p class="error">${error.message}</p>`;
});

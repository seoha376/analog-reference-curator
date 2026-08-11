const board = document.querySelector("#board");
const stats = document.querySelector("#stats");
const reviewToggle = document.querySelector("#reviewToggle");
const folderForm = document.querySelector("#folderForm");
const folderName = document.querySelector("#folderName");
const template = document.querySelector("#candidateTemplate");

let state = {
  candidates: [],
  folders: [],
  reviewState: { reviewed: false }
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

function renderBoard() {
  board.replaceChildren();
  state.candidates.forEach((candidate) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.status = candidate.status;
    node.querySelector(".source-type").textContent = candidate.sourceType;
    node.querySelector("h2").textContent = candidate.title;
    node.querySelector(".open-link").href = candidate.url;
    node.querySelector(".summary").textContent = candidate.summary;
    node.querySelector(".cue-list").replaceChildren(...cueChips(candidate));

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

loadState().catch((error) => {
  board.innerHTML = `<p class="error">${error.message}</p>`;
});

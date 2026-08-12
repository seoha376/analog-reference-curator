"use client";

import { useMemo, useState } from "react";

type CandidateStatus = "KEEP" | "MAYBE" | "KILL";

type Candidate = {
  id: string;
  title: string;
  url: string;
  sourceType: string;
  summary: string;
  frontendElements: Record<string, string[]>;
  avoid: string[];
};

type Folder = {
  slug: string;
  name: string;
};

type ReviewState = {
  status: CandidateStatus;
  folder: string;
  notes: string;
};

type Props = {
  initialCandidates: Candidate[];
  folders: Folder[];
};

const emptyState = (candidate: Candidate): ReviewState => ({
  status: "MAYBE",
  folder: "",
  notes: ""
});

export function CuratorBoard({ initialCandidates, folders }: Props) {
  const [states, setStates] = useState<Record<string, ReviewState>>(() =>
    Object.fromEntries(initialCandidates.map((candidate) => [candidate.id, emptyState(candidate)]))
  );
  const [statusFilter, setStatusFilter] = useState<"ALL" | CandidateStatus>("ALL");
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return initialCandidates.filter((candidate) => {
      const state = states[candidate.id] || emptyState(candidate);
      if (statusFilter !== "ALL" && state.status !== statusFilter) return false;
      if (!needle) return true;
      return [candidate.title, candidate.sourceType, candidate.summary, state.notes]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [initialCandidates, query, states, statusFilter]);

  const counts = initialCandidates.reduce(
    (memo, candidate) => {
      const status = (states[candidate.id] || emptyState(candidate)).status;
      memo[status] += 1;
      return memo;
    },
    { KEEP: 0, MAYBE: 0, KILL: 0 }
  );

  function updateCandidate(id: string, patch: Partial<ReviewState>) {
    setStates((current) => ({
      ...current,
      [id]: {
        ...(current[id] || emptyState(initialCandidates.find((candidate) => candidate.id === id)!)),
        ...patch
      }
    }));
  }

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">Analog Reference Curator</p>
          <h1>Mobile reference board</h1>
        </div>
        <div className="review-pill">{counts.KEEP} KEEP</div>
      </header>

      <section className="panel">
        <div className="stats">
          <span>{initialCandidates.length} candidates</span>
          <span>{counts.KEEP} keep</span>
          <span>{counts.MAYBE} maybe</span>
          <span>{counts.KILL} kill</span>
        </div>
        <div className="filters">
          {(["ALL", "KEEP", "MAYBE", "KILL"] as const).map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={statusFilter === status}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
        <label className="search">
          Search
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </section>

      <section className="board">
        {shown.map((candidate) => {
          const state = states[candidate.id] || emptyState(candidate);
          return (
            <article className="candidate" data-status={state.status} key={candidate.id}>
              <div className="candidate-head">
                <div>
                  <p className="source">{candidate.sourceType}</p>
                  <h2>{candidate.title}</h2>
                </div>
                <a href={candidate.url} target="_blank" rel="noreferrer">
                  Open
                </a>
              </div>
              <p className="summary">{candidate.summary}</p>
              <div className="chips">
                {Object.entries(candidate.frontendElements)
                  .flatMap(([group, values]) => values.slice(0, 2).map((value) => `${group}: ${value}`))
                  .map((chip) => (
                    <span key={chip}>{chip}</span>
                  ))}
              </div>
              <div className="statuses">
                {(["KEEP", "MAYBE", "KILL"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={state.status === status}
                    onClick={() => updateCandidate(candidate.id, { status })}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <label>
                Folder
                <select
                  value={state.folder}
                  disabled={state.status !== "KEEP"}
                  onChange={(event) => updateCandidate(candidate.id, { folder: event.target.value })}
                >
                  <option value="">No folder</option>
                  {folders.map((folder) => (
                    <option key={folder.slug} value={folder.slug}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Notes
                <textarea
                  rows={3}
                  value={state.notes}
                  onChange={(event) => updateCandidate(candidate.id, { notes: event.target.value })}
                />
              </label>
            </article>
          );
        })}
      </section>
    </main>
  );
}

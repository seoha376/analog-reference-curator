(function attachFilters(root) {
  function applyBoardFilters(candidates, filters) {
    const status = filters.status || "ALL";
    const folder = filters.folder || "ALL";
    const special = filters.special || "ALL";
    const query = normalize(filters.query || "");

    return candidates.filter((candidate) => {
      if (status !== "ALL" && candidate.status !== status) return false;
      if (folder !== "ALL" && candidate.folder !== folder) return false;
      if (special === "UNFILED_KEEP" && !(candidate.status === "KEEP" && !candidate.folder)) return false;
      if (query && !candidateMatchesQuery(candidate, query)) return false;
      return true;
    });
  }

  function candidateMatchesQuery(candidate, query) {
    return [
      candidate.title,
      candidate.sourceType,
      candidate.summary,
      candidate.notes
    ].some((value) => normalize(value || "").includes(query));
  }

  function normalize(value) {
    return String(value).trim().toLowerCase();
  }

  root.AnalogReferenceFilters = { applyBoardFilters };

  if (typeof module !== "undefined") {
    module.exports = { applyBoardFilters };
  }
})(typeof globalThis !== "undefined" ? globalThis : window);

function buildFolderManifest(folderSlug, candidates, folders, updatedAt) {
  const folder = folders.find((entry) => entry.slug === folderSlug);
  if (!folder) {
    const error = new Error("Folder not found.");
    error.statusCode = 404;
    throw error;
  }

  const references = candidates
    .filter((candidate) => candidate.status === "KEEP" && candidate.folder === folderSlug)
    .map((candidate) => ({
      title: candidate.title,
      url: candidate.url,
      summary: candidate.summary,
      notes: candidate.notes || "",
      uiCues: flattenCues(candidate.frontendElements),
      avoid: candidate.avoid || []
    }));

  const cueGroups = groupCues(references);
  const noteHighlights = unique(references.map((reference) => reference.notes).filter(Boolean));
  const avoid = unique(references.flatMap((reference) => reference.avoid || []));

  return {
    folder: folder.slug,
    name: folder.name,
    updatedAt,
    mood: folder.mood || [],
    references,
    cueGroups,
    noteHighlights,
    avoid,
    tokens: inferTokens(references)
  };
}

function buildDesignBrief(manifest) {
  const cueGroups = manifest.cueGroups || groupCues(manifest.references);
  const avoid = manifest.avoid || unique(manifest.references.flatMap((reference) => reference.avoid || []));
  const useCases = bestUseCases(manifest);

  return [
    `# ${manifest.name} Design Brief`,
    "",
    `Updated: ${manifest.updatedAt}`,
    "",
    "## Folder Mood",
    listOrEmpty(manifest.mood),
    "",
    "## Best-Use Cases",
    listOrEmpty(useCases),
    "",
    "## Visual Principles",
    listOrEmpty([
      "Prefer compressed, inspectable UI ingredients over raw URL piles.",
      `Keep density ${manifest.tokens.density} with ${manifest.tokens.radius} radius and ${manifest.tokens.shadow} shadow.`,
      `Use a ${manifest.tokens.colorMood} color mood and ${manifest.tokens.typeMood} type mood.`
    ]),
    "",
    "## Implementation Directions",
    listOrEmpty([
      `Use this folder when building ${useCases.join(", ")}.`,
      "Start from the layout cues first, then layer typography, texture, and motion.",
      ...implementationDirections(cueGroups),
      ...noteDirections(manifest.noteHighlights || [])
    ]),
    "",
    "## Typography",
    listOrEmpty(cueGroups.typography),
    "",
    "## Layout",
    listOrEmpty(cueGroups.layout),
    "",
    "## Component Ideas",
    listOrEmpty(cueGroups.components),
    "",
    "## Color And Texture",
    listOrEmpty([...cueGroups.color, ...cueGroups.texture]),
    "",
    "## Motion",
    listOrEmpty(cueGroups.motion),
    "",
    "## Things To Avoid",
    listOrEmpty(avoid),
    "",
    "## Source References",
    listOrEmpty(
      manifest.references.map((reference) => `${reference.title}: ${reference.url} - ${reference.summary}`)
    ),
    ""
  ].join("\n");
}

function implementationDirections(cueGroups) {
  const directions = [];
  if (cueGroups.layout.length) directions.push(`Layout: ${cueGroups.layout.join("; ")}.`);
  if (cueGroups.typography.length) directions.push(`Typography: ${cueGroups.typography.join("; ")}.`);
  if (cueGroups.components.length) directions.push(`Components: ${cueGroups.components.join("; ")}.`);
  if (cueGroups.color.length || cueGroups.texture.length) {
    directions.push(`Surface: ${[...cueGroups.color, ...cueGroups.texture].join("; ")}.`);
  }
  if (cueGroups.motion.length) directions.push(`Motion: ${cueGroups.motion.join("; ")}.`);
  return directions;
}

function noteDirections(notes) {
  return notes.map((note) => `User note: ${note}`);
}

function flattenCues(frontendElements = {}) {
  return ["typography", "layout", "color", "texture", "components", "motion"].flatMap(
    (group) => frontendElements[group] || []
  );
}

function groupCues(references) {
  const groups = {
    typography: [],
    layout: [],
    color: [],
    texture: [],
    components: [],
    motion: []
  };

  references.forEach((reference) => {
    (reference.uiCues || []).forEach((cue) => {
      const bucket = Object.keys(groups).find((group) => cueBelongsTo(cue, group)) || "components";
      groups[bucket].push(cue);
    });
  });

  Object.keys(groups).forEach((key) => {
    groups[key] = unique(groups[key]);
  });
  return groups;
}

function cueBelongsTo(cue, group) {
  const text = cue.toLowerCase();
  const patterns = {
    typography: ["caption", "heading", "text", "lettering", "type", "label"],
    layout: ["grid", "spacing", "section", "column", "sidebar", "rhythm"],
    color: ["color", "pastel", "palette", "accent", "contrast"],
    texture: ["paper", "texture", "shadow", "border", "sticker", "pixel"],
    components: ["badge", "card", "filter", "tab", "panel"],
    motion: ["hover", "motion", "transition", "animated"]
  };
  return patterns[group].some((pattern) => text.includes(pattern));
}

function inferTokens(references) {
  const allCues = references.flatMap((reference) => reference.uiCues || []).join(" ").toLowerCase();
  return {
    density: allCues.includes("dense") || allCues.includes("compact") ? "compact" : "moderate",
    radius: allCues.includes("paper") || allCues.includes("sticker") ? "small" : "soft",
    shadow: allCues.includes("paper") ? "paper lift" : "light lift",
    colorMood: allCues.includes("pastel") ? "soft mixed pastels" : "warm mixed accents",
    typeMood: allCues.includes("caption") ? "friendly editorial" : "personal handmade"
  };
}

function bestUseCases(manifest) {
  const mood = manifest.mood.join(" ");
  if (mood.includes("stationery")) return ["personal portfolio", "small brand hub", "project notebook"];
  if (mood.includes("editorial")) return ["blog", "curation board", "record archive"];
  if (mood.includes("catalog")) return ["goods catalog", "digital product shelf", "recommendation list"];
  if (mood.includes("night")) return ["memo app", "reading log", "personal workspace"];
  if (mood.includes("community")) return ["event board", "class page", "local project hub"];
  return ["small website", "reference-led UI exploration"];
}

function listOrEmpty(items) {
  const uniqueItems = unique(items).filter(Boolean);
  if (!uniqueItems.length) return "- No kept references yet.";
  return uniqueItems.map((item) => `- ${item}`).join("\n");
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

module.exports = {
  buildDesignBrief,
  buildFolderManifest
};

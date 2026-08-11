function analyzeHtml(html) {
  const colors = unique([
    ...html.match(/#[0-9a-fA-F]{3,8}\b/g) || [],
    ...html.match(/rgba?\([^)]+\)/g) || []
  ]).slice(0, 8);
  const fontFamilies = extractFontFamilies(html).slice(0, 6);
  const density = inferDensity(html);

  return {
    colors,
    fontFamilies,
    density,
    summary: `${colors.length} colors, ${fontFamilies.length} font stacks, ${density} layout density`
  };
}

async function analyzeCandidateUrl(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    headers: {
      "User-Agent": "AnalogReferenceCurator/0.1"
    }
  });
  if (!response.ok) {
    const error = new Error(`Analysis fetch failed: ${response.status}`);
    error.statusCode = 502;
    throw error;
  }
  return analyzeHtml(await response.text());
}

function extractFontFamilies(html) {
  const matches = [...html.matchAll(/font-family\s*:\s*([^;}]+)/gi)];
  return unique(matches.map((match) => match[1].trim()));
}

function inferDensity(html) {
  const elementCount = (html.match(/<\/?[a-z][^>]*>/gi) || []).length;
  const textLength = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
  const score = elementCount + Math.floor(textLength / 160);
  if (score >= 18) return "compact";
  if (score >= 9) return "moderate";
  return "airy";
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

module.exports = {
  analyzeCandidateUrl,
  analyzeHtml
};

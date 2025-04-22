// Utility for normalization and fuzzy matching of category/document names

/**
 * Normalize a category or document name for robust comparison.
 * - Lowercase
 * - Remove numeric prefixes (e.g., "04_", "02-")
 * - Replace underscores/hyphens with spaces
 * - Trim whitespace
 */
export function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/^\s*\d+[_-]/, "") // Remove leading numbers and _ or - (including any whitespace)
    .replace(/[_-]+/g, " ")    // Replace underscores/hyphens with space
    .replace(/\s+/g, " ")     // Collapse multiple spaces
    .trim();
}

/**
 * Compute Levenshtein distance between two strings (for fuzzy matching)
 */
function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,    // deletion
          matrix[i][j - 1] + 1,    // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

/**
 * Find the best match for user input among candidates using normalization and fuzzy matching.
 * Returns the best match (if above threshold) and suggestions if ambiguous.
 */
export function findBestMatch(input: string, candidates: string[], opts?: { threshold?: number, maxSuggestions?: number }): { match: string | null, score: number, suggestions: string[] } {
  const normInput = normalizeName(input);

  // Create an array of candidates with both original and normalized forms
  const normCandidates = candidates.map(c => ({
    original: c,
    norm: normalizeName(c)
  }));

  // First try exact normalized match
  const exact = normCandidates.find(c => c.norm === normInput);
  if (exact) return { match: exact.original, score: 1, suggestions: [] };

  // Fuzzy match: compute Levenshtein distance
  const scored = normCandidates.map(c => ({
    original: c.original,
    norm: c.norm,
    distance: levenshtein(normInput, c.norm)
  }));
  scored.sort((a, b) => a.distance - b.distance);

  const best = scored[0];
  const threshold = opts?.threshold ?? 3; // Allow up to 3 edits for fuzzy match

  if (best.distance <= threshold) {
    // Use slice(1) to exclude the best match from suggestions
    const suggestions = scored.slice(1)
      .filter(s => s.distance <= threshold)
      .map(s => s.original);

    return {
      match: best.original,
      score: 1 - best.distance / Math.max(normInput.length, best.norm.length),
      suggestions
    };
  }

  // No good match, suggest top N
  const maxSuggestions = opts?.maxSuggestions ?? 3;
  return {
    match: null,
    score: 0,
    suggestions: scored.slice(0, maxSuggestions).map(s => s.original)
  };
}

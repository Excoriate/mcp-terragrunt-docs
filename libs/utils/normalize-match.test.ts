import { normalizeName, findBestMatch } from "./normalize-match.ts";

Deno.test("normalizeName basic normalization", () => {
  const cases = [
    ["04_reference", "reference"],
    ["01_getting-started", "getting started"],
    ["COMMUNITY", "community"],
    ["features", "features"],
    ["  02-features  ", "features"],
    ["log-formatting", "log formatting"],
    ["10-log_formatting", "log formatting"],
    ["  11-terraGRUNT-cache  ", "terragrunt cache"],
    ["  03_built-in-functions  ", "built in functions"],
    ["troubleshooting", "troubleshooting"],
  ];
  for (const [input, expected] of cases) {
    if (normalizeName(input) !== expected) {
      throw new Error(`normalizeName('${input}') !== '${expected}' (got '${normalizeName(input)}')`);
    }
  }
});

Deno.test("findBestMatch exact and normalized match", () => {
  const candidates = [
    "04_reference",
    "01_getting-started",
    "02_features",
    "03_community",
    "log-formatting",
    "10-log_formatting",
  ];
  // Exact
  const result1 = findBestMatch("04_reference", candidates);
  if (result1.match !== "04_reference") throw new Error("Exact match failed");
  // Normalized
  const result2 = findBestMatch("reference", candidates);
  if (result2.match !== "04_reference") throw new Error("Normalized match failed");
  const result3 = findBestMatch("getting started", candidates);
  if (result3.match !== "01_getting-started") throw new Error("Normalized match failed");
  const result4 = findBestMatch("log formatting", candidates);
  if (result4.match !== "log-formatting" && result4.match !== "10-log_formatting") throw new Error("Normalized match failed");
});

Deno.test("findBestMatch fuzzy/typo match", () => {
  const candidates = ["reference", "features", "community", "troubleshooting"];
  const result1 = findBestMatch("refernece", candidates);
  if (result1.match !== "reference") throw new Error("Fuzzy match for typo failed");
  const result2 = findBestMatch("featuers", candidates);
  if (result2.match !== "features") throw new Error("Fuzzy match for typo failed");
});

Deno.test("findBestMatch ambiguous/partial match returns suggestions", () => {
  const candidates = ["reference", "refactoring", "referee"];
  const result = findBestMatch("ref", candidates, { threshold: 2, maxSuggestions: 2 });
  if (result.match !== null && result.suggestions.length < 2) throw new Error("Ambiguous match should return suggestions");
});

Deno.test("findBestMatch no match returns suggestions", () => {
  const candidates = ["reference", "features", "community"];
  const result = findBestMatch("xyz", candidates);
  if (result.match !== null && result.suggestions.length === 0) throw new Error("No match should return suggestions");
}); 
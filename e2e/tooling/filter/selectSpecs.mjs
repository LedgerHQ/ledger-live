/* eslint-disable no-console */
// Selects which Detox spec files a mobile E2E run should execute for a given filter.
// Run from the repo root by the mobile E2E workflows (via e2e/mobile/scripts/shard-tests.mjs);
// not imported by the test runtime (specs, page objects, fixtures).
import fs from "node:fs";
import path from "node:path";

// Cross-platform deterministic string comparison.
export function compareStrings(a, b) {
  const normalizedA = path.normalize(a);
  const normalizedB = path.normalize(b);

  return normalizedA.localeCompare(normalizedB, "en", {
    sensitivity: "case",
    numeric: true,
    ignorePunctuation: false,
  });
}

export function findTestFiles(dir) {
  // Collect recursively (unsorted), then sort once — a single authoritative order.
  return collectSpecFiles(dir).sort(compareStrings);
}

// Recurses outside the try so a failed directory read is wrapped/logged once at the failing
// level and propagates cleanly, instead of being re-caught and re-wrapped at every ancestor.
function collectSpecFiles(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    if (e.code === "ENOENT") return [];
    console.error("[select-specs] Error reading directory:", dir, e);
    throw new Error(`Failed to read directory ${dir}: ${e.message}`);
  }

  const results = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectSpecFiles(fullPath));
    } else if (entry.name.endsWith(".spec.ts") && !entry.name.endsWith(".skip.spec.ts")) {
      results.push(fullPath);
    }
  }
  return results;
}

// Extract a spec's declared `@` tags so filtering matches tags, not arbitrary file text.
function extractDeclaredTags(fileContent) {
  const literals = fileContent.match(/['"`]@[\w-]+['"`]/g) ?? [];
  return literals.map(literal => literal.slice(1, -1));
}

export function filterTestFiles(files, testFilter) {
  if (!testFilter) return files;
  // Split into OR alternatives on whitespace, "," or "|", then match literally (case-insensitive).
  // The mobile filter only carries tags / paths / substrings — never regex — so we avoid
  // building a RegExp from a command-line argument (regex-injection / ReDoS risk).
  const needles = testFilter
    .toLowerCase()
    .split(/[\s,|]+/)
    .filter(Boolean);
  if (needles.length === 0) return files;

  const filtered = files.filter(filePath => {
    // Match by path (target a file/folder) or by a declared tag, never raw file text.
    if (needles.some(needle => filePath.toLowerCase().includes(needle))) return true;
    try {
      const tags = extractDeclaredTags(fs.readFileSync(filePath, "utf8"));
      return tags.some(tag => needles.some(needle => tag.toLowerCase().includes(needle)));
    } catch {
      return false;
    }
  });

  return filtered.sort(compareStrings);
}

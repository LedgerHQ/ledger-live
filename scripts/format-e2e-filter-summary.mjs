#!/usr/bin/env node
/* eslint-disable no-console */

// Renders the resolved E2E filter as a readable Markdown bullet list for the
// "Workflow Context" job summary. Long anchored Playwright filters like
// "Foo(?! [^@])|Bar\, baz(?! [^@])" are hard to read, so we strip the leaf-title
// anchor and unescape regex-escaped characters, then list one pattern per bullet.

import { fileURLToPath } from "node:url";

const LABEL = "- **Filtered pattern:**";

// Split on '|' separators, ignoring escaped '\|' that belong to a single pattern
// (mirrors resolve-e2e-test-filter.mjs so the counts stay in sync).
function splitFilter(input) {
  return input
    .split(/(?<!\\)\|/)
    .map(part => part.trim())
    .filter(Boolean);
}

function humanizePattern(pattern) {
  return (
    pattern
      // Drop the "(?! [^@])" leaf-title anchor appended to Playwright titles.
      .replace(/\(\?! \[\^@\]\)/g, "")
      // Unescape regex-escaped characters (\. \- \, \| \[ \( …) back to literals.
      .replace(/\\(.)/g, "$1")
      .trim()
  );
}

export function formatFilterSummary(rawInput = "") {
  const input = String(rawInput).trim();
  if (!input || input === "(none)") {
    return `${LABEL} (none)`;
  }

  const patterns = splitFilter(input).map(humanizePattern).filter(Boolean);

  if (patterns.length === 0) {
    return `${LABEL} (none)`;
  }
  if (patterns.length === 1) {
    return `${LABEL} ${patterns[0]}`;
  }

  const lines = [`${LABEL} (${patterns.length} patterns)`];
  for (const pattern of patterns) {
    lines.push(`  - ${pattern}`);
  }
  return lines.join("\n");
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile) {
  console.log(formatFilterSummary(process.argv[2] ?? ""));
}

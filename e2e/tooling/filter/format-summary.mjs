#!/usr/bin/env node
/* eslint-disable no-console */

import { fileURLToPath } from "node:url";

import { splitFilter, stripLeafAnchor, unescapeLiteral } from "./escaping.mjs";

const LABEL = "- **Filtered pattern:**";

function humanizePattern(pattern) {
  return unescapeLiteral(stripLeafAnchor(pattern)).trim();
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

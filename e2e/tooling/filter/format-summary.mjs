#!/usr/bin/env node
/* eslint-disable no-console */

import { fileURLToPath } from "node:url";

import { splitFilter, stripLeafAnchor, stripSpecAnchor, unescapeLiteral } from "./escaping.mjs";

const DEFAULT_LABEL = "- **Filtered pattern:**";
// A team expansion is up to 21 mobile needles or 13 desktop basenames. Listing them all buries
// the rest of the "Workflow Context" block QA are told to read.
const MAX_BULLETS = 10;

function humanizePattern(pattern) {
  return unescapeLiteral(stripSpecAnchor(stripLeafAnchor(pattern))).trim();
}

export function formatFilterSummary(rawInput = "", label = DEFAULT_LABEL) {
  const LABEL = label || DEFAULT_LABEL;
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
  for (const pattern of patterns.slice(0, MAX_BULLETS)) {
    lines.push(`  - ${pattern}`);
  }
  if (patterns.length > MAX_BULLETS) {
    lines.push(`  - …and ${patterns.length - MAX_BULLETS} more`);
  }
  return lines.join("\n");
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile) {
  console.log(formatFilterSummary(process.argv[2] ?? "", process.argv[3]));
}

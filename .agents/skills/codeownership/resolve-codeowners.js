#!/usr/bin/env node
// Resolve CODEOWNERS for a list of files, with the same matcher CI uses
//
// Usage:
//   git diff --name-only HEAD~1 | node .agents/skills/codeownership/resolve-codeowners.js
//   node .agents/skills/codeownership/resolve-codeowners.js apps/ledger-live-desktop/src/foo.ts
//   node .agents/skills/codeownership/resolve-codeowners.js --codeowners /path/to/CODEOWNERS <files...>
//   node .agents/skills/codeownership/resolve-codeowners.js --check
//
// Output: space-aligned columns (CODEOWNERS style) — "file    @owner1 @owner2" or "file    (no owner)"

"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const VALIDATOR = "tools/actions/composites/validate-codeowners/validate-codeowners.js";
const { gitRoot, findCodeowners, parseCodeowners, compileRules, resolveOwners } = require(
  path.join(__dirname, "../../..", VALIDATOR),
);

function formatOutput(rows) {
  const maxLen = Math.max(...rows.map(([f]) => f.length));
  return rows
    .map(([file, owners]) => `${file}${" ".repeat(Math.max(1, maxLen - file.length + 2))}${owners}`)
    .join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const root = gitRoot();

  if (args.includes("--check")) {
    try {
      execFileSync(process.execPath, [path.join(root, VALIDATOR)], { stdio: "inherit", cwd: root });
    } catch (error) {
      process.exit(error.status ?? 1);
    }
    return;
  }

  let codeownersPath = null;
  const flagIdx = args.indexOf("--codeowners");
  if (flagIdx !== -1) {
    const next = args[flagIdx + 1];
    if (!next || next.startsWith("--")) {
      console.error("Error: --codeowners requires a file path argument.");
      process.exit(1);
    }
    codeownersPath = path.resolve(root, next);
    args.splice(flagIdx, 2);
  }

  if (!codeownersPath) {
    const relative = findCodeowners(root);
    if (!relative) {
      console.error(
        "Error: CODEOWNERS file not found (tried .github/CODEOWNERS, CODEOWNERS, docs/CODEOWNERS)",
      );
      process.exit(1);
    }
    codeownersPath = path.join(root, relative);
  }

  const rules = compileRules(parseCodeowners(fs.readFileSync(codeownersPath, "utf8")));

  let files = args;
  if (files.length === 0) {
    files = fs.readFileSync(0, "utf8").split(/\r?\n/).filter(Boolean);
  }
  if (files.length === 0) {
    console.error("No files provided. Pass paths as arguments or pipe via stdin.");
    process.exit(1);
  }

  const rows = files.map(file => {
    const rel = path.isAbsolute(file) ? path.relative(root, file) : file;
    const owners = resolveOwners(rules, rel.replace(/^\.?\//, "").replace(/\\/g, "/"));
    return [rel, owners.length ? owners.join(" ") : "(no owner)"];
  });

  console.log(formatOutput(rows));
}

main();

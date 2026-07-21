#!/usr/bin/env node
// Resolve CODEOWNERS for a list of files (last-rule-wins, gitignore semantics)
//
// Usage:
//   git diff --name-only HEAD~1 | node .agents/skills/codeownership/resolve-codeowners.js
//   node .agents/skills/codeownership/resolve-codeowners.js apps/ledger-live-desktop/src/foo.ts
//   node .agents/skills/codeownership/resolve-codeowners.js --codeowners /path/to/CODEOWNERS <files...>
//
// Output: space-aligned columns (CODEOWNERS style) — "file    @owner1 @owner2" or "file    (no owner)"
// Deps: uses the `ignore` package from the monorepo pnpm store — no extra dep to add (requires pnpm install)

"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ── Resolve `ignore` from pnpm store or fallback ──────────────────────────────
function semverDesc(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pb[i] || 0) - (pa[i] || 0);
    if (diff !== 0) return diff; // descending: highest first
  }
  return 0;
}

function loadIgnore(gitRoot) {
  // 1. Try monorepo pnpm virtual store (populated by pnpm install)
  const pnpmDir = path.join(gitRoot, "node_modules", ".pnpm");
  if (fs.existsSync(pnpmDir)) {
    const versionOf = d => d.slice("ignore@".length).replace(/[_+].*$/, "");
    const dirs = fs
      .readdirSync(pnpmDir)
      .filter(d => /^ignore@/.test(d))
      .sort((a, b) => semverDesc(versionOf(a), versionOf(b))); // highest first
    const v5 = dirs.find(d => /^ignore@5\./.test(d));
    const chosen = v5 ?? dirs[0];
    if (chosen) {
      return require(path.join(pnpmDir, chosen, "node_modules", "ignore"));
    }
  }
  // 2. Try standard node_modules resolution from repo root or script directory
  for (const searchPath of [gitRoot, __dirname]) {
    try {
      return require(require.resolve("ignore", { paths: [searchPath] }));
    } catch (_) {}
  }
  // 3. Give up with a clear message
  console.error(
    "Error: `ignore` package not found. Install it locally:\n" +
      `  npm install --prefix "${__dirname}" --no-save --no-package-lock ignore@5\n` +
      "Then re-run the script.",
  );
  process.exit(1);
}

// ── Git root detection ────────────────────────────────────────────────────────
function getGitRoot() {
  try {
    return execSync("git rev-parse --show-toplevel", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return process.cwd();
  }
}

// ── CODEOWNERS file location ──────────────────────────────────────────────────
function findCodeowners(gitRoot) {
  for (const rel of ["CODEOWNERS", ".github/CODEOWNERS", "docs/CODEOWNERS"]) {
    const p = path.join(gitRoot, rel);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// ── Parse CODEOWNERS → [{pattern, owners}] ───────────────────────────────────
function parseCodeowners(content) {
  return content
    .split("\n")
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#"))
    .map(l => {
      const parts = l.split(/\s+/);
      return { pattern: parts[0], owners: parts.slice(1) };
    });
}

// ── Compile rules: one ignore instance per pattern ───────────────────────────
function compileRules(rules, ignore) {
  return rules.map(({ pattern, owners }) => {
    try {
      const ig = ignore().add(pattern);
      return { test: p => ig.ignores(p), owners };
    } catch (err) {
      process.stderr.write(
        `[resolve-codeowners] Warning: skipping invalid pattern "${pattern}": ${err.message}\n`,
      );
      return { test: () => false, owners };
    }
  });
}

// ── Resolve owners for a file (last-rule-wins) ───────────────────────────────
function resolveOwners(filePath, compiledRules) {
  const normalized = filePath.replace(/^\.\//, "").replace(/^\//, "").replace(/\\/g, "/");
  if (!normalized) return [];
  let owners = [];
  for (const { test, owners: ruleOwners } of compiledRules) {
    if (test(normalized)) owners = ruleOwners;
  }
  return owners;
}

// ── Align output columns ──────────────────────────────────────────────────────
function formatOutput(rows) {
  const maxLen = Math.max(...rows.map(([f]) => f.length));
  return rows
    .map(([file, owners]) => {
      const pad = " ".repeat(Math.max(1, maxLen - file.length + 2));
      return `${file}${pad}${owners}`;
    })
    .join("\n");
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);

  const gitRoot = getGitRoot();
  const ignore = loadIgnore(gitRoot);

  // --codeowners <path> override — resolved against git root for consistency
  let codeownersPath = null;
  const flagIdx = args.indexOf("--codeowners");
  if (flagIdx !== -1) {
    const next = args[flagIdx + 1];
    if (!next || next.startsWith("--")) {
      console.error("Error: --codeowners requires a file path argument.");
      process.exit(1);
    }
    codeownersPath = path.resolve(gitRoot, next);
    args.splice(flagIdx, 2);
  }

  codeownersPath ??= findCodeowners(gitRoot);
  if (!codeownersPath) {
    console.error(
      "Error: CODEOWNERS file not found (tried CODEOWNERS, .github/CODEOWNERS, docs/CODEOWNERS)",
    );
    process.exit(1);
  }

  const rules = parseCodeowners(fs.readFileSync(codeownersPath, "utf8"));
  const compiledRules = compileRules(rules, ignore);

  // File list: args or stdin
  let files = args;
  if (files.length === 0) {
    const stdin = fs.readFileSync(0, "utf8"); // fd 0 = stdin, portable
    files = stdin.split(/\r?\n/).filter(Boolean); // handle CRLF and LF
  }

  if (files.length === 0) {
    console.error("No files provided. Pass paths as arguments or pipe via stdin.");
    process.exit(1);
  }

  const rows = files.map(file => {
    const rel = path.isAbsolute(file) ? path.relative(gitRoot, file) : file;
    const owners = resolveOwners(rel, compiledRules);
    return [rel, owners.length ? owners.join(" ") : "(no owner)"];
  });

  console.log(formatOutput(rows));
}

main();

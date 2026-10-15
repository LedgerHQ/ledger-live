#!/usr/bin/env node
// Record the set of files every oxfmt invocation in the repository processes.
//
// oxfmt cannot print the config or file list it resolves, so a deliberately different style (tabs,
// width 20) is injected into every oxfmt config for the duration of the run: each file a run
// processes then shows up in `--list-different`. Every `oxfmt` call in a package script is
// replayed as written, plus the whole-tree run the git hook performs. Configs are restored
// afterwards.
//
//   fmt-snapshot.mjs snap out.json      run from the repository root, with a clean tree
//   fmt-snapshot.mjs diff before.json after.json

import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  cli,
  git,
  gitFiles,
  node,
  readSnapshot,
  requireFromRoot,
  splitArgs,
  unionKeys,
  writeSnapshot,
} from "./shared.mjs";

/** @typedef {{ args: string[], files: string[] }} Invocation `files` repo-relative, sorted */

const OXFMT = path.join(ROOT, "node_modules/oxfmt/bin/oxfmt");

// A style no file in the repository follows, so every file a run processes differs from it.
const FORCE = { useTabs: true, printWidth: 20, semi: false, singleQuote: true };

const HOOK = "git hook (whole tree)";

/**
 * oxfmt configs: every `.oxfmtrc.json`, and the `oxfmt.config.mts` files that define a config
 * rather than re-export one (those get the forced style through the file they import).
 *
 * @returns {string[]}
 */
export function configs() {
  return gitFiles().filter(
    file =>
      file.endsWith(".oxfmtrc.json") ||
      (file.endsWith("oxfmt.config.mts") &&
        fs.readFileSync(file, "utf8").includes("defineConfig({")),
  );
}

/**
 * Rewrites a config with the {@link FORCE} style. A `.mts` config gets the options injected into
 * its `defineConfig({` call, with its own `printWidth` removed so the forced one wins.
 *
 * @param {string} file
 */
function force(file) {
  const text = fs.readFileSync(file, "utf8");
  if (file.endsWith(".json")) {
    // oxfmt configs are JSONC; TypeScript's tsconfig reader parses that dialect.
    const { config, error } = requireFromRoot("typescript").parseConfigFileTextToJson(file, text);
    if (error) throw new Error(`${file}: cannot parse`);
    delete config.$schema;
    fs.writeFileSync(file, JSON.stringify({ ...config, ...FORCE }, null, 2));
  } else {
    const inject = Object.entries(FORCE)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(", ");
    const stripped = text.replace(/\n\s*printWidth: \d+,/g, "");
    fs.writeFileSync(
      file,
      stripped.replace("defineConfig({", () => `defineConfig({ ${inject},`),
    );
  }
}

/**
 * Every distinct oxfmt call in a package script, plus the git hook's whole-tree run. `--check` and
 * `--write` are dropped: the snapshot replays each call with `--list-different` instead.
 *
 * @returns {{ cwd: string, args: string[], label: string }[]} `label` is `<package.json>#<script>`
 */
export function invocations() {
  const found = [];
  for (const manifest of gitFiles("*package.json")) {
    let scripts;
    try {
      scripts = JSON.parse(fs.readFileSync(manifest, "utf8")).scripts ?? {};
    } catch {
      continue;
    }
    const seen = new Set();
    for (const [name, script] of Object.entries(scripts)) {
      for (const segment of script.split("&&")) {
        const args = splitArgs(segment.trim().replace(/^pnpm exec /, ""));
        if (args[0] !== "oxfmt") continue;
        const kept = args.slice(1).filter(arg => arg !== "--check" && arg !== "--write");
        const key = JSON.stringify(kept);
        if (seen.has(key)) continue;
        seen.add(key);
        found.push({ cwd: path.dirname(manifest), args: kept, label: `${manifest}#${name}` });
      }
    }
  }
  found.push({ cwd: ".", args: ["."], label: HOOK });
  return found;
}

/**
 * Forces the style, replays every invocation, then restores the configs from git, failure or not.
 *
 * @param {string} outPath receives `{ [label]: Invocation }`
 */
export async function snap(outPath) {
  const targets = configs();
  if (git("status", "--porcelain", "--", ...targets).trim()) {
    console.error(
      "refusing to run with modified oxfmt configs: they are rewritten, then restored from git",
    );
    process.exit(1);
  }
  const result = {};
  try {
    for (const file of targets) force(file);
    for (const { cwd, args, label } of invocations()) {
      const proc = await node(
        [OXFMT, "--list-different", "--no-error-on-unmatched-pattern", ...args],
        {
          cwd: path.join(ROOT, cwd),
        },
      );
      const files = proc.stdout
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => path.normalize(path.join(cwd, line)))
        .sort();
      result[label] = { args, files };
    }
  } finally {
    git("checkout", "--", ...targets);
  }
  writeSnapshot(outPath, result);
  console.log(`${Object.keys(result).length} invocations, ${targets.length} configs`);
}

/**
 * Prints, per invocation, the files it no longer formats and the ones it newly formats.
 *
 * @param {string} beforePath base snapshot
 * @param {string} afterPath branch snapshot
 */
export function diff(beforePath, afterPath) {
  const before = readSnapshot(beforePath);
  const after = readSnapshot(afterPath);
  const labels = unionKeys(before, after);
  let differing = 0;
  for (const label of labels) {
    if (!before[label] || !after[label]) {
      console.log(`${before[label] ? "-" : "+"} ${label}`);
      differing += 1;
      continue;
    }
    const beforeFiles = new Set(before[label].files);
    const afterFiles = new Set(after[label].files);
    const gone = [...beforeFiles].filter(file => !afterFiles.has(file));
    const added = [...afterFiles].filter(file => !beforeFiles.has(file));
    if (gone.length === 0 && added.length === 0) continue;
    differing += 1;
    console.log(`~ ${label}: ${beforeFiles.size} -> ${afterFiles.size}`);
    for (const file of gone.slice(0, 8)) console.log(`    no longer formatted  ${file}`);
    for (const file of added.slice(0, 8)) console.log(`    newly formatted      ${file}`);
  }
  console.log(`\n${differing} of ${labels.length} invocations differ`);
}

await cli(import.meta.url, { snap, diff });

#!/usr/bin/env node
// Resolve every tsconfig in the repository and record what TypeScript would compile.
//
// For each tsconfig*.json: the compilerOptions and references TypeScript resolves, as
// `tsc --showConfig` prints them (implied options included, path options made repo-relative), read
// in-process through the checkout's compiler API; and the program's file list from
// `tsc --listFilesOnly`. Two configs with the same options and the same program compile
// identically, so diffing two snapshots proves a config refactor changes nothing.
//
//   tsconfig-snapshot.mjs snap out.json          run from the repository root
//   tsconfig-snapshot.mjs diff before.json after.json

import fs from "node:fs";
import path from "node:path";
import {
  CPUS,
  ROOT,
  cli,
  clip,
  gitFiles,
  mapPool,
  node,
  readSnapshot,
  requireFromRoot,
  same,
  unionKeys,
  writeSnapshot,
} from "./shared.mjs";

/**
 * @typedef {object} ResolvedConfig
 * @property {Record<string, unknown>} compilerOptions as `tsc --showConfig` prints them
 * @property {string[]} references repo-relative paths of the referenced projects
 * @property {string[]} program repo-relative, sorted: every file the program loads, lib and
 *   `@types` declarations included
 */

/** @typedef {ResolvedConfig | { error: string }} ConfigEntry */

const ts = requireFromRoot("typescript");

// The checkout's tsc entry point. Read from the package's `bin` rather than hard-coded: the
// installed TypeScript names it `tsc6`, and a wrong path would fail every run.
const TSC = (() => {
  const manifest = requireFromRoot.resolve("typescript/package.json");
  const { bin } = JSON.parse(fs.readFileSync(manifest, "utf8"));
  const [, script] = Object.entries(bin).find(([name]) => /^tsc\d*$/.test(name));
  return path.join(path.dirname(manifest), script);
})();

// Options holding one path, which `--showConfig` prints relative to the config.
const PATH_OPTIONS = new Set(["outDir", "rootDir", "declarationDir", "tsBuildInfoFile", "baseUrl"]);

/**
 * Every tsconfig*.json in the checkout, tracked or new (a migration adds configs before it
 * commits them), ignored files excepted.
 *
 * @returns {string[]} repo-relative, sorted
 */
export function configs() {
  const untracked = gitFiles("--others", "--exclude-standard");
  return [...gitFiles(), ...untracked]
    .filter(file => /(^|\/)tsconfig[^/]*\.json$/.test(file) && fs.existsSync(file))
    .sort();
}

/**
 * Makes the path options of a `--showConfig` output repo-relative. They are printed relative to the
 * config, so the same directory reached from two configs would otherwise compare different.
 *
 * @param {string} configDir absolute directory of the config
 * @param {Record<string, unknown>} options `compilerOptions` from `--showConfig`
 * @returns {Record<string, unknown>}
 */
function repoRelative(configDir, options) {
  const relative = value => path.relative(ROOT, path.resolve(configDir, value)) || ".";
  return Object.fromEntries(
    Object.entries(options).map(([key, value]) => {
      if (PATH_OPTIONS.has(key) && typeof value === "string") return [key, relative(value)];
      if (key === "rootDirs" || key === "typeRoots") return [key, value.map(relative)];
      if (key === "paths") {
        return [
          key,
          Object.fromEntries(Object.entries(value).map(([k, vs]) => [k, vs.map(relative)])),
        ];
      }
      return [key, value];
    }),
  );
}

/**
 * Resolves symlinks, so a workspace package reached through `node_modules/@scope/name` and through
 * its own directory is recorded once, under its real path.
 *
 * @param {string} file absolute path
 * @returns {string}
 */
function realpath(file) {
  try {
    return fs.realpathSync(file);
  } catch {
    return path.resolve(file);
  }
}

/**
 * @param {string} file repo-relative config path
 * @returns {Promise<ConfigEntry>}
 */
async function resolve(file) {
  const configPath = path.join(ROOT, file);
  const configDir = path.dirname(configPath);

  const diagnostics = [];
  const parsed = ts.getParsedCommandLineOfConfigFile(configPath, undefined, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: diagnostic => diagnostics.push(diagnostic),
  });
  const errors = [...diagnostics, ...(parsed?.errors ?? [])].filter(
    diagnostic => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  if (!parsed || errors.length > 0) {
    return {
      error: ts
        .flattenDiagnosticMessageText(errors[0]?.messageText, "\n")
        .replaceAll(`${ROOT}/`, ""),
    };
  }
  // What `tsc --showConfig` prints; exported at runtime though missing from the type declarations.
  // It adds the options TypeScript implies (`moduleDetection` from `module`, for instance), so a
  // refactor that spells an implied option out, or stops implying it, shows up.
  const shown = ts.convertToTSConfig(parsed, configPath, ts.sys);

  // The program comes from tsc itself, one process per config. Building it in-process would mean
  // sharing parsed files across programs, and TypeScript stores per-program state on them.
  const listed = await node([TSC, "-p", path.basename(file), "--listFilesOnly"], {
    cwd: configDir,
  });
  const program = listed.stdout
    .split(/\r?\n/)
    .filter(line => line.startsWith("/"))
    .map(line => path.relative(ROOT, realpath(line.trim())))
    .sort();
  // A solution-style config (`files: []`, references only) has an empty program and exits 0.
  if (listed.exit !== 0 && program.length === 0) {
    return { error: clip(listed.stdout || listed.stderr, 400).replaceAll(`${ROOT}/`, "") };
  }
  return {
    compilerOptions: repoRelative(configDir, shown.compilerOptions ?? {}),
    references: (parsed.projectReferences ?? []).map(reference =>
      path.relative(ROOT, reference.path),
    ),
    program,
  };
}

/** @param {string} outPath receives `{ [configPath]: ConfigEntry }` */
export async function snap(outPath) {
  const files = configs();
  const resolved = await mapPool(files, CPUS, resolve);
  const data = Object.fromEntries(files.map((file, index) => [file, resolved[index]]));
  writeSnapshot(outPath, data);
  const failed = files.filter(file => "error" in data[file]);
  console.log(`${files.length} configs resolved, ${failed.length} failed`);
  for (const file of failed.slice(0, 20)) console.log("  FAIL", file, clip(data[file].error, 160));
}

/**
 * Prints configs added (`+`), removed (`-`) or changed (`~`, with each option that changed and
 * the files the program gained or lost).
 *
 * @param {string} beforePath base snapshot
 * @param {string} afterPath branch snapshot
 */
export function diff(beforePath, afterPath) {
  const before = readSnapshot(beforePath);
  const after = readSnapshot(afterPath);
  const keys = unionKeys(before, after);
  let changed = 0;
  for (const key of keys) {
    const b = before[key];
    const a = after[key];
    if (same(b, a)) continue;
    changed += 1;
    if (!b || !a) {
      console.log(b ? "-" : "+", key);
      continue;
    }
    console.log("~", key);
    for (const top of unionKeys(b, a)) {
      const bv = b[top];
      const av = a[top];
      if (same(bv, av)) continue;
      if (top === "compilerOptions") {
        for (const option of unionKeys(bv, av)) {
          const bo = bv?.[option];
          const ao = av?.[option];
          if (!same(bo, ao))
            console.log(`    ${option}: ${JSON.stringify(bo)} -> ${JSON.stringify(ao)}`);
        }
      } else if (top === "program" && bv && av) {
        const beforeSet = new Set(bv);
        const afterSet = new Set(av);
        const gone = bv.filter(f => !afterSet.has(f));
        const added = av.filter(f => !beforeSet.has(f));
        console.log(
          `    program: ${bv.length} -> ${av.length} files, -${gone.length} +${added.length}`,
        );
        for (const f of gone.slice(0, 5)) console.log(`      - ${f}`);
        for (const f of added.slice(0, 5)) console.log(`      + ${f}`);
      } else {
        console.log(
          `    ${top}: ${clip(JSON.stringify(bv), 150)} -> ${clip(JSON.stringify(av), 150)}`,
        );
      }
    }
  }
  console.log(`\n${changed} configs differ of ${keys.length}`);
}

await cli(import.meta.url, { snap, diff });

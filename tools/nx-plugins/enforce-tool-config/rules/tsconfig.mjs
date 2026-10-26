// The tsconfig rule: every TypeScript config of a package extends an @support/tsconfig preset,
// directly or through a sibling config, and carries only what a preset cannot know.
//
// A config may set `extends`, `references`, `include`, `exclude`, `files`,
// `compilerOptions.types` and `compilerOptions.paths`: what TypeScript replaces instead of merging,
// or what only the package knows. Every other compiler option belongs to a preset. The one way
// around it is a relaxation of the preset strictness that tsconfig-debt.mjs lists for that file,
// with its relaxed value; that list only shrinks. A key whose value is what the config would
// inherit anyway is rejected.

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { RELAXATIONS, TSCONFIG_DEBT } from "./tsconfig-debt.mjs";

const require = createRequire(import.meta.url);

const PRESET_PACKAGE = "@support/tsconfig";
const PRESET_ROOT = "support/tsconfig";
const DEBT_FILE = "tools/nx-plugins/enforce-tool-config/rules/tsconfig-debt.mjs";

const TOP_LEVEL_KEYS = new Set([
  "extends",
  "compilerOptions",
  "references",
  "include",
  "exclude",
  "files",
]);
const FILE_KEYS = ["include", "exclude", "files"];
const ALLOWED_OPTIONS = new Set(["types", "paths"]);
// Options `strict` turns on when they are not set.
const STRICT_FAMILY = new Set(["noImplicitAny", "noImplicitThis"]);

// Build outputs and installs, which hold copied configs that are not the package's own.
const SKIP_DIRS = new Set(["node_modules", "lib", "lib-es", "dist", "build", "coverage", ".turbo"]);

/** @typedef {import("./index.mjs").Violation} Violation */

/**
 * Spawns a tsc process, so a check opens it lazily: most runs are cache hits.
 * @param {string} cwd
 */
function openTypeScript(cwd) {
  const { API, DiagnosticCategory } = require("typescript/sync");
  const { serverFS } = require("typescript/fs");
  /** @type {string[]} */
  let read = [];
  const api = new API({
    cwd,
    fs: {
      directoryExists: serverFS.useOS,
      fileExists: serverFS.useOS,
      // Source files are not listed: the rule compares options and file specs, never programs.
      getAccessibleEntries: () => ({ files: [], directories: [], symlinks: [] }),
      readFile: file => {
        read.push(file);
        return serverFS.useOS;
      },
      realpath: serverFS.useOS,
      stat: serverFS.useOS,
      writeFile: serverFS.error,
      removeFile: serverFS.error,
    },
  });
  return {
    DiagnosticCategory,
    /** @param {string} file absolute */
    readConfigFile: file => api.readConfigFile(file),
    /**
     * Parses `config` as TypeScript does when it is the content of `file`.
     * @param {string} file absolute
     * @param {unknown} config
     * @returns {{ parsed: ParsedCommandLine, read: string[] }} read: files the parse read, extends included
     */
    parse(file, config) {
      read = [];
      const parsed = api.parseJsonConfigFileContent(config, { configFileName: file });
      return { parsed, read };
    },
    close: () => api.close(),
  };
}

/**
 * @typedef {import("typescript/sync").ParsedCommandLine} ParsedCommandLine
 * @typedef {import("typescript/sync").Diagnostic} Diagnostic
 * @typedef {ReturnType<typeof openTypeScript>} TypeScript
 */

/**
 * @param {string} workspaceRoot
 * @returns {Set<string>} the preset specifiers the package exports, e.g. "@support/tsconfig/lib"
 */
function presetSpecifiers(workspaceRoot) {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(workspaceRoot, PRESET_ROOT, "package.json"), "utf8"),
  );
  return new Set(
    Object.keys(manifest.exports ?? {})
      .filter(key => key !== "./package.json")
      .map(key => `${PRESET_PACKAGE}/${key.slice(2)}`),
  );
}

/**
 * The tsconfig*.json files of a package, nested ones included, without descending into build
 * outputs or into a nested package, which is a project of its own.
 *
 * @param {string} packageDir absolute
 * @returns {string[]} absolute paths, sorted
 */
export function findConfigs(packageDir) {
  const out = [];
  /** @param {string} dir */
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    if (dir !== packageDir && entries.some(entry => entry.name === "package.json")) return;
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith(".")) walk(full);
      } else if (/^tsconfig.*\.json$/.test(entry.name)) {
        out.push(full);
      }
    }
  }
  walk(packageDir);
  return out.sort();
}

// "No inputs were found": expected, since `parse` lists no source files.
const NO_INPUTS = 18003;

/**
 * @param {TypeScript} ts
 * @param {ParsedCommandLine} parsed
 * @returns {Diagnostic[]}
 */
function errorsOf(ts, parsed) {
  return parsed.errors.filter(
    diagnostic =>
      diagnostic.category === ts.DiagnosticCategory.Error && diagnostic.code !== NO_INPUTS,
  );
}

/**
 * @param {Diagnostic} diagnostic
 * @param {string} [indent]
 * @returns {string} the message and its chain, one nested message per line
 */
function messageOf(diagnostic, indent = "") {
  return [
    indent + diagnostic.text,
    ...(diagnostic.messageChain ?? []).map(next => messageOf(next, `${indent}  `)),
  ].join("\n");
}

/**
 * What a parsed config resolves `key` to: the compiler option, the value a relaxation takes when
 * unset, or the file specs as absolute paths (`${configDir}` substituted, relative specs resolved
 * against the config).
 *
 * @param {ParsedCommandLine} parsed
 * @param {string} key a compiler option, or one of FILE_KEYS
 * @param {string} configDir absolute
 * @returns {string} comparable serialisation
 */
function resolvedValue(parsed, key, configDir) {
  if (Object.hasOwn(RELAXATIONS, key)) {
    const { options } = parsed;
    return String(options[key] ?? (STRICT_FAMILY.has(key) && options.strict === true));
  }
  if (!FILE_KEYS.includes(key)) return JSON.stringify(parsed.options[key]);
  const specs = parsed.raw?.[key];
  if (!Array.isArray(specs)) return "unset";
  return JSON.stringify(
    specs.map(spec => path.resolve(configDir, spec.replaceAll("${configDir}", configDir))),
  );
}

/**
 * @param {object} config
 * @param {string} key
 * @param {boolean} isOption whether `key` sits under `compilerOptions`
 * @returns {object} a copy of `config` without the key
 */
function without(config, key, isOption) {
  if (!isOption) {
    const { [key]: _removed, ...rest } = config;
    return rest;
  }
  const { [key]: _removed, ...options } = config.compilerOptions;
  return { ...config, compilerOptions: options };
}

/**
 * @param {string} entry one `extends` entry
 * @param {string} configDir absolute
 * @param {string} packageDir absolute
 * @param {Set<string>} presets
 * @param {Set<string>} checked absolute paths of the package configs this rule checks
 * @returns {string | undefined} why the entry is not allowed
 */
function extendsProblem(entry, configDir, packageDir, presets, checked) {
  if (typeof entry !== "string") return "must be a string";
  if (entry.startsWith(`${PRESET_PACKAGE}/`)) {
    return presets.has(entry) ? undefined : `"${entry}" is not a preset ${PRESET_PACKAGE} exports`;
  }
  if (!entry.startsWith("."))
    return `"${entry}" is neither a ${PRESET_PACKAGE} preset nor a sibling config`;
  const target = path.resolve(configDir, entry);
  const inside = target.startsWith(`${packageDir}${path.sep}`);
  if (!inside)
    return `"${entry}" points outside the package; extend a ${PRESET_PACKAGE} preset instead`;
  const found = [target, `${target}.json`].find(candidate => fs.existsSync(candidate));
  if (!found) return `"${entry}" does not exist`;
  // A parent the rule never reads could carry any option past the whitelist and the debt list.
  return checked.has(found)
    ? undefined
    : `"${entry}" is not a tsconfig*.json this rule checks; name the parent tsconfig.<name>.json`;
}

/**
 * @param {import("./index.mjs").RuleContext} context
 * @param {{ debt?: Record<string, string[]> }} [overrides] for tests
 * @returns {Violation[]}
 */
export function check({ workspaceRoot, projectRoot }, { debt = TSCONFIG_DEBT } = {}) {
  const packageDir = path.join(workspaceRoot, projectRoot);
  const presets = presetSpecifiers(workspaceRoot);
  /** @type {Violation[]} */
  const violations = [];

  const configs = findConfigs(packageDir);
  const checked = new Set(configs);
  const basePreset = realpath(path.join(workspaceRoot, PRESET_ROOT, "base.json"));
  const relative = file => path.relative(workspaceRoot, file).split(path.sep).join("/");

  /** @type {TypeScript | undefined} */
  let session;
  const ts = () => (session ??= openTypeScript(workspaceRoot));
  try {
    for (const file of configs) {
      const name = relative(file);
      const configDir = path.dirname(file);
      const report = message => violations.push({ file: name, message });

      const { config, error } = ts().readConfigFile(file);
      if (error) {
        report(`cannot be parsed: ${messageOf(error)}`);
        continue;
      }

      for (const key of Object.keys(config)) {
        if (!TOP_LEVEL_KEYS.has(key)) report(`"${key}" is not allowed in a package tsconfig`);
      }

      const entries = config.extends === undefined ? [] : [config.extends].flat();
      if (entries.length === 0) report(`must extend a ${PRESET_PACKAGE} preset`);
      const problems = entries
        .map(entry => extendsProblem(entry, configDir, packageDir, presets, checked))
        .filter(Boolean);
      for (const problem of problems) report(`extends ${problem}`);

      const listed = new Set(debt[name] ?? []);
      const options = config.compilerOptions ?? {};
      for (const [key, value] of Object.entries(options)) {
        if (ALLOWED_OPTIONS.has(key)) continue;
        if (!Object.hasOwn(RELAXATIONS, key)) {
          report(`compilerOptions.${key} belongs to a preset: extend the preset that sets it`);
        } else if (value !== RELAXATIONS[key]) {
          report(`compilerOptions.${key} may only relax the preset, to ${RELAXATIONS[key]}`);
        } else if (!listed.has(key)) {
          report(
            `compilerOptions.${key} relaxes the strictness of its preset: fix the code instead, or list it in ${DEBT_FILE}`,
          );
        }
      }
      for (const key of listed) {
        if (options[key] !== RELAXATIONS[key]) {
          report(
            `${DEBT_FILE} lists compilerOptions.${key}, which the config no longer relaxes; remove it`,
          );
        }
      }

      // Whether a key repeats what the config inherits only means something once extends resolves.
      if (problems.length > 0) continue;
      const { parsed, read } = ts().parse(file, config);
      const [firstError] = errorsOf(ts(), parsed);
      if (firstError) {
        report(`does not resolve: ${messageOf(firstError)}`);
        continue;
      }
      // The lib/build, lib/esm and lib/tests mixins only add to an archetype: on their own they
      // leave out the base options, `strict` among them.
      if (entries.length > 0 && !read.some(parent => realpath(parent) === basePreset)) {
        report(
          `inherits no ${PRESET_PACKAGE} archetype: extend one before a lib/build, lib/esm or lib/tests mixin`,
        );
      }
      const keys = [
        ...Object.keys(options).map(key => ({
          key,
          isOption: true,
          label: `compilerOptions.${key}`,
        })),
        ...FILE_KEYS.filter(key => key in config).map(key => ({
          key,
          isOption: false,
          label: key,
        })),
      ];
      for (const { key, isOption, label } of keys) {
        const { parsed: inherited } = ts().parse(file, without(config, key, isOption));
        if (resolvedValue(parsed, key, configDir) === resolvedValue(inherited, key, configDir)) {
          report(`${label} repeats what the config inherits; remove it`);
        }
      }
    }
  } finally {
    session?.close();
  }

  // Entries for configs that are gone, so the debt list cannot keep a dead file alive.
  const present = new Set(configs.map(relative));
  for (const name of Object.keys(debt)) {
    if (
      name.startsWith(`${projectRoot}/`) &&
      !present.has(name) &&
      !isInNestedPackage(workspaceRoot, projectRoot, name)
    ) {
      violations.push({
        file: DEBT_FILE,
        message: `lists ${name}, which does not exist; remove it`,
      });
    }
  }

  return violations;
}

/**
 * @param {string} file
 * @returns {string} `file` with symlinks resolved, or as given when it does not exist
 */
function realpath(file) {
  try {
    return fs.realpathSync(file);
  } catch {
    return file;
  }
}

/**
 * Whether `file` belongs to a package nested below `projectRoot`, which reports its own entries.
 *
 * @param {string} workspaceRoot
 * @param {string} projectRoot
 * @param {string} file repo-relative
 * @returns {boolean}
 */
function isInNestedPackage(workspaceRoot, projectRoot, file) {
  let dir = path.posix.dirname(file);
  while (dir !== projectRoot && dir.startsWith(`${projectRoot}/`)) {
    if (fs.existsSync(path.join(workspaceRoot, dir, "package.json"))) return true;
    dir = path.posix.dirname(dir);
  }
  return false;
}

/** @type {import("./index.mjs").Rule} */
export default {
  name: "tsconfig",
  inputs: ["{projectRoot}/**/tsconfig*.json", `{workspaceRoot}/${PRESET_ROOT}/**/*`],
  check,
};

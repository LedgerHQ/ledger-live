// The tsconfig rule: every TypeScript config of a package extends an @support/tsconfig preset,
// directly or through a sibling config, and carries only what a preset cannot know.
//
// A config may set `extends`, `references`, `include`, `exclude`, `files` and
// `compilerOptions.types`. Any other compiler option is a departure from the archetype, accepted
// only while tsconfig-baseline.mjs lists it for that file. The baseline only shrinks: an entry the
// config no longer needs is reported too. A key whose value is what the config would inherit anyway
// is rejected, whatever it is.

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { TSCONFIG_BASELINE } from "./tsconfig-baseline.mjs";

const require = createRequire(import.meta.url);

const PRESET_PACKAGE = "@support/tsconfig";
const PRESET_ROOT = "support/tsconfig";
const BASELINE_FILE = "tools/nx-plugins/enforce-tool-config/rules/tsconfig-baseline.mjs";

const TOP_LEVEL_KEYS = new Set([
  "extends",
  "compilerOptions",
  "references",
  "include",
  "exclude",
  "files",
]);
const FILE_KEYS = ["include", "exclude", "files"];
const ALWAYS_ALLOWED_OPTIONS = new Set(["types"]);

// Build outputs and installs, which hold copied configs that are not the package's own.
const SKIP_DIRS = new Set(["node_modules", "lib", "lib-es", "dist", "build", "coverage", ".turbo"]);

/** @typedef {import("./index.mjs").Violation} Violation */

/** Loaded on first use: most `lint:tool-config` runs are cache hits and never get here. */
let typescript;
function ts() {
  typescript ??= require("typescript");
  return typescript;
}

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

/**
 * Parses a config as TypeScript does, from `text` instead of the file on disk. Source files are
 * not listed: the rule compares options and file specs, never programs.
 *
 * @param {string} file absolute
 * @param {string} text
 * @returns {import("typescript").ParsedCommandLine | undefined}
 */
function parse(file, text) {
  const host = {
    ...ts().sys,
    readFile: candidate => (path.resolve(candidate) === file ? text : ts().sys.readFile(candidate)),
    readDirectory: () => [],
    onUnRecoverableConfigFileDiagnostic: () => {},
  };
  return ts().getParsedCommandLineOfConfigFile(file, undefined, host);
}

// "No inputs were found": expected, since `parse` lists no source files.
const NO_INPUTS = 18003;

/**
 * @param {import("typescript").ParsedCommandLine} parsed
 * @returns {import("typescript").Diagnostic[]}
 */
function errorsOf(parsed) {
  return parsed.errors.filter(
    diagnostic =>
      diagnostic.category === ts().DiagnosticCategory.Error && diagnostic.code !== NO_INPUTS,
  );
}

/**
 * What a parsed config resolves `key` to: the compiler option, or the file specs as absolute
 * paths (`${configDir}` substituted, relative specs resolved against the config).
 *
 * @param {import("typescript").ParsedCommandLine | undefined} parsed
 * @param {string} key a compiler option, or one of FILE_KEYS
 * @param {string} configDir absolute
 * @returns {string} comparable serialisation
 */
function resolvedValue(parsed, key, configDir) {
  if (!parsed) return "unresolved";
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
 * @returns {string | undefined} why the entry is not allowed
 */
function extendsProblem(entry, configDir, packageDir, presets) {
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
  const exists = [target, `${target}.json`].some(candidate => fs.existsSync(candidate));
  return exists ? undefined : `"${entry}" does not exist`;
}

/**
 * @param {import("./index.mjs").RuleContext} context
 * @param {{ baseline?: Record<string, string[]> }} [overrides] for tests
 * @returns {Violation[]}
 */
export function check({ workspaceRoot, projectRoot }, { baseline = TSCONFIG_BASELINE } = {}) {
  const packageDir = path.join(workspaceRoot, projectRoot);
  const presets = presetSpecifiers(workspaceRoot);
  /** @type {Violation[]} */
  const violations = [];

  const configs = findConfigs(packageDir);
  const relative = file => path.relative(workspaceRoot, file).split(path.sep).join("/");

  for (const file of configs) {
    const name = relative(file);
    const configDir = path.dirname(file);
    const report = message => violations.push({ file: name, message });

    const text = fs.readFileSync(file, "utf8");
    const { config, error } = ts().parseConfigFileTextToJson(file, text);
    if (error) {
      report(`cannot be parsed: ${ts().flattenDiagnosticMessageText(error.messageText, "\n")}`);
      continue;
    }

    for (const key of Object.keys(config)) {
      if (!TOP_LEVEL_KEYS.has(key)) report(`"${key}" is not allowed in a package tsconfig`);
    }

    const entries = config.extends === undefined ? [] : [config.extends].flat();
    if (entries.length === 0) report(`must extend a ${PRESET_PACKAGE} preset`);
    const problems = entries
      .map(entry => extendsProblem(entry, configDir, packageDir, presets))
      .filter(Boolean);
    for (const problem of problems) report(`extends ${problem}`);

    const allowed = new Set(baseline[name] ?? []);
    const options = config.compilerOptions ?? {};
    for (const key of Object.keys(options)) {
      if (!ALWAYS_ALLOWED_OPTIONS.has(key) && !allowed.has(key)) {
        report(
          `compilerOptions.${key} is not the preset's: move it to a preset, or list it in ${BASELINE_FILE}`,
        );
      }
    }
    for (const key of allowed) {
      if (!(key in options)) {
        report(
          `${BASELINE_FILE} lists compilerOptions.${key}, which the config no longer sets; remove it`,
        );
      }
    }

    // Whether a key repeats what the config inherits only means something once extends resolves.
    if (problems.length > 0) continue;
    const parsed = parse(file, text);
    if (!parsed || errorsOf(parsed).length > 0) {
      const [first] = parsed ? errorsOf(parsed) : [];
      const reason = first
        ? ts().flattenDiagnosticMessageText(first.messageText, "\n")
        : "unknown error";
      report(`does not resolve: ${reason}`);
      continue;
    }
    const keys = [
      ...Object.keys(options).map(key => ({
        key,
        isOption: true,
        label: `compilerOptions.${key}`,
      })),
      ...FILE_KEYS.filter(key => key in config).map(key => ({ key, isOption: false, label: key })),
    ];
    for (const { key, isOption, label } of keys) {
      const inherited = parse(file, JSON.stringify(without(config, key, isOption)));
      if (resolvedValue(parsed, key, configDir) === resolvedValue(inherited, key, configDir)) {
        report(`${label} repeats what the config inherits; remove it`);
      }
    }
  }

  // Entries for configs that are gone, so the baseline cannot keep a dead file alive.
  const present = new Set(configs.map(relative));
  for (const name of Object.keys(baseline)) {
    if (
      name.startsWith(`${projectRoot}/`) &&
      !present.has(name) &&
      !isInNestedPackage(workspaceRoot, projectRoot, name)
    ) {
      violations.push({
        file: BASELINE_FILE,
        message: `lists ${name}, which does not exist; remove it`,
      });
    }
  }

  return violations;
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

// oxlint: one preset per layer, in support/lint, which each layer root re-exports from a one-line
// oxlint.config.mts; a layer root can be a package of its own, as libs/wallet-btc is. oxlint uses
// the config nearest to each file, so a config in a package, below it, in a directory between it
// and its layer root or at the workspace root overrides the preset for that subtree, and a missing
// layer config leaves its packages on whatever config is found next. A `-c` flag replaces it for
// one script. A package that needs one rule of its own passes it on its `lint` script, from the
// allowlist below. A package whose preset loads an npm package other than oxlint declares
// @support/lint, the only way nx hashes that package in its lint and marks it affected.

import fs from "node:fs";
import path from "node:path";

const CONFIG_FILE = /^(\.oxlintrc\.jsonc?|oxlint\.config\.[cm]?[jt]s)$/;

// Each layer root's config, and the support/lint preset it re-exports.
const LAYER_CONFIGS = new Map([
  ["devtools/oxlint.config.mts", "devtools"],
  ["domain/oxlint.config.mts", "base"],
  ["features/flow/oxlint.config.mts", "features-flow"],
  ["features/platform/oxlint.config.mts", "features-platform"],
  ["libs/oxlint.config.mts", "libs"],
  ["libs/coin-modules/oxlint.config.mts", "libs-coin"],
  ["libs/coin-tester-modules/oxlint.config.mts", "libs-coin-tester"],
  ["libs/wallet-btc/oxlint.config.mts", "libs-coin"],
  ["shared/oxlint.config.mts", "shared"],
  ["support/oxlint.config.mts", "support"],
  ["tools/oxlint.config.mts", "tools"],
]);

// Rule flags a package may put on its `lint` script, keyed by the flag as written there. A flag
// used by several packages of one layer belongs in that layer's preset instead.
const ALLOWED_RULE_FLAGS = new Map([
  ["-A no-console", "harnesses and CLIs whose console output is the product"],
  ["-D import/no-cycle", "libs/live-wallet, the one package that enforces it"],
]);

// Installs and build outputs: oxlint skips them, and walking them is slow.
const SKIP_DIRS = new Set(["node_modules", "dist", "lib", "lib-es", "build"]);

// `-c x`, `-c=x`, `--config x` or `--config=x` in the same command as `oxlint`.
const CONFIG_FLAG = /(^|\s)(-c|--config)(=|\s)/;

// `-A x`, `-W x`, `-D x` and their long forms, with a space or `=` before the rule.
const RULE_FLAG = /(?:^|\s)(-A|-W|-D|--allow|--warn|--deny)(?:=|\s+)(\S+)/g;

const SHORT_FLAG = { "--allow": "-A", "--warn": "-W", "--deny": "-D" };

// Packages a preset may import without its consumers declaring @support/lint: oxlint is declared
// by every package that runs it (tool-dependency rule), and @support/lint is the preset itself.
const PRESET_PACKAGES_DECLARED_ELSEWHERE = new Set(["oxlint", "@support/lint"]);

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

// A static import or re-export at the start of a line: `import "x"`, `import a from "x"`,
// `import { a } from "x"`, `import a, { b } from "x"`, `import * as a from "x"`,
// `export { a } from "x"`, `export * from "x"`, each optionally `type`.
const IMPORT_CLAUSE = String.raw`(?:[\w$]+\s*,\s*)?(?:\{[^}]*\}|\*(?:\s+as\s+[\w$]+)?|[\w$]+)`;
const MODULE_SPECIFIER = new RegExp(
  String.raw`^(?:import|export)\s+(?:type\s+)?(?:${IMPORT_CLAUSE}\s*from\s*)?["']([^"'\n]+)["']`,
  "gm",
);

/**
 * @param {string} workspaceRoot
 * @param {string} dir posix-style, relative to the workspace root
 * @returns {string[]} the oxlint configs directly in `dir`, as posix paths relative to the root
 */
function configsIn(workspaceRoot, dir) {
  let names;
  try {
    names = fs.readdirSync(path.join(workspaceRoot, dir));
  } catch {
    return [];
  }
  return names
    .filter(name => CONFIG_FILE.test(name))
    .map(name => (dir === "." ? name : `${dir}/${name}`));
}

/**
 * @param {string} workspaceRoot
 * @param {string} dir posix-style, relative to the workspace root
 * @returns {string[]} the oxlint configs in `dir` and below it
 */
function configsBelow(workspaceRoot, dir) {
  const found = configsIn(workspaceRoot, dir);
  const entries = fs.readdirSync(path.join(workspaceRoot, dir), { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) {
      found.push(...configsBelow(workspaceRoot, `${dir}/${entry.name}`));
    }
  }
  return found;
}

/**
 * @param {string} projectRoot posix-style, e.g. "libs/coin-modules/coin-evm"
 * @returns {string[]} the directories above the project, nearest first, up to and including the
 *   workspace root (".")
 */
function ancestors(projectRoot) {
  const dirs = [];
  let dir = projectRoot;
  do {
    dir = path.posix.dirname(dir);
    dirs.push(dir);
  } while (dir !== ".");
  return dirs;
}

/**
 * @param {string} projectRoot
 * @returns {string[]} the directories a layer config of the project can sit in, nearest first: the
 *   project itself, then the directories above it
 */
function layerDirs(projectRoot) {
  return [projectRoot, ...ancestors(projectRoot)];
}

/**
 * @param {string} file an oxlint config, posix-style, relative to the workspace root
 * @param {string} projectRoot
 * @returns {boolean} whether the file is a layer config the project may sit under
 */
function isLayerConfig(file, projectRoot) {
  return LAYER_CONFIGS.has(file) && layerDirs(projectRoot).includes(path.posix.dirname(file));
}

/**
 * @param {string} projectRoot
 * @returns {string | undefined} the layer config that applies to the project, if it is in a layer
 */
function requiredLayerConfig(projectRoot) {
  return layerDirs(projectRoot)
    .map(dir => `${dir}/oxlint.config.mts`)
    .find(file => LAYER_CONFIGS.has(file));
}

/**
 * @param {string} workspaceRoot
 * @param {string} file a layer config, posix-style, relative to the workspace root
 * @returns {Array<{ file: string, message: string }>}
 */
function layerConfig(workspaceRoot, file) {
  const preset = LAYER_CONFIGS.get(file);
  const expected = `export { default } from "@support/lint/${preset}";`;
  const content = fs.readFileSync(path.join(workspaceRoot, file), "utf8").trim();
  return content === expected
    ? []
    : [{ file, message: `a layer config only re-exports its preset: \`${expected}\`` }];
}

/**
 * @param {string} specifier
 * @returns {string} the package a bare specifier names, e.g. "@scope/pkg" for "@scope/pkg/sub"
 */
function packageName(specifier) {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

/**
 * The npm packages a support/lint preset loads, through its relative imports too. Nx hashes them,
 * and marks a package affected when they change, only through a dependency edge, so a package
 * linted by such a preset declares @support/lint.
 *
 * @param {string} workspaceRoot
 * @param {string} preset
 * @returns {string[]}
 */
export function presetPackages(workspaceRoot, preset) {
  const packages = new Set();
  const seen = new Set();
  const visit = file => {
    if (seen.has(file)) return;
    seen.add(file);
    let source;
    try {
      source = fs.readFileSync(file, "utf8");
    } catch {
      return;
    }
    for (const [, specifier] of source.matchAll(MODULE_SPECIFIER)) {
      if (specifier.startsWith(".")) visit(path.resolve(path.dirname(file), specifier));
      else if (!specifier.startsWith("node:")) packages.add(packageName(specifier));
    }
  };
  visit(path.join(workspaceRoot, "support/lint", `${preset}.mts`));
  return [...packages].filter(name => !PRESET_PACKAGES_DECLARED_ELSEWHERE.has(name)).sort();
}

/**
 * @param {string} workspaceRoot
 * @param {string} projectRoot
 * @param {string | undefined} layerConfigFile
 * @returns {Array<{ file: string, message: string }>}
 */
function presetDependency(workspaceRoot, projectRoot, layerConfigFile) {
  if (!layerConfigFile) return [];
  const file = `${projectRoot}/package.json`;
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(workspaceRoot, file), "utf8"));
  } catch {
    return [];
  }
  if (!manifest.scripts?.lint) return [];
  if (DEPENDENCY_FIELDS.some(field => manifest[field]?.["@support/lint"])) return [];
  const preset = LAYER_CONFIGS.get(layerConfigFile);
  const packages = presetPackages(workspaceRoot, preset);
  return packages.length === 0
    ? []
    : [
        {
          file,
          message:
            `the ${preset} lint preset loads ${packages.join(", ")}: declare ` +
            '"@support/lint": "workspace:*" in devDependencies, so nx hashes them in lint and ' +
            "marks the package affected when they change",
        },
      ];
}

/**
 * @param {string} workspaceRoot
 * @param {string} projectRoot
 * @returns {Array<{ file: string, message: string }>}
 */
function scriptFlags(workspaceRoot, projectRoot) {
  const file = `${projectRoot}/package.json`;
  let scripts;
  try {
    scripts = JSON.parse(fs.readFileSync(path.join(workspaceRoot, file), "utf8")).scripts ?? {};
  } catch {
    return [];
  }
  const violations = [];
  for (const [name, script] of Object.entries(scripts)) {
    const commands = script
      .split(/&&|\|\||;|\|/)
      .filter(command => /(^|\s)oxlint(\s|$)/.test(command));
    for (const command of commands) {
      if (CONFIG_FLAG.test(command)) {
        violations.push({
          file,
          message:
            `script "${name}" passes a config to oxlint: drop the flag, oxlint finds the ` +
            "layer config on its own",
        });
      }
      for (const [, flag, rule] of command.matchAll(RULE_FLAG)) {
        const written = `${SHORT_FLAG[flag] ?? flag} ${rule}`;
        if (name !== "lint") {
          violations.push({
            file,
            message: `script "${name}" sets \`${written}\`: rule flags go on the "lint" script only`,
          });
        } else if (!ALLOWED_RULE_FLAGS.has(written)) {
          violations.push({
            file,
            message:
              `script "lint" sets \`${written}\`, which is not in the allowlist: set the rule ` +
              "in the layer's support/lint preset, or add the flag to ALLOWED_RULE_FLAGS",
          });
        }
      }
    }
  }
  return violations;
}

/** @type {import("./index.mjs").Rule} */
export default {
  name: "lint",
  inputs: [
    "{projectRoot}/package.json",
    "{workspaceRoot}/**/.oxlintrc.*",
    "{workspaceRoot}/**/oxlint.config.*",
    "{workspaceRoot}/support/lint/**/*.@(mts|ts|js)",
  ],
  check({ workspaceRoot, projectRoot }) {
    const found = [
      ...configsBelow(workspaceRoot, projectRoot),
      ...ancestors(projectRoot).flatMap(dir => configsIn(workspaceRoot, dir)),
    ];
    const required = requiredLayerConfig(projectRoot);

    return [
      ...(required && !found.includes(required)
        ? [
            {
              file: required,
              message:
                "layer config missing: without it the package falls back to another config. " +
                `Restore it as \`export { default } from "@support/lint/${LAYER_CONFIGS.get(required)}";\``,
            },
          ]
        : []),
      ...found
        .filter(file => !isLayerConfig(file, projectRoot))
        .map(file => ({
          file,
          message:
            "oxlint config outside a layer root: delete it, and set what this package needs in " +
            "its layer's support/lint preset",
        })),
      ...found
        .filter(file => isLayerConfig(file, projectRoot))
        .flatMap(file => layerConfig(workspaceRoot, file)),
      ...scriptFlags(workspaceRoot, projectRoot),
      ...presetDependency(workspaceRoot, projectRoot, required),
    ];
  },
};

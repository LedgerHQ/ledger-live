// A package that depends on @support/jest builds every jest config it has with one of the preset
// factories: the file exports a `create*Config(...)` call from `@support/jest/<preset>`, and
// nothing else. What the package passes through the factory's overrides argument is its own call
// and is not checked. Packages without the dependency are not checked.

import fs from "node:fs";
import path from "node:path";

const PACKAGE = "@support/jest";
const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];
// jest.config.js, jest.native.config.js, jest.config.ts, ...
const CONFIG_FILE = /^jest(\.[\w-]+)?\.config\.[cm]?[jt]s$/;
const FACTORY = /^create\w*Config$/;
const PRESET_SPECIFIER = String.raw`["'](@support/jest/[\w-]+)["']`;
const IDENTIFIER = String.raw`[A-Za-z_$][\w$]*`;

/**
 * The source with comments blanked out, string and template contents kept, so the patterns below
 * neither match commented-out code nor stop at a parenthesis inside a comment.
 *
 * @param {string} source
 * @returns {string}
 */
export function stripComments(source) {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const char = source[i];
    const next = source[i + 1];
    if (char === "/" && next === "/") {
      const end = source.indexOf("\n", i);
      const stop = end === -1 ? source.length : end;
      out += " ".repeat(stop - i);
      i = stop;
    } else if (char === "/" && next === "*") {
      const end = source.indexOf("*/", i + 2);
      const stop = end === -1 ? source.length : end + 2;
      out += source.slice(i, stop).replace(/[^\n]/g, " ");
      i = stop;
    } else if (char === '"' || char === "'" || char === "`") {
      const start = i;
      i++;
      while (i < source.length && source[i] !== char) i += source[i] === "\\" ? 2 : 1;
      i++;
      out += source.slice(start, i);
    } else {
      out += char;
      i++;
    }
  }
  return out;
}

/**
 * Index just past the parenthesis closing the one at `open`, or -1 when it is unbalanced.
 *
 * @param {string} code comments already stripped
 * @param {number} open index of a `(`
 * @returns {number}
 */
function closingParen(code, open) {
  let depth = 0;
  for (let i = open; i < code.length; i++) {
    const char = code[i];
    if (char === '"' || char === "'" || char === "`") {
      i++;
      while (i < code.length && code[i] !== char) i += code[i] === "\\" ? 2 : 1;
    } else if (char === "(") {
      depth++;
    } else if (char === ")" && --depth === 0) {
      return i + 1;
    }
  }
  return -1;
}

/**
 * The names a config binds to preset exports: `factories` maps a local name to the export it
 * stands for, `namespaces` holds the names bound to a whole preset module.
 *
 * @param {string} code comments already stripped
 */
function presetBindings(code) {
  const factories = new Map();
  const namespaces = new Set();

  const destructured = new RegExp(
    String.raw`(?:const|let|var)\s*\{([^}]*)\}\s*=\s*require\(\s*${PRESET_SPECIFIER}\s*\)`,
    "g",
  );
  for (const match of code.matchAll(destructured)) {
    for (const part of match[1].split(",")) {
      const [imported, local = imported] = part.split(":").map(name => name.trim());
      if (imported) factories.set(local, imported);
    }
  }

  const imported = new RegExp(String.raw`import\s*\{([^}]*)\}\s*from\s*${PRESET_SPECIFIER}`, "g");
  for (const match of code.matchAll(imported)) {
    for (const part of match[1].split(",")) {
      const [name, local = name] = part.split(/\s+as\s+/).map(item => item.trim());
      if (name) factories.set(local, name);
    }
  }

  const whole = new RegExp(
    String.raw`(?:(?:const|let|var)\s+(${IDENTIFIER})\s*=\s*require\(\s*${PRESET_SPECIFIER}\s*\))` +
      String.raw`|(?:import\s+(?:\*\s+as\s+)?(${IDENTIFIER})\s+from\s*${PRESET_SPECIFIER})`,
    "g",
  );
  for (const match of code.matchAll(whole)) namespaces.add(match[1] ?? match[3]);

  return { factories, namespaces };
}

/**
 * Why a jest config does not go through a preset factory, or null when it does.
 *
 * @param {string} source the config file's content
 * @returns {string | null}
 */
export function factoryProblem(source) {
  const code = stripComments(source);

  const exports = [
    ...code.matchAll(/\bmodule\.exports\b|\bexports\.\w+\s*=|\bexport\s+default\b/g),
  ];
  if (exports.length === 0) return "exports no config";
  if (exports.length > 1) return "assigns its export more than once";

  const [exported] = exports;
  const assignment = /^module\.exports\s*=\s*|^export\s+default\s+/.exec(
    code.slice(exported.index),
  );
  if (!assignment) return "exports something other than a single config";
  const start = exported.index + assignment[0].length;
  const expression = code.slice(start);

  const { factories, namespaces } = presetBindings(code);
  const required = new RegExp(
    String.raw`^require\(\s*${PRESET_SPECIFIER}\s*\)\s*\.\s*(${IDENTIFIER})\s*\(`,
  ).exec(expression);
  const member = new RegExp(String.raw`^(${IDENTIFIER})\s*\.\s*(${IDENTIFIER})\s*\(`).exec(
    expression,
  );
  const bare = new RegExp(String.raw`^(${IDENTIFIER})\s*\(`).exec(expression);

  let call = null;
  let factory;
  if (required) [call, factory] = [required, required[2]];
  else if (member && namespaces.has(member[1])) [call, factory] = [member, member[2]];
  else if (bare && factories.has(bare[1])) [call, factory] = [bare, factories.get(bare[1])];

  if (!call || !FACTORY.test(factory)) {
    return `exports a config that is not built by a ${PACKAGE} preset factory`;
  }

  const end = closingParen(code, start + call[0].length - 1);
  if (end === -1 || !/^\s*;?\s*$/.test(code.slice(end))) {
    return `changes the result of ${factory}() instead of passing its overrides argument`;
  }
  return null;
}

/**
 * @param {string} packageJsonPath
 * @returns {boolean}
 */
function dependsOnPreset(packageJsonPath) {
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch {
    return false;
  }
  return DEPENDENCY_FIELDS.some(field => Object.hasOwn(manifest[field] ?? {}, PACKAGE));
}

/** @type {import("./index.mjs").Rule} */
export const jestRule = {
  name: "jest",
  inputs: ["{projectRoot}/package.json", "{projectRoot}/jest*.config.*"],
  check({ workspaceRoot, projectRoot }) {
    const directory = path.join(workspaceRoot, projectRoot);
    if (!dependsOnPreset(path.join(directory, "package.json"))) return [];

    const configs = fs
      .readdirSync(directory)
      .filter(file => CONFIG_FILE.test(file))
      .sort();
    if (configs.length === 0) {
      return [
        {
          file: `${projectRoot}/package.json`,
          message: `depends on ${PACKAGE} but has no jest config built by one of its presets`,
        },
      ];
    }

    return configs.flatMap(file => {
      const problem = factoryProblem(fs.readFileSync(path.join(directory, file), "utf8"));
      return problem
        ? [
            {
              file: `${projectRoot}/${file}`,
              message: `${problem}; export a create*Config(overrides) call from ${PACKAGE}/<preset>`,
            },
          ]
        : [];
    });
  },
};

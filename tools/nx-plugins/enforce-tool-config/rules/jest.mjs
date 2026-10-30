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
const KEPT_LITERAL = /^@support\/jest\/[\w-]+$/;
const IDENTIFIER = String.raw`[A-Za-z_$][\w$]*`;
// A `/` after one of these words starts a regular expression, after any other word a division.
const KEYWORDS_BEFORE_EXPRESSION = new Set([
  "await",
  "case",
  "delete",
  "do",
  "else",
  "in",
  "instanceof",
  "new",
  "of",
  "return",
  "throw",
  "typeof",
  "void",
  "yield",
]);

/**
 * Index of the first character from `from` on that `closes` accepts, stepping over escapes, or the
 * end of the source.
 *
 * @param {string} source
 * @param {number} from
 * @param {(index: number) => boolean} closes
 * @returns {number}
 */
function literalEnd(source, from, closes) {
  let i = from;
  while (i < source.length && !closes(i)) i += source[i] === "\\" ? 2 : 1;
  return Math.min(i, source.length);
}

/**
 * The source with comments blanked out, and the contents of string, template and regular
 * expression literals blanked out too, except the preset specifiers. Delimiters, newlines and
 * offsets are kept, so the patterns below see only code: they neither match commented-out code or
 * text inside a literal, nor stop at a parenthesis in either.
 *
 * @param {string} source
 * @returns {string}
 */
export function maskSource(source) {
  const out = source.split("");
  const blank = (from, to) => {
    for (let k = from; k < to; k++) if (out[k] !== "\n") out[k] = " ";
  };
  // One entry per open brace: true when it opened a template literal's `${`.
  const braces = [];
  let regexAllowed = true;
  let i = 0;
  while (i < source.length) {
    const char = source[i];
    const next = source[i + 1];
    if (char === "/" && next === "/") {
      const end = source.indexOf("\n", i);
      const stop = end === -1 ? source.length : end;
      blank(i, stop);
      i = stop;
    } else if (char === "/" && next === "*") {
      const end = source.indexOf("*/", i + 2);
      const stop = end === -1 ? source.length : end + 2;
      blank(i, stop);
      i = stop;
    } else if (char === '"' || char === "'") {
      const end = literalEnd(source, i + 1, k => source[k] === char);
      if (!KEPT_LITERAL.test(source.slice(i + 1, end))) blank(i + 1, end);
      i = end + 1;
      regexAllowed = false;
    } else if (char === "`" || (char === "}" && braces.at(-1) === true)) {
      if (char === "}") braces.pop();
      const end = literalEnd(
        source,
        i + 1,
        k => source[k] === "`" || (source[k] === "$" && source[k + 1] === "{"),
      );
      blank(i + 1, end);
      if (source[end] === "$") {
        braces.push(true);
        i = end + 2;
        regexAllowed = true;
      } else {
        i = end + 1;
        regexAllowed = false;
      }
    } else if (char === "/" && regexAllowed) {
      let inClass = false;
      const end = literalEnd(source, i + 1, k => {
        if (source[k] === "\n") return true;
        if (source[k] === "[") inClass = true;
        else if (source[k] === "]") inClass = false;
        return source[k] === "/" && !inClass;
      });
      blank(i + 1, end);
      i = end + 1;
      while (i < source.length && /\w/.test(source[i])) i++;
      regexAllowed = false;
    } else if (/[\w$]/.test(char)) {
      const word = /^[\w$]+/.exec(source.slice(i))[0];
      i += word.length;
      regexAllowed = KEYWORDS_BEFORE_EXPRESSION.has(word);
    } else {
      if (char === "{") braces.push(false);
      else if (char === "}") braces.pop();
      if (!/\s/.test(char)) regexAllowed = !/[)\]}]/.test(char);
      i++;
    }
  }
  return out.join("");
}

/**
 * Index just past the parenthesis closing the one at `open`, or -1 when it is unbalanced.
 *
 * @param {string} code masked by maskSource
 * @param {number} open index of a `(`
 * @returns {number}
 */
function closingParen(code, open) {
  let depth = 0;
  for (let i = open; i < code.length; i++) {
    if (code[i] === "(") depth++;
    else if (code[i] === ")" && --depth === 0) return i + 1;
  }
  return -1;
}

/**
 * The names a config binds to preset exports: `factories` maps a local name to the export it
 * stands for, `namespaces` holds the names bound to a whole preset module.
 *
 * @param {string} code masked by maskSource
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
  const code = maskSource(source);

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
export default {
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

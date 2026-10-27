// A package that depends on @support/jest builds every jest config it has with one of the preset
// factories: the file exports a `create*Config(overrides, options)` call from
// `@support/jest/<preset>`, and nothing else. Packages without the dependency are not checked.
//
// The overrides carry only what the package knows: where its tests are and how they match, the
// setup files and module mappings they need, their coverage scope, and how its runs are split
// (OWNED_KEYS). `webOverrides` / `nativeOverrides` and each `create*Project(...)` entry of
// `projects` follow the same allowlist. A setup file a package passes adds to the preset's;
// dropping one of the preset's goes through a named option, and a factory takes only the options
// it reads (FACTORY_OPTIONS). Every other key belongs to the preset. The overrides and options are
// object literals, so the rule reads their keys without running the config, and a literal value
// that leaves the preset's result unchanged is rejected.
//
// The one way around the allowlist is jest-debt.mjs: a config may set a key outside it only while
// that list names the key for that file. The list only shrinks: the rule reports an entry the
// config no longer sets, or a config that is gone, so moving a package onto its preset means
// deleting its entry. support/jest/README.md lists OWNED_KEYS and FACTORY_OPTIONS for package
// authors; jest.test.mjs keeps that list in step with this file.

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { JEST_DEBT } from "./jest-debt.mjs";

const PACKAGE = "@support/jest";
const PRESET_ROOT = "support/jest";
const DEBT_FILE = "tools/nx-plugins/enforce-tool-config/rules/jest-debt.mjs";
const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];
// jest.config.js, jest.native.config.js, jest.config.ts, ...
const CONFIG_FILE = /^jest(\.[\w-]+)?\.config\.[cm]?[jt]s$/;
const FACTORY = /^create\w*Config$/;
const PROJECT_FACTORY = /^create\w*Project$/;
const PRESET_SPECIFIER = String.raw`["'](@support/jest/[\w-]+)["']`;

/** The override keys a package owns. */
export const OWNED_KEYS = new Set([
  "collectCoverageFrom",
  "coveragePathIgnorePatterns",
  "displayName",
  "maxWorkers",
  "moduleNameMapper",
  "modulePathIgnorePatterns",
  "nativeOverrides",
  "passWithNoTests",
  "projects",
  "rootDir",
  "roots",
  "setupFiles",
  "setupFilesAfterEnv",
  "testMatch",
  "testPathIgnorePatterns",
  "testRegex",
  "testTimeout",
  "webOverrides",
  "workerThreads",
]);
// Keys whose value holds the overrides of one project.
const PROJECT_OVERRIDES = new Set(["webOverrides", "nativeOverrides"]);
/** The override keys a project owns: OWNED_KEYS without the ones that nest projects. */
const PROJECT_KEYS = new Set(
  [...OWNED_KEYS].filter(key => key !== "projects" && !PROJECT_OVERRIDES.has(key)),
);
/**
 * The options each preset factory reads from its second argument. A factory missing here takes
 * none: an option it does not read would be a silent no-op.
 */
export const FACTORY_OPTIONS = {
  createSharedJestConfig: ["esm", "extraEsmDeps", "projectRoot", "retries"],
  createLibsCoinJestConfig: ["esm", "extraEsmDeps", "projectRoot", "network", "walletFramework"],
  createLibsCoinIntegJestConfig: ["esm", "extraEsmDeps", "projectRoot", "walletFramework"],
  createLibsCoinJestProject: ["esm", "extraEsmDeps", "network", "walletFramework"],
};
// What a package uses instead of overriding a key its preset owns.
const ESM_FIX = "keep a dependency transformed with the extraEsmDeps option";
const FIXES = {
  transform: ESM_FIX,
  transformIgnorePatterns: ESM_FIX,
  testEnvironment: "pick the preset of the environment the tests need",
  reporters: "every preset reports the same way",
};
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
 * Index just past the bracket closing the one at `open`, or -1 when it is unbalanced.
 *
 * @param {string} code masked by maskSource
 * @param {number} open index of a `(`, `[` or `{`
 * @returns {number}
 */
function closingBracket(code, open) {
  let depth = 0;
  for (let i = open; i < code.length; i++) {
    if ("([{".includes(code[i])) depth++;
    else if (")]}".includes(code[i]) && --depth === 0) return i + 1;
  }
  return -1;
}

/**
 * The names a config binds to preset exports: `factories` maps a local name to the preset and the
 * export it stands for, `namespaces` maps a name bound to a whole preset module to that preset.
 *
 * @param {string} code masked by maskSource
 */
function presetBindings(code) {
  /** @type {Map<string, { preset: string, name: string }>} */
  const factories = new Map();
  /** @type {Map<string, string>} */
  const namespaces = new Map();

  const destructured = new RegExp(
    String.raw`(?:const|let|var)\s*\{([^}]*)\}\s*=\s*require\(\s*${PRESET_SPECIFIER}\s*\)`,
    "g",
  );
  for (const match of code.matchAll(destructured)) {
    for (const part of match[1].split(",")) {
      const [imported, local = imported] = part.split(":").map(name => name.trim());
      if (imported) factories.set(local, { preset: match[2], name: imported });
    }
  }

  const imported = new RegExp(String.raw`import\s*\{([^}]*)\}\s*from\s*${PRESET_SPECIFIER}`, "g");
  for (const match of code.matchAll(imported)) {
    for (const part of match[1].split(",")) {
      const [name, local = name] = part.split(/\s+as\s+/).map(item => item.trim());
      if (name) factories.set(local, { preset: match[2], name });
    }
  }

  const whole = new RegExp(
    String.raw`(?:(?:const|let|var)\s+(${IDENTIFIER})\s*=\s*require\(\s*${PRESET_SPECIFIER}\s*\))` +
      String.raw`|(?:import\s+(?:\*\s+as\s+)?(${IDENTIFIER})\s+from\s*${PRESET_SPECIFIER})`,
    "g",
  );
  for (const match of code.matchAll(whole)) {
    namespaces.set(match[1] ?? match[3], match[2] ?? match[4]);
  }

  return { factories, namespaces };
}

/**
 * @typedef {object} PresetCall
 * @property {string} preset the preset specifier, e.g. "@support/jest/shared"
 * @property {string} factory the export it calls
 * @property {number} open index of the call's `(`
 * @property {number} end index just past its `)`, or -1 when it is unbalanced
 */

/**
 * The call of a preset export the code at `start` begins with, or null.
 *
 * @param {string} code masked by maskSource
 * @param {number} start
 * @param {ReturnType<typeof presetBindings>} bindings
 * @returns {PresetCall | null}
 */
function presetCall(code, start, { factories, namespaces }) {
  const expression = code.slice(start);
  const required = new RegExp(
    String.raw`^require\(\s*${PRESET_SPECIFIER}\s*\)\s*\.\s*(${IDENTIFIER})\s*\(`,
  ).exec(expression);
  const member = new RegExp(String.raw`^(${IDENTIFIER})\s*\.\s*(${IDENTIFIER})\s*\(`).exec(
    expression,
  );
  const bare = new RegExp(String.raw`^(${IDENTIFIER})\s*\(`).exec(expression);

  let found = null;
  if (required) found = { match: required, preset: required[1], factory: required[2] };
  else if (member && namespaces.has(member[1])) {
    found = { match: member, preset: namespaces.get(member[1]), factory: member[2] };
  } else if (bare && factories.has(bare[1])) {
    const { preset, name } = factories.get(bare[1]);
    found = { match: bare, preset, factory: name };
  }
  if (!found) return null;

  const open = start + found.match[0].length - 1;
  return { preset: found.preset, factory: found.factory, open, end: closingBracket(code, open) };
}

/**
 * The preset factory call a config exports, or why it does not export one.
 *
 * @param {string} source the config file's content
 * @returns {{ problem: string } | { code: string, call: PresetCall, bindings: ReturnType<typeof presetBindings> }}
 */
function exportedCall(source) {
  const code = maskSource(source);

  const exports = [
    ...code.matchAll(/\bmodule\.exports\b|\bexports\.\w+\s*=|\bexport\s+default\b/g),
  ];
  if (exports.length === 0) return { problem: "exports no config" };
  if (exports.length > 1) return { problem: "assigns its export more than once" };

  const [exported] = exports;
  const assignment = /^module\.exports\s*=\s*|^export\s+default\s+/.exec(
    code.slice(exported.index),
  );
  if (!assignment) return { problem: "exports something other than a single config" };

  const bindings = presetBindings(code);
  const call = presetCall(code, exported.index + assignment[0].length, bindings);
  if (!call || !FACTORY.test(call.factory)) {
    return { problem: `exports a config that is not built by a ${PACKAGE} preset factory` };
  }
  if (call.end === -1 || !/^\s*;?\s*$/.test(code.slice(call.end))) {
    return {
      problem: `changes the result of ${call.factory}() instead of passing its overrides argument`,
    };
  }
  return { code, call, bindings };
}

/**
 * Why a jest config does not go through a preset factory, or null when it does.
 *
 * @param {string} source the config file's content
 * @returns {string | null}
 */
export function factoryProblem(source) {
  const parsed = exportedCall(source);
  return "problem" in parsed ? parsed.problem : null;
}

/** @typedef {[number, number]} Range start and end offsets, end excluded */

/**
 * The pieces of `code` between `from` and `to` separated by commas outside brackets, trimmed,
 * empty ones (a trailing comma) left out.
 *
 * @param {string} code masked by maskSource
 * @param {number} from
 * @param {number} to
 * @returns {Range[]}
 */
function topLevelItems(code, from, to) {
  const items = [];
  let depth = 0;
  let start = from;
  for (let i = from; i <= to; i++) {
    if (i === to || (code[i] === "," && depth === 0)) {
      const text = code.slice(start, i);
      const lead = text.length - text.trimStart().length;
      if (text.trim()) items.push([start + lead, start + lead + text.trim().length]);
      start = i + 1;
    } else if ("([{".includes(code[i])) depth++;
    else if (")]}".includes(code[i])) depth--;
  }
  return items;
}

/**
 * The items of the array or object literal `range` spans, or null when it spans something else.
 *
 * @param {string} code masked by maskSource
 * @param {Range} range
 * @param {"[" | "{"} bracket
 * @returns {Range[] | null}
 */
function literalItems(code, [start, end], bracket) {
  if (code[start] !== bracket || closingBracket(code, start) !== end) return null;
  return topLevelItems(code, start + 1, end - 1);
}

/**
 * @typedef {object} Entry
 * @property {string} key
 * @property {Range} value
 */

/**
 * The entries of an object literal, or why one of them cannot be read as a plain key.
 *
 * @param {string} source
 * @param {string} code masked by maskSource
 * @param {Range[]} items
 * @returns {{ entries: Entry[], problems: string[] }}
 */
function objectEntries(source, code, items) {
  const entries = [];
  const problems = [];
  for (const [start, end] of items) {
    const text = code.slice(start, end);
    const keyed = new RegExp(String.raw`^(${IDENTIFIER}|"[^"]*"|'[^']*'|\d[\d_]*)\s*:\s*`).exec(
      text,
    );
    if (keyed) {
      const raw = source.slice(start, start + keyed[1].length);
      const key = /^["']/.test(raw) ? raw.slice(1, -1) : raw;
      entries.push({ key, value: [start + keyed[0].length, end] });
    } else if (new RegExp(String.raw`^${IDENTIFIER}$`).test(text)) {
      entries.push({ key: text, value: [start, end] });
    } else if (text.startsWith("...")) {
      problems.push(`spread \`${source.slice(start, end)}\`; write out its keys`);
    } else {
      problems.push(`hold an entry that is not a plain key: \`${source.slice(start, end)}\``);
    }
  }
  return { entries, problems };
}

const ESCAPES = { b: "\b", f: "\f", n: "\n", r: "\r", t: "\t", v: "\v", 0: "\0" };

/**
 * The value of a literal written in `source` between `start` and `end`, read without evaluating
 * anything: strings, template literals without interpolation, numbers, booleans, null,
 * undefined, and arrays and objects of those, with comments and trailing commas. Null when the
 * text is anything else, such as a call, a member access or a tagged template.
 *
 * @param {string} source
 * @param {Range} range
 * @returns {{ value: unknown } | null}
 */
function readLiteral(source, [start, end]) {
  let i = start;
  const fail = () => {
    throw new SyntaxError("not a literal");
  };
  function skip() {
    for (;;) {
      while (i < end && /\s/.test(source[i])) i++;
      if (source.startsWith("//", i)) {
        const newline = source.indexOf("\n", i);
        i = newline === -1 || newline > end ? end : newline;
      } else if (source.startsWith("/*", i)) {
        const close = source.indexOf("*/", i + 2);
        if (close === -1 || close + 2 > end) fail();
        i = close + 2;
      } else return;
    }
  }
  function string() {
    const quote = source[i++];
    let text = "";
    while (i < end && source[i] !== quote) {
      if (quote === "`" && source.startsWith("${", i)) fail();
      if (source[i] === "\\") {
        const escaped = source[i + 1];
        const unicode = /^u([0-9a-fA-F]{4})/.exec(source.slice(i + 1, i + 6));
        if (unicode) {
          text += String.fromCharCode(parseInt(unicode[1], 16));
          i += 6;
        } else {
          text += ESCAPES[escaped] ?? escaped;
          i += 2;
        }
      } else if (quote !== "`" && source[i] === "\n") fail();
      else text += source[i++];
    }
    if (i >= end) fail();
    i++;
    return text;
  }
  function key() {
    if (source[i] === '"' || source[i] === "'") return string();
    const name = new RegExp(String.raw`^${IDENTIFIER}`).exec(source.slice(i, end));
    if (!name) fail();
    i += name[0].length;
    return name[0];
  }
  function list(close, item) {
    i++;
    for (;;) {
      skip();
      if (source[i] === close) return void i++;
      item();
      skip();
      if (source[i] === ",") i++;
      else if (source[i] !== close) fail();
    }
  }
  function value() {
    skip();
    const char = source[i];
    if (char === '"' || char === "'" || char === "`") return string();
    if (char === "[") {
      const items = [];
      list("]", () => items.push(value()));
      return items;
    }
    if (char === "{") {
      const object = {};
      list("}", () => {
        const name = key();
        skip();
        if (source[i++] !== ":") fail();
        object[name] = value();
      });
      return object;
    }
    const number = /^-?\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?(?![\w$])/.exec(
      source.slice(i, end),
    );
    if (number) {
      i += number[0].length;
      return Number(number[0].replaceAll("_", ""));
    }
    const word = /^(?:true|false|null|undefined)(?![\w$])/.exec(source.slice(i, end));
    if (!word) fail();
    i += word[0].length;
    return { true: true, false: false, null: null, undefined }[word[0]];
  }
  try {
    const result = value();
    skip();
    return i === end ? { value: result } : null;
  } catch {
    return null;
  }
}

/**
 * Whether the override changes what the factory returns without it. A factory that throws on it
 * is left to jest to report.
 *
 * @param {(overrides?: object) => unknown} factory the preset factory, with the call's options
 * @param {(value: unknown) => object} wrap builds the overrides argument holding the value
 * @param {unknown} value
 * @returns {boolean}
 */
function repeatsPreset(factory, wrap, value) {
  try {
    return isDeepStrictEqual(factory(wrap(value)), factory());
  } catch {
    return false;
  }
}

/**
 * @typedef {object} CheckContext
 * @property {string} source
 * @property {string} code masked by maskSource
 * @property {ReturnType<typeof presetBindings>} bindings
 * @property {Set<string>} listed the debt entries of the config
 * @property {Set<string>} seen collects the keys the config sets, as labels
 * @property {(specifier: string) => Record<string, unknown> | undefined} loadPreset
 * @property {string[]} problems collects the problems
 */

/**
 * Why a factory does not read an option, naming the factories that do, or null when it reads it.
 *
 * @param {string} factory
 * @param {string} option
 * @returns {string | null}
 */
function optionProblem(factory, option) {
  if (FACTORY_OPTIONS[factory]?.includes(option)) return null;
  const readers = Object.keys(FACTORY_OPTIONS).filter(name =>
    FACTORY_OPTIONS[name].includes(option),
  );
  if (readers.length === 0) return `an unknown option "${option}"`;
  const named = readers.map(name => `${name}()`).join(", ");
  return `the option "${option}", which it does not read; it belongs to ${named}`;
}

/**
 * Checks the arguments of one preset call: the overrides, then the options.
 *
 * @param {CheckContext} context
 * @param {PresetCall} call
 * @param {Set<string>} allowed the keys the overrides may set
 * @param {string} prefix label of the overrides, "" at the top level
 */
function checkCall(context, call, allowed, prefix) {
  const { code, problems } = context;
  const [overrides, options, ...extra] = topLevelItems(code, call.open + 1, call.end - 1);
  const name = `${call.factory}()`;
  if (extra.length > 0) problems.push(`passes ${name} more than overrides and options`);

  // The comparisons run the factory with the call's own options, so they are skipped when the
  // options cannot be read without running the config.
  const factory = context.loadPreset(call.preset)?.[call.factory];
  const readOptions = options ? readLiteral(context.source, options) : { value: undefined };
  const make =
    typeof factory === "function" && readOptions
      ? overridesArgument => factory(overridesArgument, readOptions.value)
      : undefined;

  if (overrides) {
    const items = literalItems(code, overrides, "{");
    if (!items) {
      problems.push(`passes ${name} overrides that are not an object literal; write out its keys`);
    } else {
      checkOverrides(context, items, { allowed, prefix, make, wrap: value => value });
    }
  }

  if (options) {
    const items = literalItems(code, options, "{");
    if (!items) {
      problems.push(`passes ${name} options that are not an object literal; write out its keys`);
      return;
    }
    const { entries, problems: unreadable } = objectEntries(context.source, code, items);
    for (const problem of unreadable) problems.push(`the options of ${name} ${problem}`);
    for (const { key } of entries) {
      const problem = optionProblem(call.factory, key);
      if (problem) problems.push(`passes ${name} ${problem}`);
    }
  }
}

/**
 * Checks the entries of an overrides object.
 *
 * @param {CheckContext} context
 * @param {Range[]} items
 * @param {{ allowed: Set<string>, prefix: string, make?: (overrides?: object) => unknown, wrap: (value: unknown) => object }} scope
 *   `make` runs the factory with the call's options, `wrap` builds its overrides argument from this object
 */
function checkOverrides(context, items, { allowed, prefix, make, wrap }) {
  const { source, code, problems } = context;
  const { entries, problems: unreadable } = objectEntries(source, code, items);
  for (const problem of unreadable) problems.push(`${prefix || "overrides"} ${problem}`);

  for (const { key, value } of entries) {
    const keyPath = prefix ? `${prefix}.${key}` : key;
    context.seen.add(keyPath);

    if (!allowed.has(key) && !context.listed.has(keyPath)) {
      const fix = FIXES[key] ?? "leave it to the preset";
      problems.push(`${keyPath} is not an override a package owns: ${fix}`);
      continue;
    }

    if (PROJECT_OVERRIDES.has(key) && allowed.has(key)) {
      const nested = literalItems(code, value, "{");
      if (!nested) {
        problems.push(`${keyPath} is not an object literal; write out its keys`);
      } else {
        checkOverrides(context, nested, {
          allowed: PROJECT_KEYS,
          prefix: keyPath,
          make,
          wrap: inner => wrap({ [key]: inner }),
        });
      }
      continue;
    }

    if (key === "projects" && allowed.has(key)) {
      checkProjects(context, value, keyPath);
      continue;
    }

    const literal = make && readLiteral(source, value);
    if (literal) {
      if (repeatsPreset(make, inner => wrap({ [key]: inner }), literal.value)) {
        problems.push(`${keyPath} repeats what the preset sets; remove it`);
      }
    }
  }
}

/**
 * Checks a `projects` override: an array of preset project calls, each checked like a project's
 * overrides.
 *
 * @param {CheckContext} context
 * @param {Range} value
 * @param {string} keyPath
 */
function checkProjects(context, value, keyPath) {
  const { code, problems } = context;
  const elements = literalItems(code, value, "[");
  if (!elements) {
    problems.push(`${keyPath} is not an array literal; list create*Project(...) calls`);
    return;
  }
  for (const [start, end] of elements) {
    const call = presetCall(code, start, context.bindings);
    if (!call || !PROJECT_FACTORY.test(call.factory) || call.end !== end) {
      const text = context.source.slice(start, end).replace(/\s+/g, " ");
      const shown = text.length > 40 ? `${text.slice(0, 40)}...` : text;
      problems.push(
        `${keyPath} holds \`${shown}\`, not a ${PACKAGE} create*Project(...) call: jest does not pass a preset's options down to a project`,
      );
      continue;
    }
    checkCall(context, call, PROJECT_KEYS, `${keyPath}[${call.factory}]`);
  }
}

/**
 * What a config passes its preset factory that the package does not own, or that changes nothing.
 * The config must pass factoryProblem.
 *
 * @param {string} source
 * @param {{ listed?: string[], loadPreset: CheckContext["loadPreset"] }} options
 * @returns {string[]}
 */
export function overridesProblems(source, { listed = [], loadPreset }) {
  const parsed = exportedCall(source);
  if ("problem" in parsed) return [parsed.problem];

  /** @type {CheckContext} */
  const context = {
    source,
    code: parsed.code,
    bindings: parsed.bindings,
    listed: new Set(listed),
    seen: new Set(),
    loadPreset,
    problems: [],
  };
  checkCall(context, parsed.call, OWNED_KEYS, "");
  for (const key of context.listed) {
    if (!context.seen.has(key)) {
      context.problems.push(
        `${DEBT_FILE} lists ${key}, which the config no longer overrides; remove it`,
      );
    }
  }
  return context.problems;
}

/**
 * Loads a preset module of the workspace from its specifier, through the exports of
 * support/jest/package.json.
 *
 * @param {string} workspaceRoot
 * @returns {CheckContext["loadPreset"]}
 */
export function presetLoader(workspaceRoot) {
  const manifestPath = path.join(workspaceRoot, PRESET_ROOT, "package.json");
  let exportsMap;
  try {
    exportsMap = JSON.parse(fs.readFileSync(manifestPath, "utf8")).exports ?? {};
  } catch {
    return () => undefined;
  }
  const require = createRequire(manifestPath);
  return specifier => {
    const target = exportsMap[`.${specifier.slice(PACKAGE.length)}`];
    return typeof target === "string" && target.endsWith(".js") ? require(target) : undefined;
  };
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

/**
 * @param {import("./index.mjs").RuleContext} context
 * @param {{ debt?: Record<string, string[]>, loadPreset?: CheckContext["loadPreset"] }} [overrides]
 *   for tests
 * @returns {import("./index.mjs").Violation[]}
 */
export function check(
  { workspaceRoot, projectRoot },
  { debt = JEST_DEBT, loadPreset = presetLoader(workspaceRoot) } = {},
) {
  const directory = path.join(workspaceRoot, projectRoot);
  if (!dependsOnPreset(path.join(directory, "package.json"))) return [];

  const configs = fs
    .readdirSync(directory)
    .filter(file => CONFIG_FILE.test(file))
    .sort();

  const violations = configs.length
    ? configs.flatMap(file => {
        const name = `${projectRoot}/${file}`;
        const source = fs.readFileSync(path.join(directory, file), "utf8");
        const problem = factoryProblem(source);
        if (problem) {
          return [
            {
              file: name,
              message: `${problem}; export a create*Config(overrides) call from ${PACKAGE}/<preset>`,
            },
          ];
        }
        return overridesProblems(source, { listed: debt[name], loadPreset }).map(message => ({
          file: name,
          message,
        }));
      })
    : [
        {
          file: `${projectRoot}/package.json`,
          message: `depends on ${PACKAGE} but has no jest config built by one of its presets`,
        },
      ];

  // Entries for configs that are gone, so the debt list cannot keep a dead file alive.
  for (const name of Object.keys(debt)) {
    if (path.posix.dirname(name) === projectRoot && !configs.includes(path.posix.basename(name))) {
      violations.push({
        file: DEBT_FILE,
        message: `lists ${name}, which does not exist; remove it`,
      });
    }
  }
  return violations;
}

/** @type {import("./index.mjs").Rule} */
export default {
  name: "jest",
  inputs: [
    "{projectRoot}/package.json",
    "{projectRoot}/jest*.config.*",
    `{workspaceRoot}/${PRESET_ROOT}/**/*.js`,
    `{workspaceRoot}/${PRESET_ROOT}/package.json`,
  ],
  check,
};

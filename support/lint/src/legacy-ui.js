// Rationale and options: support/lint/README.md#legacy-ui.

import path from "node:path";

import { appRoot } from "./families-folder.js";

const LUMEN =
  "Use Lumen instead: .agents/skills/ldls-native/SKILL.md (Mobile), .agents/skills/ldls-web/SKILL.md (Desktop).";

const STYLED_COMPONENTS = new Set(["styled-components", "styled-components/native"]);
const SRC_ALIAS = "~/";
const SOURCE_EXTENSION = /\.[cm]?[jt]sx?$/;

/**
 * @typedef {object} LegacyUiOptions
 * @property {string[]} modules the legacy modules: a specifier matches an entry or a subpath of it. An entry
 *   starting with `~/` also matches a relative import that resolves to the same path.
 * @property {{ glob: string, reason: string }[]} [exemptPaths] files, relative to the app root, that no rule
 *   checks
 * @property {string[]} [bannedComponents] components that reached zero
 */

const SCHEMA = [
  {
    type: "object",
    properties: {
      modules: { type: "array", items: { type: "string" } },
      exemptPaths: {
        type: "array",
        items: {
          type: "object",
          properties: { glob: { type: "string" }, reason: { type: "string" } },
          required: ["glob", "reason"],
          additionalProperties: false,
        },
      },
      bannedComponents: { type: "array", items: { type: "string" } },
    },
    required: ["modules"],
    additionalProperties: false,
  },
];

const globCache = new Map();

/**
 * @param {string} glob `**` spans folders, `*` and `?` stay within one
 * @returns {RegExp}
 */
function globToRegExp(glob) {
  if (globCache.has(glob)) return globCache.get(glob);
  let pattern = "";
  for (let i = 0; i < glob.length; i++) {
    const char = glob[i];
    if (char === "*" && glob[i + 1] === "*") {
      const followedBySlash = glob[i + 2] === "/";
      pattern += followedBySlash ? "(?:.*/)?" : ".*";
      i += followedBySlash ? 2 : 1;
    } else if (char === "*") pattern += "[^/]*";
    else if (char === "?") pattern += "[^/]";
    else pattern += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  const regExp = new RegExp(`^${pattern}$`);
  globCache.set(glob, regExp);
  return regExp;
}

/**
 * @param {string | undefined} filename
 * @param {LegacyUiOptions["exemptPaths"]} exemptPaths
 * @returns {boolean} whether the file matches one of the globs, relative to its app root
 */
function isExempt(filename, exemptPaths = []) {
  if (typeof filename !== "string" || exemptPaths.length === 0) return false;
  const root = appRoot(path.dirname(filename));
  if (!root) return false;
  const relative = path.relative(root, filename).split(path.sep).join("/");
  return exemptPaths.some(({ glob }) => globToRegExp(glob).test(relative));
}

/**
 * @param {string} resolved an absolute path
 * @param {string} target an absolute path
 * @returns {boolean} whether `resolved` is `target` or below it
 */
function isAtOrBelow(resolved, target) {
  return resolved === target || resolved.startsWith(target + path.sep);
}

/**
 * Whether a relative specifier lands on a `~/` entry. The files of the entry itself do not count: they are the
 * legacy module, not one of its consumers.
 *
 * @param {string} specifier
 * @param {string} filename
 * @param {string} entry
 * @returns {boolean}
 */
function resolvesToAliasEntry(specifier, filename, entry) {
  const root = appRoot(path.dirname(filename));
  if (!root) return false;
  const target = path.join(root, "src", entry.slice(SRC_ALIAS.length));
  if (isAtOrBelow(filename, target)) return false;
  const resolved = path.resolve(path.dirname(filename), specifier).replace(SOURCE_EXTENSION, "");
  return isAtOrBelow(resolved, target);
}

/**
 * @param {unknown} specifier
 * @param {string | undefined} filename the importer
 * @param {string[]} modules
 * @returns {boolean} whether the specifier names one of the legacy modules
 */
function isLegacyModule(specifier, filename, modules = []) {
  if (typeof specifier !== "string") return false;
  return modules.some(entry => {
    if (specifier === entry || specifier.startsWith(`${entry}/`)) return true;
    return (
      entry.startsWith(SRC_ALIAS) &&
      specifier.startsWith(".") &&
      typeof filename === "string" &&
      resolvesToAliasEntry(specifier, filename, entry)
    );
  });
}

/**
 * The local bindings a file imports from the legacy modules, keyed by local name, with the name of the
 * component each one stands for: the imported name, or the local name of a default or namespace import.
 *
 * @param {{ body?: any[] }} program
 * @param {string | undefined} filename
 * @param {string[]} modules
 * @returns {Map<string, string>}
 */
function legacyBindings(program, filename, modules) {
  const bindings = new Map();
  for (const statement of program.body ?? []) {
    if (statement.type !== "ImportDeclaration") continue;
    if (!isLegacyModule(statement.source?.value, filename, modules)) continue;
    for (const specifier of statement.specifiers ?? []) {
      const local = specifier.local?.name;
      if (!local) continue;
      const imported = specifier.type === "ImportSpecifier" ? importedName(specifier) : local;
      bindings.set(local, imported);
    }
  }
  return bindings;
}

/** @param {{ imported?: { name?: string, value?: string } }} specifier */
function importedName(specifier) {
  return specifier.imported?.name ?? specifier.imported?.value;
}

/**
 * @param {{ type: string, name?: string | { name?: string }, object?: any, property?: { name?: string } }} name
 *   a JSX element name
 * @returns {{ root: string, rest: string[] } | null} the root identifier and the member path below it
 */
function splitJsxName(name) {
  if (name.type === "JSXIdentifier") return { root: /** @type {string} */ (name.name), rest: [] };
  if (name.type === "JSXMemberExpression") {
    const object = splitJsxName(name.object);
    return object && { root: object.root, rest: [...object.rest, name.property?.name ?? ""] };
  }
  return null;
}

/**
 * @param {{ createOnce(context: any, state: { options: LegacyUiOptions }): Record<string, Function> }} rule
 * @returns {{ meta: object, createOnce(context: any): Record<string, Function> }} the rule, reading the shared
 *   options in `before()` and skipping an exempt file
 */
function legacyUiRule(rule) {
  return {
    meta: { schema: SCHEMA },
    createOnce(context) {
      const state = { options: /** @type {LegacyUiOptions} */ ({ modules: [] }) };
      const visitors = rule.createOnce(context, state);
      return {
        ...visitors,
        before() {
          state.options = context.options?.[0] ?? { modules: [] };
          if (isExempt(context.filename, state.options.exemptPaths)) return false;
          return visitors.before?.();
        },
      };
    },
  };
}

const noLegacyImport = legacyUiRule({
  createOnce(context, state) {
    /** @param {{ source?: { value?: unknown } | null }} node */
    function check(node) {
      const specifier = node.source?.value;
      if (isLegacyModule(specifier, context.filename, state.options.modules)) {
        context.report({
          message: `Legacy UI module "${String(specifier)}": do not add imports of it. ${LUMEN}`,
          node,
        });
      }
    }
    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
    };
  },
});

const noLegacyElement = legacyUiRule({
  createOnce(context, state) {
    let bindings = new Map();
    return {
      Program(program) {
        bindings = legacyBindings(program, context.filename, state.options.modules);
      },
      JSXOpeningElement(node) {
        const name = splitJsxName(node.name);
        if (!name || !bindings.has(name.root)) return;
        const component = [name.root, ...name.rest].join(".");
        context.report({
          message: `Legacy UI component <${component} />: do not add uses of it. ${LUMEN}`,
          node,
        });
      },
    };
  },
});

const noStyledDefinition = legacyUiRule({
  createOnce(context) {
    let styled = null;

    /** @param {{ type?: string, name?: string } | undefined} node */
    const isStyled = node => styled !== null && node?.type === "Identifier" && node.name === styled;

    function report(node) {
      context.report({
        message: `styled-components definition: do not add styled components. ${LUMEN}`,
        node,
      });
    }

    return {
      Program(program) {
        styled = null;
        for (const statement of program.body ?? []) {
          if (statement.type !== "ImportDeclaration") continue;
          if (!STYLED_COMPONENTS.has(statement.source?.value)) continue;
          const defaultImport = statement.specifiers?.find(
            s => s.type === "ImportDefaultSpecifier",
          );
          if (defaultImport) styled = defaultImport.local.name;
        }
      },
      MemberExpression(node) {
        if (isStyled(node.object)) report(node);
      },
      CallExpression(node) {
        if (isStyled(node.callee)) report(node);
      },
    };
  },
});

const noBannedComponent = legacyUiRule({
  createOnce(context, state) {
    let bindings = new Map();
    let banned = new Set();

    /** @param {string} component @param {object} node */
    function report(component, node) {
      context.report({
        message: `Legacy UI component ${component} reached zero uses and is banned. ${LUMEN}`,
        node,
      });
    }

    return {
      Program(program) {
        banned = new Set(state.options.bannedComponents ?? []);
        bindings =
          banned.size === 0
            ? new Map()
            : legacyBindings(program, context.filename, state.options.modules);
        for (const statement of program.body ?? []) {
          if (statement.type !== "ImportDeclaration") continue;
          for (const specifier of statement.specifiers ?? []) {
            const component = bindings.get(specifier.local?.name);
            if (component && banned.has(component)) report(component, specifier);
          }
        }
      },
      JSXOpeningElement(node) {
        const name = splitJsxName(node.name);
        const component = name && bindings.get(name.root);
        if (!component) return;
        const full = [component, ...name.rest].join(".");
        if (banned.has(component)) report(component, node);
        else if (banned.has(full)) report(full, node);
      },
    };
  },
});

export { globToRegExp, isExempt, isLegacyModule };

export default {
  meta: {
    name: "legacy-ui",
  },
  rules: {
    "no-legacy-import": noLegacyImport,
    "no-legacy-element": noLegacyElement,
    "no-styled-definition": noStyledDefinition,
    "no-banned-component": noBannedComponent,
  },
};

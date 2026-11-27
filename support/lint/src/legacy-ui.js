// Rationale and options: support/lint/README.md#legacy-ui.

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { appRoot } from "./families-folder.js";

const LUMEN =
  "Use Lumen instead: .agents/skills/ldls-native/SKILL.md (Mobile), .agents/skills/ldls-web/SKILL.md (Desktop).";

const STYLED_COMPONENTS = new Set(["styled-components", "styled-components/native"]);
const ALIAS_PREFIX = "~/";

// Loaded on the first `~/` entry only, so an app without one never parses a tsconfig.
const require = createRequire(import.meta.url);
/** @type {typeof import("typescript")} */
let ts;

/**
 * @typedef {object} LegacyUiOptions
 * @property {string[]} modules the legacy modules: a specifier matches an entry or a subpath of it. An entry
 *   starting with `~/` also matches any specifier the app's tsconfig resolves to the same file or folder.
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
 * @typedef {object} AppResolver
 * @property {(specifier: string, containingFile: string) => string | null} resolve the file a specifier loads,
 *   through the app's tsconfig `paths` and module resolution
 * @property {Map<string, string | null>} targets each alias entry's resolved file, or its folder when it
 *   resolves to an index file
 */

/** @type {Map<string, AppResolver | null>} */
const resolverCache = new Map();

/**
 * @param {string} root an app root
 * @returns {AppResolver | null} the app's resolver, built once from its tsconfig.json
 */
function appResolver(root) {
  if (resolverCache.has(root)) return /** @type {AppResolver | null} */ (resolverCache.get(root));
  /** @type {AppResolver | null} */
  let resolver = null;
  const configFile = path.join(root, "tsconfig.json");
  if (fs.existsSync(configFile)) {
    ts ??= require("typescript");
    const { config } = ts.readConfigFile(configFile, ts.sys.readFile);
    const { options } = ts.parseJsonConfigFileContent(
      config ?? {},
      ts.sys,
      root,
      undefined,
      configFile,
    );
    const cache = ts.createModuleResolutionCache(root, name => name, options);
    /** @type {Map<string, string | null>} */
    const resolutions = new Map();
    resolver = {
      /** @param {string} specifier @param {string} containingFile */
      resolve(specifier, containingFile) {
        const key = `${path.dirname(containingFile)}\0${specifier}`;
        if (!resolutions.has(key)) {
          const { resolvedModule } = ts.resolveModuleName(
            specifier,
            containingFile,
            options,
            ts.sys,
            cache,
          );
          const file = resolvedModule?.resolvedFileName;
          resolutions.set(key, file === undefined ? null : realpath(file));
        }
        return /** @type {string | null} */ (resolutions.get(key));
      },
      targets: new Map(),
    };
  }
  resolverCache.set(root, resolver);
  return resolver;
}

/**
 * @param {AppResolver} resolver
 * @param {string} root
 * @param {string} entry
 * @returns {string | null} the file the entry resolves to, or its folder when that file is an index
 */
function aliasTarget(resolver, root, entry) {
  if (!resolver.targets.has(entry)) {
    const file = resolver.resolve(entry, path.join(root, "package.json"));
    const isIndex = file !== null && path.basename(file).startsWith("index.");
    resolver.targets.set(entry, file !== null && isIndex ? path.dirname(file) : file);
  }
  return /** @type {string | null} */ (resolver.targets.get(entry));
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
 * @param {string} file
 * @returns {string} the file with its symlinks resolved, so an importer and a resolution compare equal
 */
function realpath(file) {
  try {
    return fs.realpathSync.native(file);
  } catch {
    return file;
  }
}

/**
 * Whether a specifier loads an alias entry, as the app's TypeScript resolver sees it. The files of the entry
 * itself do not count: they are the legacy module, not one of its consumers.
 *
 * @param {string} specifier
 * @param {string} filename
 * @param {string} entry
 * @returns {boolean}
 */
function resolvesToAliasEntry(specifier, filename, entry) {
  // A specifier that reaches the entry from outside it names the entry's last segment, so others skip resolution.
  if (!specifier.includes(path.posix.basename(entry))) return false;
  const root = appRoot(path.dirname(filename));
  const resolver = root && appResolver(root);
  if (!root || !resolver) return false;
  const target = aliasTarget(resolver, root, entry);
  if (target === null) return false;
  const importer = realpath(filename);
  if (isAtOrBelow(importer, target)) return false;
  const resolved = resolver.resolve(specifier, importer);
  return resolved !== null && isAtOrBelow(resolved, target);
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
      entry.startsWith(ALIAS_PREFIX) &&
      typeof filename === "string" &&
      resolvesToAliasEntry(specifier, filename, entry)
    );
  });
}

/**
 * @typedef {object} LegacyBinding
 * @property {string} component the imported name, or the local name of a default import
 * @property {boolean} namespace whether it is a namespace import, whose members are the components
 */

/**
 * The local bindings a file imports from the legacy modules, keyed by local name.
 *
 * @param {{ body?: any[] }} program
 * @param {string | undefined} filename
 * @param {string[]} modules
 * @returns {Map<string, LegacyBinding>}
 */
function legacyBindings(program, filename, modules) {
  /** @type {Map<string, LegacyBinding>} */
  const bindings = new Map();
  for (const statement of program.body ?? []) {
    if (statement.type !== "ImportDeclaration") continue;
    if (!isLegacyModule(statement.source?.value, filename, modules)) continue;
    for (const specifier of statement.specifiers ?? []) {
      const local = specifier.local?.name;
      if (!local) continue;
      const component = specifier.type === "ImportSpecifier" ? importedName(specifier) : local;
      bindings.set(local, {
        component,
        namespace: specifier.type === "ImportNamespaceSpecifier",
      });
    }
  }
  return bindings;
}

/**
 * @param {LegacyBinding} binding the binding of a JSX name's root
 * @param {string[]} rest the member path below the root
 * @returns {string[]} the component path: `<UI.Flex />` of a namespace import is `Flex`
 */
function componentPath(binding, rest) {
  return binding.namespace ? rest : [binding.component, ...rest];
}

/**
 * @param {any} context
 * @param {object} node
 * @param {string} name
 * @returns {boolean} whether `name`, seen from `node`, is an import binding and not a local that shadows it
 */
function refersToImport(context, node, name) {
  for (let scope = context.sourceCode.getScope(node); scope; scope = scope.upper) {
    const variable = scope.set.get(name);
    if (variable) return variable.defs.some(def => def.type === "ImportBinding");
  }
  return false;
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
    /** @param {any} context */
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
    /** @type {Map<string, LegacyBinding>} */
    let bindings = new Map();
    return {
      /** @param {{ body?: any[] }} program */
      Program(program) {
        bindings = legacyBindings(program, context.filename, state.options.modules);
      },
      /** @param {{ name: any }} node */
      JSXOpeningElement(node) {
        const name = splitJsxName(node.name);
        if (!name || !bindings.has(name.root)) return;
        if (!refersToImport(context, node, name.root)) return;
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
    /** @type {string | null} */
    let styled = null;

    /** @param {{ type?: string, name?: string } | undefined} node */
    const isStyled = node => styled !== null && node?.type === "Identifier" && node.name === styled;

    /** @param {object} node */
    function report(node) {
      context.report({
        message: `styled-components definition: do not add styled components. ${LUMEN}`,
        node,
      });
    }

    return {
      /** @param {{ body?: any[] }} program */
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
      /** @param {{ object: any }} node */
      MemberExpression(node) {
        if (isStyled(node.object)) report(node);
      },
      /** @param {{ callee: any }} node */
      CallExpression(node) {
        if (isStyled(node.callee)) report(node);
      },
    };
  },
});

const noBannedComponent = legacyUiRule({
  createOnce(context, state) {
    /** @type {Map<string, LegacyBinding>} */
    let bindings = new Map();
    /** @type {Set<string>} */
    let banned = new Set();

    /** @param {string} component @param {object} node */
    function report(component, node) {
      context.report({
        message: `Legacy UI component ${component} reached zero uses and is banned. ${LUMEN}`,
        node,
      });
    }

    return {
      /** @param {{ body?: any[] }} program */
      Program(program) {
        banned = new Set(state.options.bannedComponents ?? []);
        bindings =
          banned.size === 0
            ? new Map()
            : legacyBindings(program, context.filename, state.options.modules);
        for (const statement of program.body ?? []) {
          if (statement.type !== "ImportDeclaration") continue;
          for (const specifier of statement.specifiers ?? []) {
            const binding = bindings.get(specifier.local?.name);
            if (binding && !binding.namespace && banned.has(binding.component)) {
              report(binding.component, specifier);
            }
          }
        }
      },
      /** @param {{ name: any }} node */
      JSXOpeningElement(node) {
        const name = splitJsxName(node.name);
        const binding = name && bindings.get(name.root);
        if (!name || !binding || !refersToImport(context, node, name.root)) return;
        const [component, ...rest] = componentPath(binding, name.rest);
        const full = [component, ...rest].join(".");
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

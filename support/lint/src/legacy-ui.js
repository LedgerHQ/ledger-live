// Rationale and options: support/lint/README.md#legacy-ui.

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { appRoot } from "./families-folder.js";
import { FILE_WAIVERS, FOLDER_WAIVERS } from "./legacy-ui-waivers.js";

const LUMEN =
  "Use Lumen instead: .agents/skills/ldls-native/SKILL.md (Mobile), .agents/skills/ldls-web/SKILL.md (Desktop).";

const MESSAGES = {
  /** @param {unknown} specifier */
  legacyImport: specifier => `Legacy UI module "${String(specifier)}": do not import it. ${LUMEN}`,
  /** @param {string} component */
  bannedComponent: component =>
    `Legacy UI component ${component} reached zero uses and is banned. ${LUMEN}`,
};

const REPO_ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const ALIAS_PREFIX = "~/";

// Loaded on the first `~/` entry only, so an app without one never parses a tsconfig.
const require = createRequire(import.meta.url);
/** @type {typeof import("typescript")} */
let ts;

/**
 * @typedef {object} LegacyUiOptions
 * @property {string[]} modules the legacy modules: a specifier matches an entry or a subpath of it. An entry
 *   starting with `~/` also matches any specifier the app's tsconfig resolves to the same file or folder.
 * @property {string[]} [bannedComponents] components that reached zero
 */

/**
 * @typedef {object} Waivers
 * @property {string} repoRoot the folder the waiver keys are relative to
 * @property {Record<string, string>} fileWaivers files `no-legacy-import` skips
 * @property {Record<string, string>} folderWaivers globs of files no rule checks
 */

const SCHEMA = [
  {
    type: "object",
    properties: {
      modules: { type: "array", items: { type: "string" } },
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
 * @param {string} repoRoot
 * @param {string} filename an absolute path
 * @returns {string} the posix path of the file from the repo root, the key of a waiver
 */
function repoPath(repoRoot, filename) {
  return path.relative(repoRoot, filename).split(path.sep).join("/");
}

/**
 * @param {string} file a posix path from the repo root
 * @param {Record<string, string>} folderWaivers
 * @returns {boolean} whether one of the folder waiver globs matches the file
 */
function isInFolderWaiver(file, folderWaivers) {
  return Object.keys(folderWaivers).some(glob => globToRegExp(glob).test(file));
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
 * Whether a specifier loads an alias entry, spelled as the entry or as anything the app's TypeScript resolver
 * resolves to it. The files of the entry itself do not count, whatever the spelling: they are the legacy
 * module, not one of its consumers.
 *
 * @param {string} specifier
 * @param {string} filename
 * @param {string} entry
 * @returns {boolean}
 */
function isAliasEntryImport(specifier, filename, entry) {
  const direct = specifier === entry || specifier.startsWith(`${entry}/`);
  const root = appRoot(path.dirname(filename));
  const resolver = root && appResolver(root);
  const target = root && resolver ? aliasTarget(resolver, root, entry) : null;
  if (!resolver || target === null) return direct;
  const importer = realpath(filename);
  if (isAtOrBelow(importer, target)) return false;
  if (direct) return true;
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
    if (entry.startsWith(ALIAS_PREFIX) && typeof filename === "string") {
      return isAliasEntryImport(specifier, filename, entry);
    }
    return specifier === entry || specifier.startsWith(`${entry}/`);
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
 * @param {Waivers} waivers
 * @param {boolean} honoursFileWaivers whether a file waiver silences the rule too, not only a folder waiver
 * @param {(context: any, state: { options: LegacyUiOptions }) => Record<string, Function>} createOnce
 * @returns {{ meta: object, createOnce(context: any): Record<string, Function> }} the rule, reading its
 *   options in `before()` and skipping a waived file
 */
function legacyUiRule(waivers, honoursFileWaivers, createOnce) {
  return {
    meta: { schema: SCHEMA },
    /** @param {any} context */
    createOnce(context) {
      const state = { options: /** @type {LegacyUiOptions} */ ({ modules: [] }) };
      const visitors = createOnce(context, state);
      return {
        ...visitors,
        before() {
          state.options = context.options?.[0] ?? { modules: [] };
          if (typeof context.filename === "string") {
            const file = repoPath(waivers.repoRoot, realpath(context.filename));
            if (isInFolderWaiver(file, waivers.folderWaivers)) return false;
            if (honoursFileWaivers && Object.hasOwn(waivers.fileWaivers, file)) return false;
          }
          return visitors.before?.();
        },
      };
    },
  };
}

/**
 * @param {Waivers} waivers
 * @returns {object} the `legacy-ui` plugin, skipping the files and folders the waivers name, compared by real
 *   path
 */
function createLegacyUiPlugin(waivers) {
  const realWaivers = { ...waivers, repoRoot: realpath(waivers.repoRoot) };
  const noLegacyImport = legacyUiRule(realWaivers, true, (context, state) => {
    /** @param {{ source?: { value?: unknown } | null }} node */
    function check(node) {
      const specifier = node.source?.value;
      if (isLegacyModule(specifier, context.filename, state.options.modules)) {
        context.report({
          message: MESSAGES.legacyImport(specifier),
          node,
        });
      }
    }
    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
    };
  });

  const noBannedComponent = legacyUiRule(realWaivers, false, (context, state) => {
    /** @type {Map<string, LegacyBinding>} */
    let bindings = new Map();
    /** @type {Set<string>} */
    let banned = new Set();

    /** @param {string} component @param {object} node */
    function report(component, node) {
      context.report({
        message: MESSAGES.bannedComponent(component),
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
  });

  return {
    meta: { name: "legacy-ui" },
    rules: {
      "no-legacy-import": noLegacyImport,
      "no-banned-component": noBannedComponent,
    },
  };
}

export { createLegacyUiPlugin, globToRegExp, isLegacyModule, repoPath };

export default createLegacyUiPlugin({
  repoRoot: REPO_ROOT,
  fileWaivers: FILE_WAIVERS,
  folderWaivers: FOLDER_WAIVERS,
});

"use strict";

// Public components of a dual-platform package, per entry and per platform.
//
// A universal entry (an `exports` entry with a `react-native` condition, or one without a
// condition whose exports resolve to different modules on each platform) is resolved twice, the way the app
// bundlers do: Rspack on desktop, Re.Pack on mobile. A platform entry (`./web` or `./native`
// without a condition) is resolved once, for its platform. Re-exports are followed to
// the declaring module, parsed with the TypeScript parser alone: no program, no type checker.
// Entries whose subpath has a segment starting with one of `ignoredEntryPrefixes` (test support)
// are not checked.
//
// Settings live in components.config.json: `extensions` mirror the bundlers
// (apps/ledger-live-desktop/tools/rspack/rspack.renderer.ts for web,
// Repack.getResolveOptions(platform, { preferNativePlatform: true }) for native), `conditions`
// pick an entry's file per platform, `platformEntries` name the platform subpaths and
// `componentWrappers` the calls that still return a component. The `banned*` settings and
// `gestureWords` list what a contract may not import or name, `neutralReactTypes` and
// `sharedGlobals` the React types and host globals it may reference (R3).
//
// R1: a universal component is exported on both platforms under the same name.
// R2: both implementations annotate their first parameter with one props type name, declared in
// one unsuffixed module, the contract, with no platform-suffixed sibling.
// R3: the contract imports no platform package, references no global outside the ECMAScript
// library or `sharedGlobals` and no React type outside `neutralReactTypes`, and declares no
// `className`, `style` or gesture callback, nested local types included; a `@platform` prop is an
// optional primitive.
// R4: a platform module that declares a universal component exports components only.
// R5: a component is exported from universal entries or from platform entries, never both, and a
// platform entry points at a module of its own that carries its platform's suffix.
//
// R2 to R4 read names and modules, not types: a contract's props are followed through its own
// type declarations only.

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

/** @typedef {"web" | "native"} Platform */
/** @typedef {{ file: string, line: number, isComponent: boolean, node: ts.Node | undefined }} ExportInfo */
/** @typedef {{ rule: "R1" | "R2" | "R3" | "R4" | "R5", subject: string, file: string, line: number, code: string, message: string, text: string }} ComponentViolation */

const CONFIG = require("./components.config.json");

/** @type {Record<Platform, string[]>} */
const EXTENSIONS = CONFIG.extensions;
/** @type {Record<Platform, string[]>} */
const CONDITIONS = CONFIG.conditions;
/** @type {Record<string, Platform>} */
const PLATFORM_ENTRIES = CONFIG.platformEntries;
const PLATFORM_SUFFIX = {
  web: /\.web\.[cm]?[jt]sx?$/,
  native: /\.(?:native|ios|android)\.[cm]?[jt]sx?$/,
};

const IGNORED_ENTRY_PREFIXES = CONFIG.ignoredEntryPrefixes;
const SOURCE_FILE = /\.[cm]?[jt]sx?$/;
const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;
const COMPONENT_WRAPPERS = new Set(CONFIG.componentWrappers);

// The ECMAScript declaration files TypeScript ships, without the DOM and host ones.
const STANDARD_LIB_FILE = /^lib\.(?:es\d+|esnext|decorators)(?:\.[\w-]+)*\.d\.ts$/;
const PLATFORM_SUFFIXES = [".web", ".native", ".ios", ".android"];
const CONTRACT_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];
const BANNED_IMPORT_PREFIXES = CONFIG.bannedImportPrefixes;
const NEUTRAL_REACT_TYPES = new Set(CONFIG.neutralReactTypes);
// Library types whose arguments keep all their props; `Pick` and `Omit` drop some, so R3 does not
// read their arguments, nor those of imported types.
const PROPS_PRESERVING_TYPES = new Set([
  "Readonly",
  "Partial",
  "Required",
  "NonNullable",
  "Array",
  "ReadonlyArray",
  "Record",
]);
const SHARED_GLOBALS = new Set(CONFIG.sharedGlobals);
const BANNED_PROP_NAMES = new Set(CONFIG.bannedPropNames);
const BANNED_CALLBACK_NAMES = CONFIG.bannedCallbackNames.map(camelCaseGlob);
const GESTURE_WORDS = new Set(CONFIG.gestureWords);
const CALLBACK_NAME = /^on[A-Z]/;
const CAMEL_CASE_WORD = /[A-Z]+(?![a-z])|[A-Z]?[a-z0-9]+/g;
const PRIMITIVE_KEYWORDS = new Set([
  ts.SyntaxKind.BooleanKeyword,
  ts.SyntaxKind.NumberKeyword,
  ts.SyntaxKind.StringKeyword,
]);

/**
 * @param {unknown} target
 * @returns {boolean}
 */
function hasReactNativeCondition(target) {
  if (target === null || typeof target !== "object") return false;
  return Object.entries(target).some(
    ([key, value]) => key === "react-native" || hasReactNativeCondition(value),
  );
}

/**
 * The file a conditional export target selects, taking the first matching key in object order.
 *
 * @param {unknown} target
 * @param {string[]} conditions
 * @returns {string | null}
 */
function selectTarget(target, conditions) {
  if (typeof target === "string") return target;
  if (target === null || typeof target !== "object") return null;
  for (const [key, value] of Object.entries(target)) {
    if (!conditions.includes(key)) continue;
    const selected = selectTarget(value, conditions);
    if (selected) return selected;
  }
  return null;
}

/**
 * @param {string} subpath
 * @returns {boolean}
 */
function isIgnoredEntry(subpath) {
  return subpath
    .split("/")
    .some(segment => IGNORED_ENTRY_PREFIXES.some(prefix => segment.startsWith(prefix)));
}

/**
 * Entries of a `package.json#exports`, with the file each platform selects, ignored entries left
 * out. `unconditioned` entries become universal when their exports resolve to different
 * modules on each platform.
 *
 * @param {unknown} exportsField
 * @returns {{ universal: Array<{ subpath: string, web: string | null, native: string | null }>, platform: Array<{ subpath: string, platform: Platform, target: string }>, unconditioned: Array<{ subpath: string, target: string }> }}
 */
function classifyEntries(exportsField) {
  const universal = [];
  const platform = [];
  const unconditioned = [];
  if (
    typeof exportsField !== "string" &&
    (exportsField === null || typeof exportsField !== "object")
  )
    return { universal, platform, unconditioned };
  // A string, or an object of conditions alone, is the target of the root entry.
  const isRootTarget =
    typeof exportsField === "string" ||
    (Object.keys(exportsField).length > 0 &&
      !Object.keys(exportsField).some(key => key.startsWith(".")));
  const entries = isRootTarget ? { ".": exportsField } : exportsField;

  for (const [subpath, target] of Object.entries(entries)) {
    if (isIgnoredEntry(subpath)) continue;
    if (hasReactNativeCondition(target)) {
      universal.push({
        subpath,
        web: selectTarget(target, CONDITIONS.web),
        native: selectTarget(target, CONDITIONS.native),
      });
    } else if (typeof target === "string" && Object.hasOwn(PLATFORM_ENTRIES, subpath)) {
      platform.push({ subpath, platform: PLATFORM_ENTRIES[subpath], target });
    } else if (typeof target === "string" && SOURCE_FILE.test(target)) {
      unconditioned.push({ subpath, target });
    }
  }
  return { universal, platform, unconditioned };
}

/**
 * @param {string} file
 * @returns {boolean}
 */
function isFile(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

/**
 * Resolve a relative specifier the way the platform's bundler does: the exact file, then each
 * extension in order, then the directory's `index` with the same extensions.
 *
 * @param {string} fromFile absolute path of the importing module
 * @param {string} specifier
 * @param {Platform} platform
 * @param {string[]} [extensions] the platform's own by default
 * @returns {string | null} absolute path, or null for a package specifier or a missing file
 */
function resolveRelative(fromFile, specifier, platform, extensions = EXTENSIONS[platform]) {
  if (!specifier.startsWith(".")) return null;
  const base = path.resolve(path.dirname(fromFile), specifier);
  if (isFile(base)) return base;
  for (const ext of extensions) {
    if (isFile(base + ext)) return base + ext;
  }
  for (const ext of extensions) {
    const index = path.join(base, `index${ext}`);
    if (isFile(index)) return index;
  }
  return null;
}

/**
 * @param {ts.Expression} expression
 * @returns {ts.Expression}
 */
function unwrap(expression) {
  let current = expression;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isNonNullExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

/**
 * True for a function, or a `memo(...)` / `forwardRef(...)` call, `React.` prefix allowed.
 *
 * @param {ts.Expression | undefined} expression
 * @returns {boolean}
 */
function isFunctionExpression(expression) {
  if (!expression) return false;
  const node = unwrap(expression);
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return true;
  if (!ts.isCallExpression(node)) return false;
  const callee = node.expression;
  if (ts.isIdentifier(callee)) return COMPONENT_WRAPPERS.has(callee.text);
  return ts.isPropertyAccessExpression(callee) && COMPONENT_WRAPPERS.has(callee.name.text);
}

/**
 * @param {ts.Node} node
 * @returns {boolean}
 */
function hasExportModifier(node) {
  return (ts.getModifiers(node) ?? []).some(m => m.kind === ts.SyntaxKind.ExportKeyword);
}

/**
 * @param {ts.Node} node
 * @returns {boolean}
 */
function hasDefaultModifier(node) {
  return (ts.getModifiers(node) ?? []).some(m => m.kind === ts.SyntaxKind.DefaultKeyword);
}

/**
 * The syntactic export table of one module.
 *
 * `declarations` holds the top-level declarations, `bindings` maps a local name to the value import
 * it comes from, `localExports` maps an exported name to a local name, `named` maps an exported name
 * to a re-export, `typeExports` maps a name a type-only local export clause exports to a local name,
 * `stars` lists the `export * from` specifiers. `types` holds the top-level type
 * aliases and interfaces, `imports` maps a local name to any import, type-only and namespace ones
 * included.
 *
 * @param {string} file
 * @param {string} source
 */
function parseModule(file, source) {
  const kind =
    file.endsWith(".tsx") || file.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);

  function lineOf(node) {
    return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
  }

  /** @type {Map<string, { line: number, isFunction: boolean, node: ts.Node | undefined }>} */
  const declarations = new Map();
  /** @type {Map<string, ts.TypeAliasDeclaration | ts.InterfaceDeclaration>} */
  const types = new Map();
  /** @type {Map<string, { specifier: string, imported: string }>} */
  const imports = new Map();
  /** @type {Map<string, { specifier: string, imported: string }>} */
  const bindings = new Map();
  /** @type {Map<string, string>} exported name to local name */
  const localExports = new Map();
  /** @type {Map<string, string>} exported name to local name, for `export type { X }` */
  const typeExports = new Map();
  /** @type {Map<string, { specifier: string, imported: string }>} */
  const named = new Map();
  /** @type {string[]} */
  const stars = [];

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      const name = statement.name.text;
      declarations.set(name, { line: lineOf(statement), isFunction: true, node: statement });
      if (hasExportModifier(statement)) {
        localExports.set(hasDefaultModifier(statement) ? "default" : name, name);
      }
    } else if (ts.isFunctionDeclaration(statement) && hasDefaultModifier(statement)) {
      declarations.set("*default*", { line: lineOf(statement), isFunction: true, node: statement });
      localExports.set("default", "*default*");
    } else if (ts.isClassDeclaration(statement) && statement.name) {
      const name = statement.name.text;
      declarations.set(name, { line: lineOf(statement), isFunction: false, node: statement });
      if (hasExportModifier(statement)) {
        localExports.set(hasDefaultModifier(statement) ? "default" : name, name);
      }
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;
        const name = declaration.name.text;
        declarations.set(name, {
          line: lineOf(declaration),
          isFunction: isFunctionExpression(declaration.initializer),
          node: declaration.initializer,
        });
        if (hasExportModifier(statement)) localExports.set(name, name);
      }
    } else if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      const expression = unwrap(statement.expression);
      if (ts.isIdentifier(expression)) {
        localExports.set("default", expression.text);
      } else {
        declarations.set("*default*", {
          line: lineOf(statement),
          isFunction: isFunctionExpression(statement.expression),
          node: statement.expression,
        });
        localExports.set("default", "*default*");
      }
    } else if (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) {
      types.set(statement.name.text, statement);
      if (hasDefaultModifier(statement)) types.set("default", statement);
    } else if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const clause = statement.importClause;
      if (!clause) continue;
      const specifier = statement.moduleSpecifier.text;
      if (clause.name) {
        imports.set(clause.name.text, { specifier, imported: "default" });
        if (!clause.isTypeOnly) bindings.set(clause.name.text, { specifier, imported: "default" });
      }
      if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        for (const element of clause.namedBindings.elements) {
          const imported = (element.propertyName ?? element.name).text;
          imports.set(element.name.text, { specifier, imported });
          if (clause.isTypeOnly || element.isTypeOnly) continue;
          bindings.set(element.name.text, { specifier, imported });
        }
      }
      if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
        imports.set(clause.namedBindings.name.text, { specifier, imported: "*" });
      }
    } else if (ts.isExportDeclaration(statement)) {
      const specifier =
        statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
          ? statement.moduleSpecifier.text
          : null;
      const clause = statement.exportClause;
      if (!clause) {
        if (specifier && !statement.isTypeOnly) stars.push(specifier);
        continue;
      }
      if (!ts.isNamedExports(clause)) continue;
      for (const element of clause.elements) {
        const exported = element.name.text;
        const local = (element.propertyName ?? element.name).text;
        if (statement.isTypeOnly || element.isTypeOnly) {
          if (!specifier) typeExports.set(exported, local);
        } else if (specifier) {
          named.set(exported, { specifier, imported: local });
        } else {
          localExports.set(exported, local);
        }
      }
    }
  }

  return {
    sourceFile,
    lineOf,
    declarations,
    types,
    bindings,
    imports,
    localExports,
    typeExports,
    named,
    stars,
  };
}

/**
 * Follows the re-exports of a platform's module graph, parsing each module once. `exportsOf` maps
 * the named exports of an entry module to their declarations, `load` parses one module.
 *
 * @param {Platform} platform
 */
function createExportCollector(platform) {
  /** @type {Map<string, ReturnType<typeof parseModule> | null>} */
  const parsed = new Map();

  function load(file) {
    if (!parsed.has(file)) {
      let source = null;
      try {
        source = fs.readFileSync(file, "utf8");
      } catch {
        // A missing target leaves the entry empty; typecheck reports it.
      }
      parsed.set(file, source === null ? null : parseModule(file, source));
    }
    return parsed.get(file);
  }

  /**
   * @param {string} file
   * @param {string} name
   * @param {Set<string>} seen
   * @returns {ExportInfo | null}
   */
  function declarationOf(file, name, seen) {
    const key = `${file}#${name}`;
    if (seen.has(key)) return null;
    seen.add(key);
    const module = load(file);
    if (!module) return null;

    const local = module.localExports.get(name);
    if (local !== undefined) {
      const declaration = module.declarations.get(local);
      if (declaration) {
        return {
          file,
          line: declaration.line,
          isComponent: declaration.isFunction && file.endsWith(".tsx"),
          node: declaration.node,
        };
      }
      const binding = module.bindings.get(local);
      return binding ? follow(file, binding, seen) : null;
    }
    const reexport = module.named.get(name);
    if (reexport) return follow(file, reexport, seen);
    if (name === "default") return null;
    for (const specifier of module.stars) {
      const target = resolveRelative(file, specifier, platform);
      if (!target) continue;
      const found = declarationOf(target, name, seen);
      if (found) return found;
    }
    return null;
  }

  function follow(file, { specifier, imported }, seen) {
    const target = resolveRelative(file, specifier, platform);
    return target ? declarationOf(target, imported, seen) : null;
  }

  /**
   * @param {string} file
   * @param {Set<string>} seen
   * @returns {Set<string>}
   */
  function namesOf(file, seen) {
    const names = new Set();
    if (seen.has(file)) return names;
    seen.add(file);
    const module = load(file);
    if (!module) return names;
    for (const name of module.localExports.keys()) names.add(name);
    for (const name of module.named.keys()) names.add(name);
    for (const specifier of module.stars) {
      const target = resolveRelative(file, specifier, platform);
      if (!target) continue;
      for (const name of namesOf(target, seen)) {
        if (name !== "default") names.add(name);
      }
    }
    return names;
  }

  /**
   * @param {string} entryFile absolute path
   * @returns {Map<string, ExportInfo>}
   */
  function exportsOf(entryFile) {
    /** @type {Map<string, ExportInfo>} */
    const out = new Map();
    for (const name of namesOf(entryFile, new Set())) {
      if (name === "default") continue;
      const info = declarationOf(entryFile, name, new Set());
      if (info) out.set(name, info);
    }
    return out;
  }

  return { exportsOf, load };
}

/**
 * @param {Map<string, ExportInfo>} exported
 * @returns {Map<string, ExportInfo>}
 */
function componentsOf(exported) {
  return new Map(
    [...exported].filter(([name, info]) => info.isComponent && PASCAL_CASE.test(name)),
  );
}

/**
 * Components of every entry of a package.
 *
 * @param {string} packageDir absolute path
 * @param {unknown} exportsField
 */
function collectEntryComponents(packageDir, exportsField) {
  const { universal, platform, unconditioned } = classifyEntries(exportsField);
  const collectors = { web: createExportCollector("web"), native: createExportCollector("native") };

  function absolute(target) {
    return target ? path.resolve(packageDir, target) : null;
  }

  function resolvesPerPlatform(target) {
    const web = collectors.web.exportsOf(absolute(target));
    const native = collectors.native.exportsOf(absolute(target));
    return (
      web.size !== native.size ||
      [...web].some(([name, info]) => native.get(name)?.file !== info.file)
    );
  }

  const perPlatform = unconditioned
    .filter(entry => resolvesPerPlatform(entry.target))
    .map(entry => ({ subpath: entry.subpath, web: entry.target, native: entry.target }));

  return {
    universal: [...universal, ...perPlatform].map(entry => ({
      subpath: entry.subpath,
      files: { web: absolute(entry.web), native: absolute(entry.native) },
      components: {
        web: entry.web ? componentsOf(collectors.web.exportsOf(absolute(entry.web))) : new Map(),
        native: entry.native
          ? componentsOf(collectors.native.exportsOf(absolute(entry.native)))
          : new Map(),
      },
    })),
    platform: platform.map(entry => ({
      subpath: entry.subpath,
      platform: entry.platform,
      file: absolute(entry.target),
      components: componentsOf(collectors[entry.platform].exportsOf(absolute(entry.target))),
    })),
    load: { web: collectors.web.load, native: collectors.native.load },
  };
}

/**
 * @param {string} glob `*` stands for zero or more camelCase words, as in `HTML*Element`
 * @returns {RegExp}
 */
function camelCaseGlob(glob) {
  const parts = glob.split("*").map(part => part.replace(/[$()+.?[\\\]^{|}]/g, "\\$&"));
  return new RegExp(`^${parts.join("(?:[A-Z][A-Za-z0-9]*)?")}$`);
}

/**
 * @param {ts.Node | undefined} node
 * @param {ReturnType<typeof parseModule>} module
 * @param {Set<string>} [seen]
 * @returns {{ fn?: ts.SignatureDeclaration, typeArgument?: ts.TypeNode } | null} the function a
 *   component evaluates to, with the props type a `forwardRef<Ref, Props>` or `memo<Props>` call
 *   names; that type is the public contract, so it is kept when the render function is out of reach
 */
function componentFunction(node, module, seen = new Set()) {
  if (!node) return null;
  if (ts.isFunctionDeclaration(node)) return { fn: node };
  const expression = unwrap(/** @type {ts.Expression} */ (node));
  if (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)) {
    return { fn: expression };
  }
  if (ts.isIdentifier(expression)) {
    if (seen.has(expression.text)) return null;
    seen.add(expression.text);
    return componentFunction(module.declarations.get(expression.text)?.node, module, seen);
  }
  if (!ts.isCallExpression(expression)) return null;
  const callee = expression.expression;
  const name = ts.isPropertyAccessExpression(callee)
    ? callee.name.text
    : ts.isIdentifier(callee)
      ? callee.text
      : "";
  if (!COMPONENT_WRAPPERS.has(name)) return null;
  const inner = componentFunction(expression.arguments[0], module, seen);
  const argument = expression.typeArguments?.[name === "forwardRef" ? 1 : 0];
  // `memo<typeof CardImpl>(CardImpl)` names the component, not its props: read the function.
  const typeArgument = argument && !ts.isTypeQueryNode(argument) ? argument : undefined;
  if (!inner && !typeArgument) return null;
  return { fn: inner?.fn, typeArgument: typeArgument ?? inner?.typeArgument };
}

/**
 * @param {ts.TypeNode | undefined} type
 * @returns {string | null} the type name a props annotation names, `Readonly<X>` read as `X`
 */
function propsTypeName(type) {
  if (!type || !ts.isTypeReferenceNode(type) || !ts.isIdentifier(type.typeName)) return null;
  if (type.typeName.text === "Readonly" && type.typeArguments?.length === 1) {
    return propsTypeName(type.typeArguments[0]);
  }
  return type.typeName.text;
}

/**
 * The props a component takes: none, a type name, something else, or out of reach, such as
 * `memo` around an imported function. The props argument of `forwardRef<Ref, Props>` comes
 * before the render function's own annotation.
 *
 * @param {ExportInfo} info
 * @param {ReturnType<typeof parseModule>} module
 * @returns {{ kind: "none" } | { kind: "unnamed" } | { kind: "unreadable" } | { kind: "named", name: string }}
 */
function propsOf(info, module) {
  const component = componentFunction(info.node, module);
  if (!component) return { kind: "unreadable" };
  const [parameter] = component.fn?.parameters ?? [];
  const type = component.typeArgument ?? parameter?.type;
  if (!parameter && !type) return { kind: "none" };
  const name = propsTypeName(type);
  return name ? { kind: "named", name } : { kind: "unnamed" };
}

/**
 * The module that declares a props type, followed from the implementation that names it.
 *
 * @param {string} file implementation, absolute path
 * @param {string} name the props type name
 * @param {Platform} platform
 * @param {(file: string) => ReturnType<typeof parseModule> | null} load
 * @returns {{ file: string, declaration: ts.TypeAliasDeclaration | ts.InterfaceDeclaration } | { code: string, imported?: string }}
 */
function contractOf(file, name, platform, load) {
  const module = load(file);
  const local = module?.types.get(name);
  if (local) return { file, declaration: local };
  const imported = module?.imports.get(name);
  if (!imported) return { code: "contract-not-found" };
  if (!imported.specifier.startsWith(".")) {
    return { code: "contract-outside-package", imported: imported.specifier };
  }
  const target = resolveRelative(file, imported.specifier, platform);
  const contract = target ? load(target) : null;
  const declaration =
    contract?.types.get(imported.imported) ??
    contract?.types.get(
      contract.localExports.get(imported.imported) ??
        contract.typeExports.get(imported.imported) ??
        "",
    );
  if (!target || !declaration) return { code: "contract-reexported", imported: target ?? "" };
  return { file: target, declaration };
}

/**
 * @param {string} file
 * @returns {boolean}
 */
function isPlatformModule(file) {
  return PLATFORM_SUFFIX.web.test(file) || PLATFORM_SUFFIX.native.test(file);
}

/**
 * @param {string} file
 * @returns {string[]} the platform-suffixed files that shadow `file` on one platform
 */
function suffixedSiblings(file) {
  const base = file.slice(0, -path.extname(file).length);
  return PLATFORM_SUFFIXES.flatMap(suffix =>
    CONTRACT_EXTENSIONS.map(extension => `${base}${suffix}${extension}`),
  ).filter(isFile);
}

/**
 * @param {ts.Node} name
 * @returns {string[]} the segments of an entity name, `React.JSX.Element` read as three, or none
 *   for an expression that is not a name
 */
function nameSegments(name) {
  if (ts.isIdentifier(name)) return [name.text];
  const [left, right] = ts.isQualifiedName(name)
    ? [name.left, name.right]
    : ts.isPropertyAccessExpression(name)
      ? [name.expression, name.name]
      : [];
  const segments = left ? nameSegments(left) : [];
  return segments.length > 0 ? [...segments, right.text] : [];
}

/** @type {Set<string> | undefined} */
let standardGlobals;

/**
 * @returns {Set<string>} the global names the ECMAScript library of the installed TypeScript
 *   declares, such as `Record`, `Promise` or `Date`; the DOM library is not read
 */
function standardGlobalNames() {
  if (standardGlobals) return standardGlobals;
  standardGlobals = new Set();
  const directory = path.dirname(ts.getDefaultLibFilePath({}));
  for (const file of fs.readdirSync(directory).filter(name => STANDARD_LIB_FILE.test(name))) {
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(path.join(directory, file), "utf8"),
      ts.ScriptTarget.Latest,
    );
    for (const statement of source.statements) {
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name)) standardGlobals.add(declaration.name.text);
        }
      } else if (statement.name && ts.isIdentifier(statement.name)) {
        standardGlobals.add(statement.name.text);
      }
    }
  }
  if (standardGlobals.size === 0) {
    throw new Error(`no ECMAScript declaration file next to TypeScript, in ${directory}`);
  }
  return standardGlobals;
}

/**
 * @param {ReturnType<typeof parseModule>} module
 * @returns {{ types: Set<string>, values: Set<string> }} the type and value names a module imports
 *   or declares at its top level
 */
function moduleScopeNames(module) {
  const names = { types: new Set(module.imports.keys()), values: new Set(module.imports.keys()) };
  for (const declared of module.sourceFile.statements.flatMap(statementNames)) {
    if (declared.type) names.types.add(declared.name);
    if (declared.value) names.values.add(declared.name);
  }
  return names;
}

/**
 * @param {ts.Statement} statement
 * @returns {Array<{ name: string, type: boolean, value: boolean }>} the names a statement declares,
 *   and whether each names a type, a value or both: `type Event = …` does not hide the global
 *   `Event` from `typeof Event`
 */
function statementNames(statement) {
  if (ts.isVariableStatement(statement)) {
    return statement.declarationList.declarations.flatMap(declaration =>
      bindingNames(declaration.name).map(name => ({ name, type: false, value: true })),
    );
  }
  if (!statement.name || !ts.isIdentifier(statement.name)) return [];
  return [
    {
      name: statement.name.text,
      type: !ts.isFunctionDeclaration(statement),
      value: !ts.isInterfaceDeclaration(statement) && !ts.isTypeAliasDeclaration(statement),
    },
  ];
}

/**
 * @param {ts.Node} node
 * @returns {ts.TypeParameterDeclaration[]} the type parameters an `infer` clause declares in `node`
 */
function inferredParameters(node) {
  const parameters = [];
  function visit(child) {
    if (ts.isInferTypeNode(child)) parameters.push(child.typeParameter);
    ts.forEachChild(child, visit);
  }
  visit(node);
  return parameters;
}

/**
 * @param {ts.Node} node
 * @param {boolean} values whether to read value names, for `typeof`, or type names
 * @returns {Set<string>} the names in scope at `node` below the module: the parameters of
 *   enclosing functions for values; the type parameters of enclosing declarations, mapped types
 *   and `infer` clauses for types; the declarations of enclosing namespaces for both
 */
function enclosingScopeNames(node, values) {
  const names = new Set();
  let child = node;
  for (let scope = node.parent; scope && !ts.isSourceFile(scope); scope = scope.parent) {
    if (values && ts.isFunctionLike(scope)) {
      for (const parameter of scope.parameters) {
        for (const name of bindingNames(parameter.name)) names.add(name);
      }
    }
    if (!values) {
      for (const parameter of scope.typeParameters ?? []) names.add(parameter.name.text);
      if (ts.isMappedTypeNode(scope)) names.add(scope.typeParameter.name.text);
      if (ts.isConditionalTypeNode(scope) && child === scope.trueType) {
        for (const parameter of inferredParameters(scope.extendsType)) {
          names.add(parameter.name.text);
        }
      }
    }
    if (ts.isModuleBlock(scope)) {
      for (const declared of scope.statements.flatMap(statementNames)) {
        if (values ? declared.value : declared.type) names.add(declared.name);
      }
    }
    child = scope;
  }
  return names;
}

/**
 * @param {ts.Node} node
 * @param {string} name
 * @returns {ts.TypeParameterDeclaration | undefined} the type parameter `name` refers to at
 *   `node`: one of an enclosing declaration, mapped type or `infer` clause, the innermost first
 */
function typeParameterAt(node, name) {
  let child = node;
  for (let scope = node.parent; scope && !ts.isSourceFile(scope); scope = scope.parent) {
    const parameters = [...(scope.typeParameters ?? [])];
    if (ts.isMappedTypeNode(scope)) parameters.push(scope.typeParameter);
    if (ts.isConditionalTypeNode(scope) && child === scope.trueType) {
      parameters.push(...inferredParameters(scope.extendsType));
    }
    const parameter = parameters.find(candidate => candidate.name.text === name);
    if (parameter) return parameter;
    child = scope;
  }
  return undefined;
}

/**
 * @param {ts.TypeParameterDeclaration} parameter declared by an `infer` clause
 * @returns {ts.ConditionalTypeNode | undefined} the conditional type whose condition declares
 *   `parameter`, undefined for an `infer` outside one, which does not compile
 */
function inferringConditional(parameter) {
  let child = parameter.parent;
  for (let scope = child.parent; scope && !ts.isSourceFile(scope); scope = scope.parent) {
    if (ts.isConditionalTypeNode(scope) && child === scope.extendsType) return scope;
    child = scope;
  }
  return undefined;
}

/**
 * The props of a contract and of the local types its props hold, at any depth: a list of tiles
 * whose items declare `onPress` is checked like the contract itself, also behind a local alias
 * such as `type Tiles = Tile[]`. A local generic type binds its parameters to its type arguments,
 * so an argument is checked only where the type's body places it: `Box<T> = { value: T }` checks
 * it, `Omit<T, "onPress">` and `(value: T) => void` do not. Callback parameters, `keyof` of a type
 * argument, the condition of a conditional type that tests one, types from other modules and the
 * arguments of `Pick`, `Omit` and other library types that drop props are not followed, except
 * that the contract's own heritage clauses check the type arguments of any base.
 *
 * Each node is visited once per context, and a parameter collects the arguments of every
 * reference to its type: where the body places the parameter does not depend on the arguments,
 * so the union reaches what expanding each instantiation would, in time linear in the module.
 *
 * @param {ts.TypeAliasDeclaration | ts.InterfaceDeclaration} declaration
 * @param {ReturnType<typeof parseModule>} module
 * @returns {Set<ts.PropertySignature | ts.MethodSignature>}
 */
function reachableProps(declaration, module) {
  // Where a node is visited: the contract's own expansion, whose parameters stay unbound; the
  // body of a referenced local type, whose parameters take the arguments of every reference; or
  // the default of a parameter a reference omits, which reads that reference's arguments in every
  // context the reference is visited in. One context per reference keeps a recursive default,
  // `Chain<T = { next?: Chain }>`, and a default shared down a chain of types finite and linear.
  /**
   * @typedef {ts.TypeReferenceNode | ts.ExpressionWithTypeArguments} Reference
   * @typedef {"contract" | "local" | Reference} Context
   * @typedef {{ node: ts.Node, context: Context }} Argument
   */
  const props = new Set();
  /** @type {Map<Context, Set<ts.Node>>} */
  const visited = new Map();
  // A worklist instead of recursion, so a long chain of local types, `T0 { next?: T1 }` and so
  // on, cannot overflow the stack. The work a step queues runs before older work, in the order
  // it was queued, so props come out in the order a recursive walk finds them.
  /** @typedef {["visit", ts.Node, Context] | ["prop", ts.TypeElement, Context]} Work */
  /** @type {Work[]} */
  const pending = [];
  /** @type {Work[]} */
  let queued = [];
  /** @type {Map<ts.TypeParameterDeclaration, Argument[]>} */
  const argumentsOf = new Map();
  const bound = new Set();
  const referenced = new Set();
  /** @type {Map<Reference, Context[]>} */
  const contextsOf = new Map();
  /** @type {Map<Reference, Set<number>>} */
  const readsOf = new Map();
  const ids = new Map();
  /** @param {object | string} value @returns {number} */
  function idOf(value) {
    if (!ids.has(value)) ids.set(value, ids.size);
    return ids.get(value);
  }
  /**
   * @template T
   * @param {Map<Reference, T>} map @param {Reference} reference @param {() => T} create
   * @returns {T}
   */
  function entryOf(map, reference, create) {
    if (!map.has(reference)) map.set(reference, create());
    return map.get(reference);
  }
  /**
   * @param {ts.Node} node @param {Context} context
   * @returns {boolean} false when `node` was already visited in `context`
   */
  function markVisited(node, context) {
    if (!visited.has(context)) visited.set(context, new Set());
    const nodes = visited.get(context);
    if (nodes.has(node)) return false;
    nodes.add(node);
    return true;
  }
  /**
   * @param {ts.TypeParameterDeclaration} parameter @param {Context} context
   * @returns {boolean} true when `parameter` takes an argument where `context` reads it
   */
  function isBound(parameter, context) {
    const owner = parameter.parent;
    if (ts.isInferTypeNode(owner)) {
      const conditional = inferringConditional(parameter);
      return Boolean(conditional && mentionsBoundParameter(conditional.checkType, context));
    }
    if (!ts.isTypeAliasDeclaration(owner) && !ts.isInterfaceDeclaration(owner)) return false;
    if (context === "contract") return false;
    if (context === "local") return true;
    const index = owner.typeParameters.indexOf(parameter);
    return Boolean(context.typeArguments?.[index] || parameter.default);
  }
  /** @param {ts.TypeNode} node @param {Context} context @returns {boolean} */
  function isBoundParameter(node, context) {
    if (!ts.isTypeReferenceNode(node) || !ts.isIdentifier(node.typeName)) return false;
    const parameter = typeParameterAt(node, node.typeName.text);
    return Boolean(parameter && isBound(parameter, context));
  }
  /** @param {ts.Node} node @param {Context} context @returns {boolean} */
  function mentionsBoundParameter(node, context) {
    return (
      isBoundParameter(node, context) ||
      Boolean(ts.forEachChild(node, child => mentionsBoundParameter(child, context) || undefined))
    );
  }
  /**
   * Adds an argument to `parameter`, and visits it at once if the body already placed the parameter.
   *
   * @param {ts.TypeParameterDeclaration} parameter @param {Argument} argument
   */
  function bind(parameter, argument) {
    const key = `${idOf(parameter)}:${idOf(argument.node)}:${idOf(argument.context)}`;
    if (bound.has(key)) return;
    bound.add(key);
    if (!argumentsOf.has(parameter)) argumentsOf.set(parameter, []);
    argumentsOf.get(parameter).push(argument);
    if (referenced.has(parameter)) visit(argument.node, argument.context);
  }
  /**
   * Visits the arguments `parameter` takes where `context` reads it, including those a later
   * reference adds.
   *
   * @param {ts.TypeParameterDeclaration} parameter @param {Context} context
   */
  function resolve(parameter, context) {
    // `T extends infer U ? U : never` holds what `T` holds, so `U` reads the checked type.
    if (ts.isInferTypeNode(parameter.parent)) {
      const conditional = inferringConditional(parameter);
      if (conditional) visit(conditional.checkType, context);
      return;
    }
    if (!isBound(parameter, context)) return;
    if (context === "local") {
      referenced.add(parameter);
      for (const argument of [...(argumentsOf.get(parameter) ?? [])]) {
        visit(argument.node, argument.context);
      }
      return;
    }
    const reference = /** @type {Reference} */ (context);
    const index = parameter.parent.typeParameters.indexOf(parameter);
    const argument = reference.typeArguments?.[index];
    // A default can name an earlier parameter: `Box<T, U = T>`.
    if (!argument) {
      visit(parameter.default, reference);
      return;
    }
    entryOf(readsOf, reference, () => new Set()).add(index);
    for (const outer of [...entryOf(contextsOf, reference, () => [])]) visit(argument, outer);
  }
  /**
   * Queues `prop` for `addPropNow`.
   *
   * @param {ts.TypeElement} prop @param {Context} context
   */
  function addProp(prop, context) {
    queued.push(["prop", prop, context]);
  }
  /** @param {ts.TypeElement} prop @param {Context} context */
  function addPropNow(prop, context) {
    // `{ [id: string]: Tile }` holds tiles but declares no prop of its own.
    if (ts.isIndexSignatureDeclaration(prop)) visit(prop.type, context);
    if (!ts.isPropertySignature(prop) && !ts.isMethodSignature(prop)) return;
    props.add(prop);
    if (ts.isPropertySignature(prop) && prop.type) visit(prop.type, context);
  }
  /**
   * Binds the arguments of `reference` to the parameters of `local`, then visits its body once.
   *
   * @param {ts.TypeAliasDeclaration | ts.InterfaceDeclaration} local
   * @param {Reference | undefined} reference undefined for the contract, whose
   *   parameters stay unbound; a reference binds an omitted argument to its parameter's default
   * @param {Context} context where `reference` is visited
   */
  function expand(local, reference, context) {
    if (reference) {
      entryOf(contextsOf, reference, () => []).push(context);
      for (const index of entryOf(readsOf, reference, () => new Set())) {
        visit(reference.typeArguments[index], context);
      }
      (local.typeParameters ?? []).forEach((parameter, index) => {
        const argument = reference.typeArguments?.[index];
        if (argument) bind(parameter, { node: argument, context });
        else if (parameter.default)
          bind(parameter, { node: parameter.default, context: reference });
      });
    }
    const body = reference ? "local" : "contract";
    if (!markVisited(local, body)) return;
    if (ts.isTypeAliasDeclaration(local)) {
      visit(local.type, body);
    } else {
      for (const member of local.members) addProp(member, body);
      for (const clause of local.heritageClauses ?? []) {
        for (const type of clause.types) visit(type, body);
      }
    }
  }
  /**
   * Queues `node` for `step`.
   *
   * @param {ts.Node} node @param {Context} context
   */
  function visit(node, context) {
    queued.push(["visit", node, context]);
  }
  /** @param {ts.Node} node @param {Context} context */
  function step(node, context) {
    if (!markVisited(node, context)) return;
    if (ts.isFunctionTypeNode(node) || ts.isConstructorTypeNode(node)) return;
    if (
      ts.isTypeOperatorNode(node) &&
      node.operator === ts.SyntaxKind.KeyOfKeyword &&
      mentionsBoundParameter(node.type, context)
    ) {
      return;
    }
    if (ts.isTypeLiteralNode(node)) {
      for (const member of node.members) addProp(member, context);
      return;
    }
    if (ts.isConditionalTypeNode(node)) {
      if (
        !mentionsBoundParameter(node.checkType, context) &&
        !mentionsBoundParameter(node.extendsType, context)
      ) {
        visit(node.checkType, context);
        visit(node.extendsType, context);
      }
      visit(node.trueType, context);
      visit(node.falseType, context);
      return;
    }
    const reference = ts.isTypeReferenceNode(node)
      ? node.typeName
      : ts.isExpressionWithTypeArguments(node)
        ? node.expression
        : undefined;
    if (!reference) {
      ts.forEachChild(node, child => visit(child, context));
      return;
    }
    const name = ts.isIdentifier(reference) ? reference.text : "";
    const parameter = name && typeParameterAt(node, name);
    if (parameter) {
      resolve(parameter, context);
      return;
    }
    // A namespace declaration shadows the module-level type of the same name.
    const local = name && !enclosingScopeNames(node, false).has(name) && module.types.get(name);
    // `interface CardProps extends Base<{ onPress(): void }>`, with `Base` imported.
    const contractHeritage =
      ts.isExpressionWithTypeArguments(node) && node.parent.parent === declaration;
    if (local) {
      expand(local, node, context);
    } else if (PROPS_PRESERVING_TYPES.has(name) || contractHeritage) {
      for (const argument of node.typeArguments ?? []) visit(argument, context);
    }
  }
  /** Moves the work the last step queued onto `pending`, the first queued on top. */
  function flush() {
    for (let index = queued.length - 1; index >= 0; index--) pending.push(queued[index]);
    queued = [];
  }
  expand(declaration, undefined, "contract");
  flush();
  while (pending.length > 0) {
    const [kind, node, context] = pending.pop();
    if (kind === "prop") addPropNow(node, context);
    else step(node, context);
    flush();
  }
  return props;
}

/**
 * @param {string} name
 * @returns {boolean} true for a gesture or DOM event name, such as `onPress` or `onEditPress`
 */
function isGestureName(name) {
  if (BANNED_CALLBACK_NAMES.some(pattern => pattern.test(name))) return true;
  return (name.match(CAMEL_CASE_WORD) ?? []).some(word =>
    GESTURE_WORDS.has(word[0].toUpperCase() + word.slice(1)),
  );
}

/**
 * @param {ts.TypeNode | undefined} type
 * @returns {boolean} true for `boolean`, `number`, `string` or a union of string literals
 */
function isPlatformPropType(type) {
  if (!type) return false;
  if (ts.isParenthesizedTypeNode(type)) return isPlatformPropType(type.type);
  const types = (ts.isUnionTypeNode(type) ? type.types : [type]).filter(
    member => member.kind !== ts.SyntaxKind.UndefinedKeyword,
  );
  if (types.length === 1 && PRIMITIVE_KEYWORDS.has(types[0].kind)) return true;
  return (
    types.length > 0 &&
    types.every(member => ts.isLiteralTypeNode(member) && ts.isStringLiteral(member.literal))
  );
}

/**
 * R3 for a contract module: what it imports and the types it references.
 *
 * @param {ReturnType<typeof parseModule>} module
 * @returns {Array<{ line: number, code: string, message: string }>}
 */
function checkContractModule(module) {
  const found = [];
  function report(node, code, message) {
    found.push({ line: module.lineOf(node), code, message });
  }
  const moduleNames = moduleScopeNames(module);
  function isDeclared(node, name, values = false) {
    const moduleLevel = values ? moduleNames.values : moduleNames.types;
    return moduleLevel.has(name) || enclosingScopeNames(node, values).has(name);
  }
  const reported = new Set();
  function reportOnce(node, code, message) {
    if (reported.has(message)) return;
    reported.add(message);
    report(node, code, message);
  }
  /** @param {string | undefined} name a type `react` exports */
  function checkReactType(node, name) {
    if (!name || NEUTRAL_REACT_TYPES.has(name)) return;
    reportOnce(
      node,
      "contract-react-type",
      `the contract references \`${name}\` from \`react\`, which is not one of the neutralReactTypes`,
    );
  }
  function checkGlobal(node, name, values) {
    if (isDeclared(node, name, values) || SHARED_GLOBALS.has(name)) return;
    if (standardGlobalNames().has(name)) return;
    reportOnce(
      node,
      "contract-global-type",
      `the contract references the global \`${name}\`, which the ECMAScript library does not declare`,
    );
  }
  function visit(node) {
    const specifier =
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
        ? node.moduleSpecifier.text
        : ts.isImportTypeNode(node) &&
            ts.isLiteralTypeNode(node.argument) &&
            ts.isStringLiteral(node.argument.literal)
          ? node.argument.literal.text
          : null;
    if (specifier && BANNED_IMPORT_PREFIXES.some(prefix => specifier.startsWith(prefix))) {
      report(node, "contract-platform-import", `the contract imports \`${specifier}\``);
    }
    if (ts.isImportTypeNode(node) && !node.isTypeOf && node.qualifier && specifier === "react") {
      checkReactType(node, nameSegments(node.qualifier)[0]);
    }
    const [head, ...rest] = ts.isTypeReferenceNode(node)
      ? nameSegments(node.typeName)
      : ts.isExpressionWithTypeArguments(node)
        ? nameSegments(node.expression)
        : [];
    const imported = head ? module.imports.get(head) : undefined;
    if (imported?.specifier === "react") {
      checkReactType(
        node,
        imported.imported === "*" || imported.imported === "default" ? rest[0] : imported.imported,
      );
    } else if (head === "React" && !isDeclared(node, head)) {
      checkReactType(node, rest[0]);
    } else if (head && !ts.isConstTypeReference(node)) {
      checkGlobal(node, head, false);
    }
    // `typeof document` exposes a DOM value as much as `Document` does.
    const [query] = ts.isTypeQueryNode(node) ? nameSegments(node.exprName) : [];
    if (query && query !== "React") checkGlobal(node, query, true);
    ts.forEachChild(node, visit);
  }
  ts.forEachChild(module.sourceFile, visit);
  return found;
}

/**
 * R3 for a props type: its prop names, and the shape of its platform-only props.
 *
 * @param {ReturnType<typeof parseModule>} module the contract module
 * @param {ts.TypeAliasDeclaration | ts.InterfaceDeclaration} declaration
 * @returns {Array<{ line: number, code: string, message: string }>}
 */
function checkContractProps(module, declaration) {
  const found = [];
  function report(node, code, message) {
    found.push({ line: module.lineOf(node), code, message });
  }
  for (const prop of reachableProps(declaration, module)) {
    if (!ts.isIdentifier(prop.name) && !ts.isStringLiteral(prop.name)) continue;
    const name = prop.name.text;
    if (BANNED_PROP_NAMES.has(name)) {
      report(prop, "contract-platform-prop", `the contract declares \`${name}\``);
    }
    const isCallback =
      CALLBACK_NAME.test(name) ||
      ts.isMethodSignature(prop) ||
      Boolean(prop.type && ts.isFunctionTypeNode(prop.type));
    if (isCallback && isGestureName(name)) {
      report(
        prop,
        "contract-gesture-callback",
        `the callback \`${name}\` names a gesture or DOM event instead of the user's intent`,
      );
    }
    const tag = ts.getJSDocTags(prop).find(t => t.tagName.text === "platform");
    if (!tag) continue;
    const [value = ""] = (ts.getTextOfJSDocComment(tag.comment) ?? "").trim().split(/\s+/);
    if (value !== "web" && value !== "native") {
      report(
        prop,
        "platform-prop-tag",
        `\`${name}\` is tagged \`@platform ${value}\`, not web or native`,
      );
    } else if (
      !ts.isPropertySignature(prop) ||
      !prop.questionToken ||
      !isPlatformPropType(prop.type)
    ) {
      report(
        prop,
        "platform-prop-shape",
        `the ${value}-only prop \`${name}\` must be optional and typed boolean, number, string or a union of string literals`,
      );
    }
  }
  return found;
}

/**
 * @param {ts.BindingName} name
 * @returns {string[]} every name a declaration binds, destructuring included
 */
function bindingNames(name) {
  if (ts.isIdentifier(name)) return [name.text];
  return name.elements.flatMap(element =>
    ts.isOmittedExpression(element) ? [] : bindingNames(element.name),
  );
}

/**
 * R4: what a platform module exports besides its components.
 *
 * @param {string} file absolute path
 * @param {ReturnType<typeof parseModule>} module
 * @returns {Array<{ name: string, line: number }>}
 */
function extraExportsOf(file, module) {
  function isComponent(local, exported = local) {
    const declaration = module.declarations.get(local);
    return Boolean(
      declaration?.isFunction &&
      file.endsWith(".tsx") &&
      (local === "*default*" || PASCAL_CASE.test(exported === "default" ? local : exported)),
    );
  }
  const extra = [];
  for (const statement of module.sourceFile.statements) {
    const line = module.lineOf(statement);
    if (ts.isExportDeclaration(statement)) {
      const clause = statement.exportClause;
      if (!clause) {
        extra.push({ name: "*", line });
      } else if (ts.isNamespaceExport(clause)) {
        extra.push({ name: clause.name.text, line });
      } else {
        for (const element of clause.elements) {
          const local = (element.propertyName ?? element.name).text;
          const reexport = statement.isTypeOnly || element.isTypeOnly || statement.moduleSpecifier;
          if (reexport || !isComponent(local, element.name.text)) {
            extra.push({ name: element.name.text, line });
          }
        }
      }
    } else if (ts.isExportAssignment(statement)) {
      const expression = unwrap(statement.expression);
      const local = ts.isIdentifier(expression) ? expression.text : "*default*";
      if (statement.isExportEquals || !isComponent(local)) extra.push({ name: "default", line });
    } else if (hasExportModifier(statement)) {
      const names = ts.isVariableStatement(statement)
        ? statement.declarationList.declarations.flatMap(d => bindingNames(d.name))
        : [statement.name?.text ?? "*default*"];
      for (const name of names) {
        const isValue =
          !ts.isTypeAliasDeclaration(statement) && !ts.isInterfaceDeclaration(statement);
        if (!isValue || !isComponent(name)) {
          extra.push({ name: hasDefaultModifier(statement) ? "default" : name, line });
        }
      }
    }
  }
  return extra;
}

/**
 * R2 to R4 for the universal components of one package.
 *
 * @param {ReturnType<typeof collectEntryComponents>["universal"]} universal
 * @param {Record<Platform, (file: string) => ReturnType<typeof parseModule> | null>} load
 * @param {(file: string) => string} relative
 * @returns {ComponentViolation[]}
 */
function checkContracts(universal, load, relative) {
  // Paired per entry, so two entries that export their own `Card` are both checked, and the same
  // pair reached from two entries is checked once.
  /** @type {Map<string, { name: string, sides: Partial<Record<Platform, ExportInfo>> }>} */
  const components = new Map();
  for (const entry of universal) {
    const names = new Set([...entry.components.web.keys(), ...entry.components.native.keys()]);
    for (const name of names) {
      const sides = {
        web: entry.components.web.get(name),
        native: entry.components.native.get(name),
      };
      const key = [name, sides.web?.file, sides.web?.line, sides.native?.file, sides.native?.line];
      components.set(key.join("|"), { name, sides });
    }
  }

  /** @type {Map<string, ComponentViolation>} */
  const violations = new Map();
  function report(rule, subject, file, line, code, message) {
    const violation = { rule, subject, file: relative(file), line, code, message, text: "" };
    violations.set(JSON.stringify(violation), violation);
  }
  /** @type {Map<string, Array<{ line: number, code: string, message: string }>>} */
  const checked = new Map();
  function cached(key, check) {
    if (!checked.has(key)) checked.set(key, check());
    return checked.get(key);
  }

  for (const { name, sides } of components.values()) {
    /** @type {Partial<Record<Platform, { info: ExportInfo, props: NonNullable<ReturnType<typeof propsOf>>, contract?: ReturnType<typeof contractOf> }>>} */
    const implementations = {};
    for (const platform of /** @type {Platform[]} */ (["web", "native"])) {
      const info = sides[platform];
      const module = info && load[platform](info.file);
      const props = info && module ? propsOf(info, module) : null;
      if (!info || !props) continue;
      const contract =
        props.kind === "named"
          ? contractOf(info.file, props.name, platform, load[platform])
          : undefined;
      implementations[platform] = { info, props, contract };
    }

    const r2 = checkOneContract(name, implementations, relative);
    if (r2) report("R2", name, r2.file, r2.line, r2.code, r2.message);

    // A props type in a platform module is not a contract: R2 reports it, and R3 waits for it to
    // move to an unsuffixed module.
    const keys = new Map();
    for (const [platform, implementation] of Object.entries(implementations)) {
      const contract = implementation.contract;
      if (!contract || !("declaration" in contract) || isPlatformModule(contract.file)) continue;
      const module = load[platform](contract.file);
      const declaration = contract.declaration;
      keys.set(contract.file, { file: contract.file, check: () => checkContractModule(module) });
      keys.set(`${contract.file}#${declaration.name.text}`, {
        file: contract.file,
        check: () => checkContractProps(module, declaration),
      });
    }
    for (const [key, { file, check }] of keys) {
      for (const found of cached(key, check)) {
        report("R3", name, file, found.line, found.code, `\`${name}\`: ${found.message}`);
      }
    }
  }

  /** @type {Map<string, { platform: Platform, names: Set<string> }>} */
  const platformModules = new Map();
  for (const { name, sides } of components.values()) {
    for (const [platform, info] of Object.entries(sides)) {
      if (!info || !isPlatformModule(info.file)) continue;
      const module = platformModules.get(info.file) ?? { platform, names: new Set() };
      module.names.add(name);
      platformModules.set(info.file, module);
    }
  }
  for (const [file, { platform, names }] of platformModules) {
    for (const extra of extraExportsOf(file, load[platform](file))) {
      for (const name of names) {
        report(
          "R4",
          name,
          file,
          extra.line,
          "platform-module-export",
          `the platform module exports \`${extra.name}\` next to its component \`${name}\`: move it to the contract or to an unsuffixed module`,
        );
      }
    }
  }
  return [...violations.values()];
}

/**
 * R2 for one universal component: the first way its two implementations miss one contract.
 *
 * @returns {{ file: string, line: number, code: string, message: string } | null}
 */
function checkOneContract(name, { web, native }, relative) {
  if (!web || !native) return null;
  // One unsuffixed implementation serves both platforms: its props are one type by construction,
  // but a named type it imports can still resolve per platform, so its contract is checked.
  const shared = web.info.file === native.info.file && web.info.line === native.info.line;
  if (shared && web.props.kind !== "named") return null;
  for (const [platform, implementation] of Object.entries({ web, native })) {
    if (implementation.props.kind === "unreadable") {
      return {
        file: implementation.info.file,
        line: implementation.info.line,
        code: "props-unreadable",
        message: `the ${platform} implementation of \`${name}\` wraps a function declared in another module, so its props cannot be read: declare the function next to the component, or name the props in \`forwardRef<Ref, Props>\``,
      };
    }
    if (implementation.props.kind !== "unnamed") continue;
    return {
      file: implementation.info.file,
      line: implementation.info.line,
      code: "props-unnamed",
      message: `the first parameter of \`${name}\` on ${platform} is not annotated with a props type name`,
    };
  }
  if (web.props.kind !== native.props.kind) {
    const withProps = web.props.kind === "named" ? web : native;
    return {
      file: withProps.info.file,
      line: withProps.info.line,
      code: "props-parameter-mismatch",
      message: `\`${name}\` takes props on ${withProps === web ? "web" : "native"} only`,
    };
  }
  if (web.props.kind === "none") return null;
  if (web.props.name !== native.props.name) {
    return {
      file: web.info.file,
      line: web.info.line,
      code: "props-name-mismatch",
      message: `\`${name}\` takes \`${web.props.name}\` on web and \`${native.props.name}\` on native`,
    };
  }
  const type = web.props.name;
  for (const [platform, implementation] of Object.entries({ web, native })) {
    const contract = implementation.contract;
    if ("declaration" in contract) continue;
    const messages = {
      "contract-not-found": `\`${type}\` is neither declared in nor imported by the ${platform} implementation of \`${name}\``,
      "contract-outside-package": `\`${type}\` comes from \`${contract.imported}\`, outside the package`,
      "contract-reexported": `the ${platform} implementation of \`${name}\` imports \`${type}\` from a module that does not declare it${contract.imported ? `: ${relative(contract.imported)}` : ""}`,
    };
    return {
      file: implementation.info.file,
      line: implementation.info.line,
      code: contract.code,
      message: messages[contract.code],
    };
  }
  if (
    web.contract.file !== native.contract.file ||
    web.contract.declaration.name.text !== native.contract.declaration.name.text
  ) {
    return {
      file: web.info.file,
      line: web.info.line,
      code: "contract-mismatch",
      message: `the props of \`${name}\` come from ${relative(web.contract.file)} on web and ${relative(native.contract.file)} on native`,
    };
  }
  const contractFile = web.contract.file;
  const declaration = web.contract.declaration;
  const sourceFile = declaration.getSourceFile();
  const contractLine =
    sourceFile.getLineAndCharacterOfPosition(declaration.getStart(sourceFile)).line + 1;
  if (isPlatformModule(contractFile)) {
    return {
      file: contractFile,
      line: contractLine,
      code: "contract-suffixed",
      message: `\`${type}\`, the props of \`${name}\`, is declared in a platform module`,
    };
  }
  const [sibling] = suffixedSiblings(contractFile);
  if (sibling) {
    return {
      file: contractFile,
      line: contractLine,
      code: "contract-shadowed",
      message: `${relative(sibling)} shadows the contract of \`${name}\` on one platform`,
    };
  }
  return null;
}

/**
 * R1 to R4, and the export side of R5, for one package.
 *
 * @param {string} workspaceRoot
 * @param {string} projectRoot posix-style
 * @returns {ComponentViolation[]}
 */
function checkComponents(workspaceRoot, projectRoot) {
  const packageDir = path.join(workspaceRoot, projectRoot);
  let raw;
  let manifest;
  try {
    raw = fs.readFileSync(path.join(packageDir, "package.json"), "utf8");
    manifest = JSON.parse(raw);
  } catch {
    return [];
  }
  const manifestLines = raw.split("\n");
  const { universal, platform, load } = collectEntryComponents(packageDir, manifest.exports);

  function lineOfSubpath(subpath) {
    return manifestLines.findIndex(text => text.includes(`"${subpath}"`)) + 1 || 1;
  }
  function relative(file) {
    return path.relative(workspaceRoot, file).split(path.sep).join("/");
  }
  const manifestFile = `${projectRoot}/package.json`;
  /** @type {ComponentViolation[]} */
  const violations = [];

  for (const entry of universal) {
    for (const [present, missing] of [
      ["web", "native"],
      ["native", "web"],
    ]) {
      for (const [name, info] of entry.components[present]) {
        if (entry.components[missing].has(name)) continue;
        violations.push({
          rule: "R1",
          subject: name,
          file: relative(info.file),
          line: info.line,
          code: "universal-parity",
          message: `\`${name}\` is exported from the universal entry \`${entry.subpath}\` on ${present} but not on ${missing}`,
          text: "",
        });
      }
    }
  }

  violations.push(...checkContracts(universal, load, relative));

  const universalFiles = new Set(
    universal.flatMap(entry => [entry.files.web, entry.files.native]).filter(Boolean),
  );
  // Matched by name and by declaration, so an aliased re-export is still the same component.
  const universalNames = new Map();
  const universalDeclarations = new Map();
  for (const entry of universal) {
    for (const [name, info] of [...entry.components.web, ...entry.components.native]) {
      const found = { name, subpath: entry.subpath };
      if (!universalNames.has(name)) universalNames.set(name, found);
      const key = `${info.file}:${info.line}`;
      if (!universalDeclarations.has(key)) universalDeclarations.set(key, found);
    }
  }

  for (const entry of platform) {
    if (universalFiles.has(entry.file)) {
      violations.push({
        rule: "R5",
        subject: entry.subpath,
        file: manifestFile,
        line: lineOfSubpath(entry.subpath),
        code: "platform-entry-shared-module",
        message: `the platform entry \`${entry.subpath}\` points at \`${relative(entry.file)}\`, a module of a universal entry`,
        text: "",
      });
    } else if (!PLATFORM_SUFFIX[entry.platform].test(entry.file)) {
      violations.push({
        rule: "R5",
        subject: entry.subpath,
        file: manifestFile,
        line: lineOfSubpath(entry.subpath),
        code: "platform-entry-unsuffixed",
        message: `the platform entry \`${entry.subpath}\` points at \`${relative(entry.file)}\`, which lacks the \`.${entry.platform}\` suffix`,
        text: "",
      });
    }
    for (const [name, info] of entry.components) {
      const shared =
        universalNames.get(name) ?? universalDeclarations.get(`${info.file}:${info.line}`);
      if (!shared) continue;
      const universalName = shared.name === name ? "" : `, as \`${shared.name}\`,`;
      violations.push({
        rule: "R5",
        subject: name,
        file: relative(info.file),
        line: info.line,
        code: "component-in-both-entries",
        message: `\`${name}\` is exported from the universal entry \`${shared.subpath}\`${universalName} and from the platform entry \`${entry.subpath}\``,
        text: "",
      });
    }
  }

  return violations;
}

module.exports = {
  checkComponents,
  classifyEntries,
  collectEntryComponents,
  isIgnoredEntry,
  parseModule,
  resolveRelative,
};

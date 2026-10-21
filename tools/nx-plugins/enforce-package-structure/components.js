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
// `componentWrappers` the calls that still return a component.
//
// R1: a universal component is exported on both platforms under the same name.
// R5: a component is exported from universal entries or from platform entries, never both, and a
// platform entry points at a module of its own that carries its platform's suffix.

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

/** @typedef {"web" | "native"} Platform */
/** @typedef {{ file: string, line: number, isComponent: boolean }} ExportInfo */
/** @typedef {{ rule: "R1" | "R5", subject: string, file: string, line: number, code: string, message: string, text: string }} ComponentViolation */

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
 * `declarations` holds the top-level declarations, `bindings` maps a local name to the import it
 * comes from, `localExports` maps an exported name to a local name, `named` maps an exported name
 * to a re-export, `stars` lists the `export * from` specifiers.
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

  /** @type {Map<string, { line: number, isFunction: boolean }>} */
  const declarations = new Map();
  /** @type {Map<string, { specifier: string, imported: string }>} */
  const bindings = new Map();
  /** @type {Map<string, string>} exported name to local name */
  const localExports = new Map();
  /** @type {Map<string, { specifier: string, imported: string }>} */
  const named = new Map();
  /** @type {string[]} */
  const stars = [];

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      const name = statement.name.text;
      declarations.set(name, { line: lineOf(statement), isFunction: true });
      if (hasExportModifier(statement)) {
        localExports.set(hasDefaultModifier(statement) ? "default" : name, name);
      }
    } else if (ts.isFunctionDeclaration(statement) && hasDefaultModifier(statement)) {
      declarations.set("*default*", { line: lineOf(statement), isFunction: true });
      localExports.set("default", "*default*");
    } else if (ts.isClassDeclaration(statement) && statement.name) {
      const name = statement.name.text;
      declarations.set(name, { line: lineOf(statement), isFunction: false });
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
        });
        localExports.set("default", "*default*");
      }
    } else if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const clause = statement.importClause;
      if (!clause || clause.isTypeOnly) continue;
      const specifier = statement.moduleSpecifier.text;
      if (clause.name) bindings.set(clause.name.text, { specifier, imported: "default" });
      if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        for (const element of clause.namedBindings.elements) {
          if (element.isTypeOnly) continue;
          const imported = (element.propertyName ?? element.name).text;
          bindings.set(element.name.text, { specifier, imported });
        }
      }
    } else if (ts.isExportDeclaration(statement) && !statement.isTypeOnly) {
      const specifier =
        statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
          ? statement.moduleSpecifier.text
          : null;
      const clause = statement.exportClause;
      if (!clause) {
        if (specifier) stars.push(specifier);
        continue;
      }
      if (!ts.isNamedExports(clause)) continue;
      for (const element of clause.elements) {
        if (element.isTypeOnly) continue;
        const exported = element.name.text;
        const local = (element.propertyName ?? element.name).text;
        if (specifier) named.set(exported, { specifier, imported: local });
        else localExports.set(exported, local);
      }
    }
  }

  return { declarations, bindings, localExports, named, stars };
}

/**
 * Follows the re-exports of a platform's module graph, parsing each module once.
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
   * Named exports of an entry module, each mapped to its declaration.
   *
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

  return exportsOf;
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
    const web = collectors.web(absolute(target));
    const native = collectors.native(absolute(target));
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
        web: entry.web ? componentsOf(collectors.web(absolute(entry.web))) : new Map(),
        native: entry.native ? componentsOf(collectors.native(absolute(entry.native))) : new Map(),
      },
    })),
    platform: platform.map(entry => ({
      subpath: entry.subpath,
      platform: entry.platform,
      file: absolute(entry.target),
      components: componentsOf(collectors[entry.platform](absolute(entry.target))),
    })),
  };
}

/**
 * R1 and the export side of R5 for one package.
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
  const { universal, platform } = collectEntryComponents(packageDir, manifest.exports);

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

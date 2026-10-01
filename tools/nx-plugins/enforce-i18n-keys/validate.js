const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const ROOT = path.resolve(__dirname, "../../..");
const SCANNED_LAYERS = ["features", "domain", "shared"];
const IGNORED_DIRS = new Set([
  "node_modules",
  "lib",
  "lib-es",
  "dist",
  "build",
  "__tests__",
  "testing",
]);
const SOURCE_FILE = /\.(ts|tsx)$/;
const TEST_FILE = /\.(test|spec)\.(ts|tsx)$|\.d\.ts$/;
const PLURAL_SUFFIXES = ["zero", "one", "two", "few", "many", "other"];

const APPS = {
  Desktop: {
    dir: "apps/ledger-live-desktop",
    catalog: "apps/ledger-live-desktop/static/i18n/en/app.json",
  },
  Mobile: {
    dir: "apps/ledger-live-mobile",
    catalog: "apps/ledger-live-mobile/src/locales/en/common.json",
  },
};
const BASELINE_FILE = path.join(__dirname, "unverifiable-baseline.json");
const WEB_ONLY = /\.web\.(ts|tsx)$/;
const NATIVE_ONLY = /\.native\.(ts|tsx)$/;
const MAX_COMBINATIONS = 500;
const TRANSLATE_NAMES = new Set(["t", "translate"]);
const I18N_OWNERS = new Set(["i18n", "i18next"]);

function flatten(node, prefix, out) {
  for (const [k, v] of Object.entries(node)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object") flatten(v, key, out);
    else out.add(key);
  }
  return out;
}

function loadCatalog(relPath) {
  return flatten(JSON.parse(fs.readFileSync(path.join(ROOT, relPath), "utf8")), "", new Set());
}

function hasKey(catalog, key) {
  return catalog.has(key) || PLURAL_SUFFIXES.some(s => catalog.has(`${key}_${s}`));
}

function readPackage(dir) {
  const file = path.join(dir, "package.json");
  if (!fs.existsSync(file)) return null;
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  const deps = Object.keys({
    ...json.dependencies,
    ...json.devDependencies,
    ...json.peerDependencies,
  });
  return { name: json.name, dir, deps };
}

function* packageDirs(dir) {
  if (fs.existsSync(path.join(dir, "package.json"))) yield dir;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && !IGNORED_DIRS.has(entry.name) && !entry.name.startsWith(".")) {
      yield* packageDirs(path.join(dir, entry.name));
    }
  }
}

// package dir (relative to ROOT) -> apps that reach it through workspace dependencies
function resolveConsumers() {
  const packages = new Map();
  for (const layer of SCANNED_LAYERS) {
    for (const dir of packageDirs(path.join(ROOT, layer))) {
      const pkg = readPackage(dir);
      if (pkg) packages.set(pkg.name, pkg);
    }
  }
  const consumers = new Map([...packages.values()].map(pkg => [pkg.dir, new Set()]));
  for (const [app, { dir }] of Object.entries(APPS)) {
    const seen = new Set();
    const stack = [...readPackage(path.join(ROOT, dir)).deps];
    while (stack.length > 0) {
      const name = stack.pop();
      const pkg = packages.get(name);
      if (!pkg || seen.has(name)) continue;
      seen.add(name);
      consumers.get(pkg.dir).add(app);
      stack.push(...pkg.deps);
    }
  }
  return consumers;
}

function owningPackageDir(file, consumers) {
  for (let dir = path.dirname(file); ; dir = path.dirname(dir)) {
    if (consumers.has(dir)) return dir;
    if (dir === path.dirname(dir)) return null;
  }
}

function appsForFile(file, consumers) {
  const dir = owningPackageDir(file, consumers);
  const apps = dir ? [...consumers.get(dir)] : Object.keys(APPS);
  if (WEB_ONLY.test(file)) return apps.filter(app => app === "Desktop");
  if (NATIVE_ONLY.test(file)) return apps.filter(app => app === "Mobile");
  return apps;
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) yield* walk(path.join(dir, entry.name));
    } else if (SOURCE_FILE.test(entry.name) && !TEST_FILE.test(entry.name)) {
      yield path.join(dir, entry.name);
    }
  }
}

function isStringLiteralNode(node) {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
}

function unwrap(node) {
  let n = node;
  while (
    ts.isParenthesizedExpression(n) ||
    ts.isAsExpression(n) ||
    ts.isSatisfiesExpression(n) ||
    ts.isNonNullExpression(n) ||
    ts.isTypeAssertionExpression(n)
  ) {
    n = n.expression;
  }
  return n;
}

function cartesian(parts) {
  let out = [""];
  for (const part of parts) {
    if (out.length * part.length > MAX_COMBINATIONS) return null;
    out = out.flatMap(prefix => part.map(p => prefix + p));
  }
  return out;
}

// Union of string literal types -> values, null when any member is open (string, any, ...)
function typeValues(type) {
  if (type.isStringLiteral()) return [type.value];
  if (!type.isUnion()) return null;
  const values = [];
  for (const member of type.types) {
    if (!member.isStringLiteral()) return null;
    values.push(member.value);
  }
  return values;
}

// All possible string values of an expression, or null when unverifiable.
function resolveValues(node, checker) {
  const expr = unwrap(node);
  if (isStringLiteralNode(expr)) return [expr.text];
  if (ts.isConditionalExpression(expr)) {
    const whenTrue = resolveValues(expr.whenTrue, checker);
    const whenFalse = resolveValues(expr.whenFalse, checker);
    return whenTrue && whenFalse ? [...new Set([...whenTrue, ...whenFalse])] : null;
  }
  if (ts.isTemplateExpression(expr)) {
    const parts = [[expr.head.text]];
    for (const span of expr.templateSpans) {
      const values = resolveValues(span.expression, checker);
      if (!values) return null;
      parts.push(values, [span.literal.text]);
    }
    return cartesian(parts);
  }
  const values = typeValues(checker.getTypeAtLocation(expr));
  return values && values.length <= MAX_COMBINATIONS ? values : null;
}

function enclosingInitializer(decl) {
  for (let n = decl; n; n = n.parent) {
    if (ts.isVariableDeclaration(n)) return n.initializer ? unwrap(n.initializer) : null;
  }
  return null;
}

function keyPrefixOf(init, checker) {
  if (!init || !ts.isCallExpression(init) || init.arguments.length < 2) return "";
  const opts = init.arguments[1];
  if (!ts.isObjectLiteralExpression(opts)) return "";
  for (const prop of opts.properties) {
    if (ts.isPropertyAssignment(prop) && prop.name.getText() === "keyPrefix") {
      const values = resolveValues(prop.initializer, checker);
      return values && values.length === 1 ? values[0] : "";
    }
  }
  return "";
}

// Returns { prefix } when the callee is a translation function, otherwise null.
function translatorOf(callee, checker) {
  if (ts.isPropertyAccessExpression(callee)) {
    const owner = callee.expression;
    let ownerName = "";
    if (ts.isIdentifier(owner)) ownerName = owner.text;
    else if (ts.isPropertyAccessExpression(owner)) ownerName = owner.name.text;
    return callee.name.text === "t" && I18N_OWNERS.has(ownerName) ? { prefix: "" } : null;
  }
  if (!ts.isIdentifier(callee)) return null;
  const decl = checker.getSymbolAtLocation(callee)?.valueDeclaration;
  if (decl && ts.isBindingElement(decl)) {
    if ((decl.propertyName ?? decl.name).getText() !== "t") return null;
    return { prefix: keyPrefixOf(enclosingInitializer(decl), checker) };
  }
  if (decl && ts.isVariableDeclaration(decl) && decl.initializer) {
    const init = unwrap(decl.initializer);
    if (ts.isPropertyAccessExpression(init) && init.name.text === "t") return { prefix: "" };
  }
  if (decl && ts.isParameter(decl)) return callee.text === "t" ? { prefix: "" } : null;
  return TRANSLATE_NAMES.has(callee.text) ? { prefix: "" } : null;
}

function contextOf(call, checker) {
  const opts = call.arguments[1];
  if (!opts || !ts.isObjectLiteralExpression(opts)) return [];
  for (const prop of opts.properties) {
    if (ts.isPropertyAssignment(prop) && prop.name.getText() === "context") {
      return resolveValues(prop.initializer, checker) ?? [];
    }
  }
  return [];
}

function stripNamespace(key) {
  return key.replace(/^[A-Za-z0-9_-]+:/, "");
}

// Workspace package name -> source entry, so cross-package literal types resolve without built libs.
function workspaceEntries() {
  const entries = new Map();
  for (const layer of SCANNED_LAYERS) {
    for (const dir of packageDirs(path.join(ROOT, layer))) {
      const json = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
      const entry = path.join(dir, json.types ?? json.main ?? "");
      if (json.name && SOURCE_FILE.test(entry) && fs.existsSync(entry))
        entries.set(json.name, entry);
    }
  }
  return entries;
}

// Only relative imports and workspace packages are followed: deterministic, no built libs needed.
function createProgram(files) {
  const options = {
    noEmit: true,
    jsx: ts.JsxEmit.Preserve,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    skipLibCheck: true,
    resolveJsonModule: true,
    types: [],
  };
  const host = ts.createCompilerHost(options);
  const entries = workspaceEntries();
  const resolveOne = (name, containingFile) => {
    if (name.startsWith("."))
      return ts.resolveModuleName(name, containingFile, options, host).resolvedModule;
    const entry = entries.get(name);
    if (!entry) return undefined;
    return {
      resolvedFileName: entry,
      extension: entry.endsWith(".tsx") ? ts.Extension.Tsx : ts.Extension.Ts,
    };
  };
  host.resolveModuleNameLiterals = (literals, containingFile) =>
    literals.map(literal => ({ resolvedModule: resolveOne(literal.text, containingFile) }));
  return ts.createProgram(files, options, host);
}

// Sites: { line, kind: "static" | "enumerated" | "unverifiable", keys: [{ key, contexts }] }
function extractKeys(file, program = createProgram([file])) {
  const sf = program.getSourceFile(file);
  if (!sf) return [];
  const checker = program.getTypeChecker();
  const sites = [];
  const record = (node, expr, prefix, call) => {
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
    const values = resolveValues(expr, checker);
    if (!values) {
      sites.push({ line: line + 1, kind: "unverifiable", keys: [] });
      return;
    }
    const contexts = call ? contextOf(call, checker) : [];
    const keys = values.map(v => ({
      key: (prefix ? `${prefix}.` : "") + stripNamespace(v),
      contexts,
    }));
    const kind = isStringLiteralNode(unwrap(expr)) || keys.length === 1 ? "static" : "enumerated";
    sites.push({ line: line + 1, kind, keys });
  };
  const visit = node => {
    if (ts.isCallExpression(node) && node.arguments.length > 0) {
      const translator = translatorOf(node.expression, checker);
      if (translator) record(node, node.arguments[0], translator.prefix, node);
    } else if (ts.isJsxAttribute(node) && node.name.getText() === "i18nKey" && node.initializer) {
      const init = ts.isJsxExpression(node.initializer)
        ? node.initializer.expression
        : node.initializer;
      if (init) record(node, init, "", null);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return sites;
}

function keyExists(catalog, { key, contexts }) {
  if (hasKey(catalog, key)) return true;
  return contexts.length > 0 && contexts.every(c => hasKey(catalog, `${key}_${c}`));
}

function analyzeFiles(files, catalogs, consumers) {
  const program = createProgram(files);
  const missing = [];
  const unverifiable = [];
  const stats = { static: 0, enumerated: 0, unverifiable: 0 };
  for (const file of files) {
    const apps = appsForFile(file, consumers);
    const rel = path.relative(ROOT, file);
    for (const { line, kind, keys } of extractKeys(file, program)) {
      stats[kind]++;
      if (kind === "unverifiable") unverifiable.push({ file: rel, line });
      for (const k of keys) {
        const absentFrom = apps.filter(app => !keyExists(catalogs[app], k));
        if (absentFrom.length > 0) missing.push({ file: rel, line, key: k.key, absentFrom });
      }
    }
  }
  return { missing, unverifiable, stats };
}

function findMissingKeys(files, catalogs, consumers) {
  return analyzeFiles(files, catalogs, consumers).missing;
}

function readBaseline() {
  const empty = { unverifiable: null, allowMissing: [] };
  if (!fs.existsSync(BASELINE_FILE)) return empty;
  return { ...empty, ...JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8")) };
}

function main() {
  const started = Date.now();
  const catalogs = Object.fromEntries(
    Object.entries(APPS).map(([app, { catalog }]) => [app, loadCatalog(catalog)]),
  );
  const files = SCANNED_LAYERS.flatMap(layer => [...walk(path.join(ROOT, layer))]);
  const baseline = readBaseline();
  const analysis = analyzeFiles(files, catalogs, resolveConsumers());
  const { unverifiable, stats } = analysis;
  const missing = analysis.missing
    .map(m => ({
      ...m,
      absentFrom: m.absentFrom.filter(app => !baseline.allowMissing.includes(`${app} ${m.key}`)),
    }))
    .filter(m => m.absentFrom.length > 0);
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(
    `i18n keys: ${stats.static} static, ${stats.enumerated} type-enumerated, ${stats.unverifiable} unverifiable call sites (${seconds}s)`,
  );

  for (const u of unverifiable) console.log(`  unverifiable ${u.file}:${u.line}`);

  if (process.argv.includes("--update-baseline")) {
    fs.writeFileSync(
      BASELINE_FILE,
      `${JSON.stringify({ ...baseline, unverifiable: unverifiable.length }, null, 2)}\n`,
    );
    console.log(`Baseline updated to ${unverifiable.length}.`);
    return;
  }

  if (missing.length > 0) {
    console.error(`Missing i18n keys (${missing.length}):`);
    for (const m of missing)
      console.error(`  ${m.file}:${m.line}  "${m.key}"  missing in ${m.absentFrom.join(" + ")}`);
    console.error(
      `\nAdd them to: ${Object.values(APPS)
        .map(a => a.catalog)
        .join(" and ")}`,
    );
    process.exitCode = 1;
  }

  const limit = baseline.unverifiable;
  if (limit !== null && unverifiable.length > limit) {
    console.error(
      `\nUnverifiable i18n key sites increased: ${unverifiable.length} > baseline ${limit}. Use literal or literal-union keys (listed above).`,
    );
    process.exitCode = 1;
  } else if (limit !== null && unverifiable.length < limit) {
    console.log(
      `Unverifiable sites dropped to ${unverifiable.length}: run with --update-baseline.`,
    );
  }
}

if (require.main === module) main();

module.exports = {
  analyzeFiles,
  appsForFile,
  createProgram,
  extractKeys,
  findMissingKeys,
  flatten,
  hasKey,
};

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
const WEB_ONLY = /\.web\.(ts|tsx)$/;
const NATIVE_ONLY = /\.native\.(ts|tsx)$/;

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
  for (let dir = path.dirname(file); dir.startsWith(ROOT); dir = path.dirname(dir)) {
    if (consumers.has(dir)) return dir;
  }
  return null;
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

function collectStringConsts(sf) {
  const consts = new Map();
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt) || !(stmt.declarationList.flags & ts.NodeFlags.Const))
      continue;
    for (const decl of stmt.declarationList.declarations) {
      if (
        ts.isIdentifier(decl.name) &&
        decl.initializer &&
        (ts.isStringLiteral(decl.initializer) ||
          ts.isNoSubstitutionTemplateLiteral(decl.initializer))
      ) {
        consts.set(decl.name.text, decl.initializer.text);
      }
    }
  }
  return consts;
}

// Returns the key when fully static, null when it depends on runtime values.
function resolveKey(node, consts) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isIdentifier(node)) return consts.get(node.text) ?? null;
  if (ts.isTemplateExpression(node)) {
    let key = node.head.text;
    for (const span of node.templateSpans) {
      const part = ts.isIdentifier(span.expression) ? consts.get(span.expression.text) : undefined;
      if (part === undefined) return null;
      key += part + span.literal.text;
    }
    return key;
  }
  return null;
}

function extractKeys(file) {
  const sf = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const consts = collectStringConsts(sf);
  const found = [];
  const record = (node, expr) => {
    const key = resolveKey(expr, consts);
    if (key === null) return;
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
    found.push({ key, line: line + 1 });
  };
  const visit = node => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "t" &&
      node.arguments.length > 0
    ) {
      record(node, node.arguments[0]);
    } else if (ts.isJsxAttribute(node) && node.name.getText() === "i18nKey" && node.initializer) {
      const init = ts.isJsxExpression(node.initializer)
        ? node.initializer.expression
        : node.initializer;
      if (init) record(node, init);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

function findMissingKeys(files, catalogs, consumers) {
  const missing = [];
  for (const file of files) {
    const apps = appsForFile(file, consumers);
    for (const { key, line } of extractKeys(file)) {
      const absentFrom = apps.filter(app => !hasKey(catalogs[app], key));
      if (absentFrom.length > 0)
        missing.push({ file: path.relative(ROOT, file), line, key, absentFrom });
    }
  }
  return missing;
}

function main() {
  const catalogs = Object.fromEntries(
    Object.entries(APPS).map(([app, { catalog }]) => [app, loadCatalog(catalog)]),
  );
  const files = SCANNED_LAYERS.flatMap(layer => [...walk(path.join(ROOT, layer))]);
  const missing = findMissingKeys(files, catalogs, resolveConsumers());
  if (missing.length === 0) {
    console.log(
      `i18n keys: all literal keys used in ${SCANNED_LAYERS.join("/")} exist in the catalogs of the apps that consume them.`,
    );
    return;
  }
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

if (require.main === module) main();

module.exports = { extractKeys, findMissingKeys, flatten, hasKey };

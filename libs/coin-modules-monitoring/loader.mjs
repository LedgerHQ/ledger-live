// Runs the monitoring CLI and its @ledgerhq/* deps under Node's native ESM
// resolver. Those packages ship bundler-targeted lib-es that breaks Node's
// strict-ESM rules. We keep @ledgerhq/* as ESM (so a singleton like LiveConfig
// stays a single instance) and patch the gaps:
//  - resolve hook: extensionless / directory / bare-subpath imports.
//  - load hook: missing `type: "json"` attributes, stray `require()` calls, and
//    esModuleInterop. lib-es is emitted assuming a bundler unwraps CommonJS
//    default/named exports, which native ESM does not, so we rewrite imports of
//    third-party CJS deps to require() + the interop helpers tsc would inject.

import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// --- resolve hook -----------------------------------------------------------

// Try the target as-is, then a sibling `<base>.js`, then `<base>/index.js`.
// Node reports a missing dir/extensionless import as `<base>/index.js`, so we
// strip that suffix to also cover a sibling file (e.g. `serialization.js`
// alongside a `serialization/` dir).
function tryResolve(targetUrl) {
  let path;
  try {
    path = fileURLToPath(targetUrl);
  } catch {
    return null;
  }
  const base = path.endsWith("/index.js") ? path.slice(0, -"/index.js".length) : path;
  for (const candidate of [path, `${base}.js`, `${base}/index.js`]) {
    try {
      if (existsSync(candidate) && statSync(candidate).isFile()) {
        return pathToFileURL(candidate).href;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    // Recover extensionless/dir/bare-subpath imports. err.url holds the
    // resolved-but-missing target; reconstruct it for relative specifiers.
    if (err?.code === "ERR_MODULE_NOT_FOUND" || err?.code === "ERR_UNSUPPORTED_DIR_IMPORT") {
      const targetUrl =
        err.url ??
        (specifier.startsWith(".") && context.parentURL
          ? new URL(specifier, context.parentURL).href
          : null);
      if (targetUrl) {
        const fixed = tryResolve(targetUrl);
        if (fixed) return nextResolve(fixed, context);
      }
    }
    throw err;
  }
}

// --- load hook --------------------------------------------------------------

const pkgTypeCache = new Map();
function nearestPackageType(filePath) {
  let dir = dirname(filePath);
  for (;;) {
    if (pkgTypeCache.has(dir)) return pkgTypeCache.get(dir);
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      let type;
      try {
        type = JSON.parse(readFileSync(pkgPath, "utf8")).type;
      } catch {
        type = undefined;
      }
      pkgTypeCache.set(dir, type);
      return type;
    }
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

const cjsCache = new Map();
// A specifier needs interop rewriting when it resolves to a third-party CJS
// module. We never touch relative imports (our own lib-es, handled at resolve
// time), node builtins, or @ledgerhq/* (kept as ESM for shared singletons).
function isThirdPartyCjs(specifier, parentUrl) {
  if (
    specifier.startsWith(".") ||
    specifier.startsWith("/") ||
    specifier.startsWith("node:") ||
    specifier.startsWith("@ledgerhq/")
  ) {
    return false;
  }
  const key = `${parentUrl}|${specifier}`;
  if (cjsCache.has(key)) return cjsCache.get(key);
  let result = false;
  try {
    const resolved = createRequire(parentUrl).resolve(specifier);
    if (resolved.endsWith(".mjs") || resolved.endsWith(".json")) result = false;
    else if (resolved.endsWith(".cjs") || resolved.endsWith(".node")) result = true;
    else result = nearestPackageType(resolved) !== "module";
  } catch {
    result = false;
  }
  cjsCache.set(key, result);
  return result;
}

function destructureNamed(clause) {
  return clause
    .replace(/^\{|\}$/g, "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      const m = s.match(/^(.+?)\s+as\s+(.+)$/);
      return m ? `${m[1]}: ${m[2]}` : s;
    })
    .join(", ");
}

let tmpId = 0;
// Rewrite a single-line `import` of a third-party CJS dep into require() + the
// interop helpers tsc emits under esModuleInterop. Returns null to leave a line
// untouched (ESM dep, our own code, relative import, etc.).
function rewriteImportLine(line, parentUrl) {
  const sideEffect = line.match(/^(\s*)import\s+(['"])([^'"]+)\2\s*;?\s*$/);
  if (sideEffect) {
    const [, indent, , spec] = sideEffect;
    return isThirdPartyCjs(spec, parentUrl) ? `${indent}require(${JSON.stringify(spec)});` : null;
  }
  const m = line.match(/^(\s*)import\s+(.+?)\s+from\s*(['"])([^'"]+)\3\s*;?\s*$/);
  if (!m) return null;
  const [, indent, clause, , spec] = m;
  if (!isThirdPartyCjs(spec, parentUrl)) return null;

  const req = `require(${JSON.stringify(spec)})`;
  const c = clause.trim();
  if (c.startsWith("{")) {
    return `${indent}const { ${destructureNamed(c)} } = ${req};`;
  }
  if (c.startsWith("* as ")) {
    return `${indent}const ${c.slice(5).trim()} = __interopStar(${req});`;
  }
  const comma = c.indexOf(",");
  if (comma === -1) {
    return `${indent}const ${c} = __interopDefault(${req});`;
  }
  const def = c.slice(0, comma).trim();
  const rest = c.slice(comma + 1).trim();
  if (rest.startsWith("* as ")) {
    return `${indent}const ${rest.slice(5).trim()} = __interopStar(${req}); const ${def} = __interopDefault(${req});`;
  }
  const tmp = `__cjs${tmpId++}`;
  return `${indent}const ${tmp} = ${req}; const ${def} = __interopDefault(${tmp}); const { ${destructureNamed(rest)} } = ${tmp};`;
}

const PREAMBLE =
  'import { createRequire as __createRequire } from "node:module";\n' +
  "const require = __createRequire(import.meta.url);\n" +
  "const __interopDefault = m => (m && m.__esModule ? m.default : m);\n" +
  "const __interopStar = m => {\n" +
  "  if (m && m.__esModule) return m;\n" +
  "  const r = {};\n" +
  "  if (m != null) for (const k in m) if (Object.prototype.hasOwnProperty.call(m, k)) r[k] = m[k];\n" +
  "  r.default = m;\n" +
  "  return r;\n" +
  "};\n";

export async function load(url, context, nextLoad) {
  // Inject the `type: "json"` import attribute Node requires for .json modules.
  if (url.endsWith(".json")) {
    return nextLoad(url, {
      ...context,
      importAttributes: { ...context.importAttributes, type: "json" },
    });
  }

  if (url.startsWith("file:") && url.includes("/lib-es/") && url.endsWith(".js")) {
    const source = readFileSync(fileURLToPath(url), "utf8");
    let changed = false;
    const out = source
      .split("\n")
      .map(line => {
        if (!line.startsWith("import")) return line;
        const rewritten = rewriteImportLine(line, url);
        if (rewritten == null) return line;
        changed = true;
        return rewritten;
      })
      .join("\n");

    // Even without an interop rewrite, lib-es may reference `require()` directly.
    const needsRequire =
      changed || (/\brequire\s*\(/.test(source) && !source.includes("createRequire"));
    if (needsRequire) {
      return { format: "module", shortCircuit: true, source: PREAMBLE + out };
    }
  }

  return nextLoad(url, context);
}

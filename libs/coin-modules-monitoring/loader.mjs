// Problems this loader solves when running CJS code that transitively pulls
// in @mysten/ledgerjs-hw-app-sui (ESM-only):
//
// 1. @ledgerhq/* lib-es files use extensionless relative imports (e.g.
//    `import './helpers'`) which Node's strict ESM resolver rejects.
//
// 2. @ledgerhq/* lib-es files are compiled for bundlers and contain `require()`
//    calls that are invalid in native ESM context.
//
// 3. Some @ledgerhq/* packages (e.g. @ledgerhq/live-dmk-shared) only ship
//    lib-es/, so the require→CJS swap doesn't apply — and their files contain
//    directory imports like `export * from "./hooks"` which Node's ESM resolver
//    rejects with ERR_UNSUPPORTED_DIR_IMPORT.
//
// Fix for (1) and (2): when @ledgerhq/* packages are resolved in ESM context,
// force the `require` condition so Node picks lib/ (CJS) instead of lib-es/.
//
// Fix for (3): on ERR_UNSUPPORTED_DIR_IMPORT or ERR_MODULE_NOT_FOUND, retry by
// appending `/index.js` (directory) or `.js` (extensionless file).

import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

function tryResolveAsFileOrDir(url) {
  try {
    const path = fileURLToPath(url);
    if (existsSync(path) && statSync(path).isDirectory()) {
      const indexUrl = url.endsWith("/") ? `${url}index.js` : `${url}/index.js`;
      if (existsSync(fileURLToPath(indexUrl))) return indexUrl;
    }
    const withJs = `${path}.js`;
    if (existsSync(withJs)) return pathToFileURL(withJs).href;
  } catch {
    // ignore
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  // Fix (1)/(2): redirect @ledgerhq/* to CJS path when in ESM import context.
  if (specifier.startsWith("@ledgerhq/") && context.conditions?.includes("import")) {
    const conditions = context.conditions.map(c => (c === "import" ? "require" : c));
    return nextResolve(specifier, { ...context, conditions });
  }

  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    // Fix (3): handle directory and extensionless relative imports inside
    // packages whose lib-es files were compiled for bundlers.
    if (err?.code === "ERR_UNSUPPORTED_DIR_IMPORT" && err.url) {
      const indexUrl = err.url.endsWith("/") ? `${err.url}index.js` : `${err.url}/index.js`;
      return nextResolve(indexUrl, context);
    }
    if (err?.code === "ERR_MODULE_NOT_FOUND" && specifier.startsWith(".") && context.parentURL) {
      const baseUrl = new URL(specifier, context.parentURL).href;
      const fixed = tryResolveAsFileOrDir(baseUrl);
      if (fixed) return nextResolve(fixed, context);
    }
    throw err;
  }
}

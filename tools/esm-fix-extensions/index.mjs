#!/usr/bin/env node
// Make a `tsc --moduleResolution bundler` ESM build (extensionless relative imports)
// loadable by Node's native ESM resolver: rewrite each relative import/export specifier
// to its concrete target (`./x` -> `./x.js`, dir -> `./x/index.js`) and drop a
// `{ "type": "module" }` marker into the output dir. Source stays extensionless. See LIVE-31760.
import fs from "node:fs";
import path from "node:path";
import { init, parse } from "es-module-lexer";
import MagicString from "magic-string";

function collect(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full, out);
    else if (entry.name.endsWith(".js")) out.push(full);
  }
}

function resolveSpecifier(fromFile, spec) {
  if (!spec.startsWith(".")) return null; // bare specifiers resolve via package `exports`
  if (/\.(m?js|cjs|json)$/.test(spec)) return null; // already explicit
  const base = path.resolve(path.dirname(fromFile), spec);
  if (fs.existsSync(base + ".js")) return spec + ".js";
  if (fs.existsSync(path.join(base, "index.js"))) return (spec.endsWith("/") ? spec : spec + "/") + "index.js";
  return null;
}

// CJS globals that survive a `tsc -m esnext` build when present verbatim in source
// (e.g. a lazy `require("https")`). They are undefined under `type: module`, so the
// ESM output must define them itself via the standard `import.meta` shims.
const REQUIRE_BANNER =
  'import { createRequire as __esmCreateRequire } from "node:module";\n' +
  "const require = __esmCreateRequire(import.meta.url);\n";
const DIRNAME_BANNER =
  'import { fileURLToPath as __esmFileURLToPath } from "node:url";\n' +
  'import { dirname as __esmDirname } from "node:path";\n' +
  "const __filename = __esmFileURLToPath(import.meta.url);\n" +
  "const __dirname = __esmDirname(__filename);\n";

async function run(dir) {
  const root = path.resolve(dir);
  if (!fs.existsSync(root)) return;
  await init;

  const files = [];
  collect(root, files);

  let rewritten = 0;
  for (const file of files) {
    const code = fs.readFileSync(file, "utf8");
    const [imports] = parse(code, file);
    const ms = new MagicString(code);
    let dirty = false;
    for (const imp of imports) {
      if (imp.n == null) continue; // dynamic import with a non-literal argument
      const fixed = resolveSpecifier(file, imp.n);
      if (fixed) {
        ms.overwrite(imp.s, imp.e, fixed);
        dirty = true;
      }
    }
    if (/(^|[^\w.])require\s*\(/m.test(code) && !code.includes("createRequire")) {
      ms.prepend(REQUIRE_BANNER);
      dirty = true;
    }
    if (/\b__dirname\b|\b__filename\b/.test(code) && !code.includes("fileURLToPath")) {
      ms.prepend(DIRNAME_BANNER);
      dirty = true;
    }
    if (dirty) {
      fs.writeFileSync(file, ms.toString());
      rewritten++;
    }
  }

  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ type: "module" }, null, 2) + "\n");
  return { files: files.length, rewritten };
}

const target = process.argv[2];
if (!target) {
  console.error("usage: esm-fix-extensions <dir>");
  process.exit(1);
}
run(target).catch(err => {
  console.error(err);
  process.exit(1);
});

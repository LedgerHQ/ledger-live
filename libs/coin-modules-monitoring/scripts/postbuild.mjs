// Post-build fixups for the rslib CJS bundle, mirroring apps/cli:
// - @polkadot emits bare `import.meta`, invalid in a CJS file. rslib already
//   shims `import.meta.url` to `__rslib_import_meta_url__`; rewrite the rest.
// - @dfinity packages reference `window`; expose globalThis as window once.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const libDir = fileURLToPath(new URL("../lib/", import.meta.url));
const windowPolyfill = "if(typeof globalThis.window==='undefined'){globalThis.window=globalThis;}\n";

for (const file of readdirSync(libDir).filter(f => f.endsWith(".js"))) {
  const path = join(libDir, file);
  let code = readFileSync(path, "utf8");
  code = code.replace(/\bimport\.meta\b(?!\.url)/g, "__rslib_import_meta_url__");
  if (file === "cli.js" && !code.startsWith(windowPolyfill)) {
    code = windowPolyfill + code;
  }
  writeFileSync(path, code, "utf8");
}

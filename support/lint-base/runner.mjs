// Shared entry point for every `@support/lint-*` preset bin. The preset hands us the URL of the
// config file it ships; we pass it to oxlint as `-c`, which disables oxlint's own upward config
// discovery. That is what lets a consumer carry no config file at all.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

/**
 * @param {URL} configUrl URL of the preset's own oxlint config file.
 * @param {string[]} [argv] Arguments to forward, defaults to the caller's.
 */
export function run(configUrl, argv = process.argv.slice(2)) {
  const oxlintRoot = dirname(require.resolve("oxlint/package.json"));
  const cli = join(oxlintRoot, "bin", "oxlint");
  const config = fileURLToPath(configUrl);
  const result = spawnSync(process.execPath, [cli, "-c", config, ...argv], {
    stdio: "inherit",
  });
  process.exit(result.status ?? 1);
}

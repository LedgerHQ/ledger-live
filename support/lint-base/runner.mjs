// Shared entry point for every `@support/lint-*` preset bin. The preset hands us the URL of the
// config file it ships; we pass it to oxlint as `-c`, which disables oxlint's own upward config
// discovery. That is what lets a consumer carry no config file at all.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

/**
 * Ignore patterns cannot live in the preset's config file. oxlint resolves `ignorePatterns`
 * against the directory holding that config, and unlike `overrides[].files` a leading globstar
 * does not rescue it, so patterns written in a preset match nothing and fail silently. Passed as
 * `--ignore-pattern` they resolve against the consumer's directory instead. oxfmt has the same
 * constraint and `fmt-base` handles it the same way.
 *
 * @param {URL} configUrl URL of the preset's own oxlint config file.
 * @param {{ ignore?: string[] }} [options] Ignore patterns to apply in the consumer.
 * @param {string[]} [argv] Arguments to forward, defaults to the caller's.
 */
export function run(configUrl, options = {}, argv = process.argv.slice(2)) {
  const oxlintRoot = dirname(require.resolve("oxlint/package.json"));
  const cli = join(oxlintRoot, "bin", "oxlint");
  const config = fileURLToPath(configUrl);
  const ignore = (options.ignore ?? []).flatMap(pattern => ["--ignore-pattern", pattern]);
  const result = spawnSync(process.execPath, [cli, "-c", config, ...ignore, ...argv], {
    stdio: "inherit",
  });
  process.exit(result.status ?? 1);
}

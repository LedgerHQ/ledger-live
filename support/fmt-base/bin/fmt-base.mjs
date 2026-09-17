#!/usr/bin/env node
// Runs oxfmt against the preset's own config.
//
// `--disable-nested-config` is passed with `-c` so a stray `.oxfmtrc.json` above the consumer
// cannot quietly take over: the preset is the whole configuration.
//
// BASELINE_EXCLUDES cannot live in the config file, because oxfmt resolves `ignorePatterns`
// relative to the config's directory and the preset sits outside every tree it formats. As `!`
// positionals they resolve against the consumer's directory, which is what we want. A consumer
// needing more writes them in its own script, e.g. `fmt-base src '!src/generated/**'`.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASELINE_EXCLUDES = ["!**/*.md", "!**/*.json"];

const require = createRequire(import.meta.url);
const cli = join(dirname(require.resolve("oxfmt/package.json")), "bin", "oxfmt");
const config = fileURLToPath(new URL("../oxfmt.config.mts", import.meta.url));
const result = spawnSync(
  process.execPath,
  [cli, "-c", config, "--disable-nested-config", ...process.argv.slice(2), ...BASELINE_EXCLUDES],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);

#!/usr/bin/env zx
import { $ } from "zx";
import fs from "node:fs";

$.verbose = true;

if (os.platform() === "win32") {
  usePowerShell();
}

echo(chalk.green("Building bundled javascript"));

await $`rslib build`;

// Fix: Replace raw import.meta references that weren't shimmed (from @polkadot/api)
// This prevents Node.js from auto-detecting the file as ESM.
// apps/cli has the same fix in its build.mjs.
const outputJs = "lib/index.cjs";
if (fs.existsSync(outputJs)) {
  let content = fs.readFileSync(outputJs, "utf8");
  content = content.replace(/\bimport\.meta\b(?!\.url)/g, "__rslib_import_meta_url__");
  // Silence noisy third-party startup logs
  content = content.replace(/console\.log\([`'"]Patching Protobuf Long\.js instance\.\.\.[`'"]\)/g, "void(0)");

  // Add window polyfill for browser-specific code (e.g. from @dfinity packages)
  if (content.includes("window") && !content.includes("globalThis.window")) {
    const windowPolyfill = `(function() {
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = globalThis;
  }
})();\n`;
    content = windowPolyfill + content;
  }

  fs.writeFileSync(outputJs, content, "utf8");
  echo(chalk.green(`Fixed import.meta references in ${outputJs}`));
}

echo(chalk.green("Bundling complete"));

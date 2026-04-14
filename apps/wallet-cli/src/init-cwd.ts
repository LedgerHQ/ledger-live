import { existsSync } from "node:fs";
import { join, dirname } from "node:path";

/**
 * Native addons such as `usb` (node-gyp-build) can misbehave when the process cwd is unrelated to the app
 * (e.g. monorepo root, /tmp). The standalone binary is emitted as dist/cli; package root is one
 * level up. When running via `bun src/cli.ts`, execPath points at the Bun binary — skip chdir.
 */
const nextToExec = join(dirname(process.execPath), "..");
const looksLikePackageRoot =
  existsSync(join(nextToExec, "bunli.config.ts")) ||
  existsSync(join(nextToExec, "bunli.config.js")) ||
  existsSync(join(nextToExec, "bunli.config.mjs"));

if (looksLikePackageRoot) {
  try {
    process.chdir(nextToExec);
  } catch {
    // ignore
  }
}

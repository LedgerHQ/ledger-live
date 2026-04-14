import { existsSync } from "node:fs";
import { join, dirname } from "node:path";

/**
 * Native addons such as `usb` (node-gyp-build) can misbehave when the process cwd is unrelated to the app
 * (e.g. monorepo root, /tmp). When running via `bun src/cli.ts`, execPath points at the Bun binary — skip chdir.
 *
 * Standalone binaries are emitted under dist/<platform>/ (e.g. dist/darwin-arm64/cli), so the
 * package root is two levels above the binary. The JS bundle (dist/cli) is only one level up.
 * Check both to handle either layout.
 */
const isPackageRoot = (dir: string): boolean =>
  existsSync(join(dir, "bunli.config.ts")) ||
  existsSync(join(dir, "bunli.config.js")) ||
  existsSync(join(dir, "bunli.config.mjs"));

const execDir = dirname(process.execPath);
// dist/<platform>/cli  →  ../.. reaches the package root
// dist/cli             →  ..    reaches the package root
const packageRoot = [join(execDir, "../.."), join(execDir, "..")].find(isPackageRoot) ?? null;

if (packageRoot) {
  try {
    process.chdir(packageRoot);
  } catch {
    // ignore
  }
}

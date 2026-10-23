#!/usr/bin/env node
/**
 * Prints `<name>@<version>` for each dependency of live-mobile that ships native code, plus the app version.
 * The e2e:native Nx targets hash this output, so JS-only dependency changes don't invalidate the native builds.
 *
 * Nx `externalDependencies` can't be used for this: it picks a random version of a package that has several
 * in the lockfile, which makes the hash unstable between runs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(appDir, "package.json"), "utf8"));

const hasNativeCode = dir =>
  fs.existsSync(path.join(dir, "ios")) ||
  fs.existsSync(path.join(dir, "android")) ||
  fs.readdirSync(dir).some(file => file.endsWith(".podspec"));

const lines = [`live-mobile@${pkg.version}`];
for (const name of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).sort()) {
  const dir = path.join(appDir, "node_modules", name);
  if (!fs.existsSync(dir) || !hasNativeCode(dir)) continue;
  const { version } = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
  lines.push(`${name}@${version}`);
}
console.log(lines.join("\n"));

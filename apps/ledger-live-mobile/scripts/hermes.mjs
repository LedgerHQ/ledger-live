#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

// Hermes ships a per-platform VM binary inside react-native's sdks/hermesc.
// Resolve it via react-native's package.json so it follows the pnpm symlink.
const require = createRequire(import.meta.url);
const reactNativeRoot = dirname(require.resolve("react-native/package.json"));

const platformDir = {
  darwin: "osx-bin",
  linux: "linux64-bin",
  win32: "win64-bin",
}[process.platform];

if (!platformDir) {
  console.error(`Unsupported platform for Hermes: ${process.platform}`);
  process.exit(1);
}

const binName = process.platform === "win32" ? "hermes.exe" : "hermes";
const hermesBin = join(reactNativeRoot, "sdks", "hermesc", platformDir, binName);

// Forward any extra args (e.g. a script file). With no args, Hermes opens a REPL.
const { status } = spawnSync(hermesBin, process.argv.slice(2), { stdio: "inherit" });
process.exit(status ?? 0);

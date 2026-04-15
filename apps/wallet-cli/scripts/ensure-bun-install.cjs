#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const packageRoot = path.resolve(__dirname, "..");
const bunDir = path.join(packageRoot, "node_modules", "bun");
const installScriptPath = path.join(bunDir, "install.js");
const bunNestedOvenDir = path.join(bunDir, "node_modules", "@oven");

function log(message) {
  process.stdout.write(`${message}\n`);
}

if (!fs.existsSync(installScriptPath)) {
  log("[wallet-cli] Bun install script not found, skipping Bun runtime check.");
  process.exit(0);
}

// Bun's installer writes platform binaries into `bun/node_modules/@oven`.
// pnpm workspace links might not have that parent directory created yet.
fs.mkdirSync(bunNestedOvenDir, { recursive: true });

log("[wallet-cli] Ensuring Bun runtime via bun/install.js...");
const result = spawnSync(process.execPath, [installScriptPath], {
  cwd: bunDir,
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

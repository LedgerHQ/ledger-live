/**
 * Assembles apps/wallet-cli/npm-dist/ for npm publish: standalone Bunli binaries
 * plus a Node bin shim. Requires `pnpm build` (bunli build) first so dist/* exists.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const npmDist = path.join(projectRoot, "npm-dist");
const workspaceRoot = path.join(projectRoot, "..", "..");

const COPIES = [
  { from: "dist/darwin-arm64/cli", to: "native/darwin-arm64/wallet-cli" },
  { from: "dist/linux-arm64/cli", to: "native/linux-arm64/wallet-cli" },
  { from: "dist/linux-x64/cli", to: "native/linux-x64/wallet-cli" },
  { from: "dist/windows-x64/cli.exe", to: "native/windows-x64/wallet-cli.exe" },
];

const SHIM_SRC = path.join(projectRoot, "bin", "wallet-cli.cjs");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function ensureBuiltArtifacts() {
  const missing = [];
  for (const { from } of COPIES) {
    const abs = path.join(projectRoot, from);
    if (!fs.existsSync(abs)) {
      missing.push(from);
    }
  }
  if (missing.length > 0) {
    console.error(
      "prepare-npm-publish: missing build output. Run `pnpm build` in apps/wallet-cli first.\n" +
        "Missing:\n  " +
        missing.join("\n  "),
    );
    process.exit(1);
  }
}

function rmrf(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  mkdirp(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function chmodPlusX(file) {
  if (process.platform === "win32") {
    return;
  }
  const mode = fs.statSync(file).mode;
  fs.chmodSync(file, mode | 0o111);
}

function main() {
  ensureBuiltArtifacts();

  if (!fs.existsSync(SHIM_SRC)) {
    console.error(`prepare-npm-publish: missing shim at ${SHIM_SRC}`);
    process.exit(1);
  }

  rmrf(npmDist);
  mkdirp(path.join(npmDist, "bin"));
  mkdirp(path.join(npmDist, "native"));

  for (const { from, to } of COPIES) {
    const src = path.join(projectRoot, from);
    const dest = path.join(npmDist, to);
    copyFile(src, dest);
    if (!to.endsWith(".exe")) {
      chmodPlusX(dest);
    }
  }

  const destShim = path.join(npmDist, "bin", "wallet-cli.cjs");
  copyFile(SHIM_SRC, destShim);
  chmodPlusX(destShim);

  const pkg = readJson(path.join(projectRoot, "package.json"));
  let rootMeta = {};
  try {
    rootMeta = readJson(path.join(workspaceRoot, "package.json"));
  } catch {
    // monorepo root optional if layout changes
  }

  const publishPkg = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    license: rootMeta.license ?? "MIT AND Apache-2.0",
    repository: rootMeta.repository ?? {
      type: "git",
      url: "https://github.com/LedgerHQ/ledger-live.git",
    },
    bugs: rootMeta.bugs ?? {
      url: "https://github.com/LedgerHQ/ledger-live/issues",
    },
    private: false,
    type: "commonjs",
    bin: {
      "wallet-cli": "./bin/wallet-cli.cjs",
    },
    files: ["bin", "native"],
    dependencies: {},
    engines: {
      node: rootMeta.engines?.node ?? ">=24.0.0",
    },
  };

  fs.writeFileSync(
    path.join(npmDist, "package.json"),
    JSON.stringify(publishPkg, null, 2) + "\n",
    "utf8",
  );

  console.log(`prepare-npm-publish: wrote ${npmDist}`);
}

main();

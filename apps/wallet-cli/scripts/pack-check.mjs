import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const packages = [
  {
    name: "@ledgerhq/wallet-cli",
    cwd: path.join(root, ".npm-package"),
    required: [
      "package/bin/wallet-cli",
      "package/CHANGELOG.md",
      "package/README.md",
      "package/package.json",
    ],
    forbiddenPrefixes: ["package/src/", "package/dist/", "package/scripts/"],
  },
  {
    name: "@ledgerhq/wallet-cli-darwin-arm64",
    cwd: path.join(root, "npm/darwin-arm64/.npm-package"),
    required: ["package/bin/wallet-cli", "package/package.json"],
  },
  {
    name: "@ledgerhq/wallet-cli-linux-arm64",
    cwd: path.join(root, "npm/linux-arm64/.npm-package"),
    required: ["package/bin/wallet-cli", "package/package.json"],
  },
  {
    name: "@ledgerhq/wallet-cli-linux-x64",
    cwd: path.join(root, "npm/linux-x64/.npm-package"),
    required: ["package/bin/wallet-cli", "package/package.json"],
  },
  {
    name: "@ledgerhq/wallet-cli-windows-x64",
    cwd: path.join(root, "npm/windows-x64/.npm-package"),
    required: ["package/bin/wallet-cli.exe", "package/package.json"],
  },
];

function run(command, args, options) {
  const result = spawnSync(command, args, {
    ...options,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    throw new Error(`${command} ${args.join(" ")} failed to start\n${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed\n${result.stdout ?? ""}${result.stderr ?? ""}`,
    );
  }

  return result.stdout;
}

async function packPackage(pkg, destination) {
  const before = new Set(await readdir(destination));

  run("pnpm", ["pack", "--pack-destination", destination], { cwd: pkg.cwd });

  const after = await readdir(destination);
  const created = after.filter(file => !before.has(file) && file.endsWith(".tgz"));

  if (created.length !== 1) {
    throw new Error(`Expected one tarball for ${pkg.name}, got ${created.length}`);
  }

  return path.join(destination, created[0]);
}

function listTarball(tarball) {
  return run("tar", ["-tf", tarball], { cwd: root })
    .split("\n")
    .filter(Boolean);
}

function assertPackageContents(pkg, entries) {
  for (const required of pkg.required) {
    if (!entries.includes(required)) {
      throw new Error(`${pkg.name} tarball is missing ${required}`);
    }
  }

  for (const forbiddenPrefix of pkg.forbiddenPrefixes ?? []) {
    const forbiddenEntry = entries.find(entry => entry.startsWith(forbiddenPrefix));

    if (forbiddenEntry) {
      throw new Error(`${pkg.name} tarball unexpectedly includes ${forbiddenEntry}`);
    }
  }
}

const destination = await mkdtemp(path.join(tmpdir(), "wallet-cli-pack-check-"));

try {
  for (const pkg of packages) {
    const tarball = await packPackage(pkg, destination);
    const entries = listTarball(tarball);

    assertPackageContents(pkg, entries);
    console.log(`Checked ${pkg.name}`);
  }
} finally {
  await rm(destination, { recursive: true, force: true });
}

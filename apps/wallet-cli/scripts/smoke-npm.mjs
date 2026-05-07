import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const platformPackages = {
  "darwin:arm64": "npm/darwin-arm64",
  "linux:arm64": "npm/linux-arm64",
  "linux:x64": "npm/linux-x64",
  "win32:x64": "npm/windows-x64",
};

const platformKey = `${process.platform}:${process.arch}`;
const platformPackagePath = platformPackages[platformKey];

if (!platformPackagePath) {
  throw new Error(`wallet-cli does not provide a binary for ${platformKey}`);
}

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

async function pack(cwd, destination) {
  const before = new Set(await readdir(destination));

  run("pnpm", ["pack", "--pack-destination", destination], { cwd });

  const after = await readdir(destination);
  const created = after.filter(file => !before.has(file) && file.endsWith(".tgz"));

  if (created.length !== 1) {
    throw new Error(`Expected one tarball from ${cwd}, got ${created.length}`);
  }

  return path.join(destination, created[0]);
}

const destination = await mkdtemp(path.join(tmpdir(), "wallet-cli-smoke-pack-"));
const installDir = await mkdtemp(path.join(tmpdir(), "wallet-cli-smoke-install-"));

try {
  const platformTarball = await pack(path.join(root, platformPackagePath, ".npm-package"), destination);
  const mainTarball = await pack(path.join(root, ".npm-package"), destination);

  await writeFile(
    path.join(installDir, "package.json"),
    JSON.stringify({ private: true, type: "module" }, null, 2),
  );

  run("pnpm", ["add", platformTarball, mainTarball], { cwd: installDir });
  run("pnpm", ["exec", "wallet-cli", "--version"], { cwd: installDir });

  console.log(`Installed and executed @ledgerhq/wallet-cli for ${platformKey}.`);
} finally {
  await rm(destination, { recursive: true, force: true });
  await rm(installDir, { recursive: true, force: true });
}

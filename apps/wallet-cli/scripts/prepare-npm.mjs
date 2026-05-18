import { chmod, copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const platforms = [
  {
    key: "darwin-arm64",
    packageName: "@ledgerhq/wallet-cli-darwin-arm64",
    os: "darwin",
    cpu: "arm64",
    bin: { "wallet-cli": "./bin/wallet-cli" },
    source: "dist/darwin-arm64/cli",
    target: "npm/darwin-arm64/bin/wallet-cli",
    executable: true,
  },
  {
    key: "linux-arm64",
    packageName: "@ledgerhq/wallet-cli-linux-arm64",
    os: "linux",
    cpu: "arm64",
    bin: { "wallet-cli": "./bin/wallet-cli" },
    source: "dist/linux-arm64/cli",
    target: "npm/linux-arm64/bin/wallet-cli",
    executable: true,
  },
  {
    key: "linux-x64",
    packageName: "@ledgerhq/wallet-cli-linux-x64",
    os: "linux",
    cpu: "x64",
    bin: { "wallet-cli": "./bin/wallet-cli" },
    source: "dist/linux-x64/cli",
    target: "npm/linux-x64/bin/wallet-cli",
    executable: true,
  },
  {
    key: "windows-x64",
    packageName: "@ledgerhq/wallet-cli-windows-x64",
    os: "win32",
    cpu: "x64",
    bin: { "wallet-cli": "./bin/wallet-cli.exe" },
    source: "dist/windows-x64/cli.exe",
    target: "npm/windows-x64/bin/wallet-cli.exe",
    executable: false,
  },
];

async function readPackage(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

async function assertPackageVersions() {
  const mainPackage = await readPackage("package.json");

  for (const platform of platforms) {
    const platformPackage = await readPackage(`npm/${platform.key}/package.json`);

    if (platformPackage.name !== platform.packageName) {
      throw new Error(
        `Expected npm/${platform.key}/package.json to be named ${platform.packageName}, got ${platformPackage.name}`,
      );
    }

    if (platformPackage.version !== mainPackage.version) {
      throw new Error(
        `${platform.packageName} version ${platformPackage.version} does not match @ledgerhq/wallet-cli ${mainPackage.version}`,
      );
    }
  }
}

async function prepareShim() {
  const shimSource = path.join(root, "bin/wallet-cli");
  const shimTarget = path.join(root, ".npm-package/bin/wallet-cli");

  await mkdir(path.dirname(shimTarget), { recursive: true });
  await copyFile(shimSource, shimTarget);
  await chmod(shimTarget, 0o755);
}

async function prepareMainPackage() {
  const mainPackage = await readPackage("package.json");
  const packageDirectory = path.join(root, ".npm-package");
  const publishPackage = {
    name: mainPackage.name,
    version: mainPackage.version,
    description: mainPackage.description,
    license: mainPackage.license,
    bin: mainPackage.bin,
    files: ["bin/", "README.md", "CHANGELOG.md"],
    optionalDependencies: Object.fromEntries(
      platforms.map(platform => [platform.packageName, mainPackage.version]),
    ),
    publishConfig: {
      access: "public",
    },
  };

  await rm(packageDirectory, { recursive: true, force: true });
  await mkdir(packageDirectory, { recursive: true });
  await writeFile(path.join(packageDirectory, "package.json"), `${JSON.stringify(publishPackage, null, 2)}\n`);
  await copyFile(path.join(root, "README.md"), path.join(packageDirectory, "README.md"));
  await copyFile(path.join(root, "CHANGELOG.md"), path.join(packageDirectory, "CHANGELOG.md"));
}

async function preparePlatformBinaries() {
  for (const platform of platforms) {
    const source = path.join(root, platform.source);
    const target = path.join(root, platform.target);
    const packageDirectory = path.join(root, `npm/${platform.key}/.npm-package`);
    const publishPackage = {
      name: platform.packageName,
      version: (await readPackage(`npm/${platform.key}/package.json`)).version,
      description: `${platform.key} native binary for @ledgerhq/wallet-cli`,
      license: "Apache-2.0",
      bin: platform.bin,
      os: [platform.os],
      cpu: [platform.cpu],
      files: ["bin/"],
      publishConfig: {
        access: "public",
      },
    };

    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
    await rm(packageDirectory, { recursive: true, force: true });
    await mkdir(path.join(packageDirectory, "bin"), { recursive: true });
    await writeFile(path.join(packageDirectory, "package.json"), `${JSON.stringify(publishPackage, null, 2)}\n`);
    await copyFile(source, path.join(packageDirectory, platform.bin["wallet-cli"]));

    if (platform.executable) {
      await chmod(target, 0o755);
      await chmod(path.join(packageDirectory, platform.bin["wallet-cli"]), 0o755);
    }
  }
}

await assertPackageVersions();
await prepareMainPackage();
await prepareShim();
await preparePlatformBinaries();

console.log("Prepared wallet-cli npm packages.");

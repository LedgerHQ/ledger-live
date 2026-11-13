import { type ChildProcess, spawn } from "child_process";
import { once } from "events";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { build as electronBuild } from "electron-builder";
import { execa } from "execa";
import semver, { type ReleaseType } from "semver";
import pkg from "../../package.json" with { type: "json" };
import { getPub, sha512 } from "./crypto.mts";

const lldRoot = path.resolve(import.meta.dirname, "..", "..");
const pkgPath = path.join(lldRoot, "package.json");
const feedDir = path.join(lldRoot, "dist", "feed");
const installDir = path.join(lldRoot, "dist", "installed");
const macArch = process.arch === "x64" ? "x64" : "arm64";
const macBundleId = "com.ledger.live";
const quitTimeout = 30_000;
const releaseTypes: ReadonlySet<string> = new Set(semver.RELEASE_TYPES);

type BuildOptions = {
  dir?: boolean;
  privateKey?: string;
  fromFeed?: boolean;
  latest?: boolean;
};

type BuildResult = { buildDir: string; version: string; unpackedApp: string };

type PlatformBuild = {
  unpackedApp: string;
  installedApp: string;
  latestYml: string;
  feedBinary: (version: string) => string;
  install: (binaryPath: string) => Promise<void> | void;
  executable: (app: string) => string;
  isInstalled: (version: string) => Promise<boolean> | boolean;
  // Squirrel.Mac stages a downloaded update before it can install it, the other updaters don't.
  isUpdateStaged: (since: number) => boolean;
};

export async function build(
  bump?: ReleaseType,
  { dir = false, privateKey: privKey, fromFeed = false, latest = true }: BuildOptions = {},
): Promise<BuildResult> {
  const version = bump ? semver.inc(pkg.version, bump) : pkg.version;
  if (!version) throw new Error(`Cannot apply a ${bump} bump to ${pkg.version}`);
  const buildDir = path.join(lldRoot, "dist", bump ?? "base");
  const unpackedApp = path.join(buildDir, platformBuild().unpackedApp);

  if (fromFeed) {
    const feedIssue = findFeedIssue(version, latest);
    if (!feedIssue) {
      console.log(`Reusing ${version} from ${feedDir}`);
      return { buildDir, version, unpackedApp };
    }
    console.log(`Rebuilding ${version}: ${feedIssue}`);
  }

  console.log(`Building Ledger Wallet ${version} into ${buildDir}`);

  process.on("SIGINT", () => process.exit(130));
  process.chdir(lldRoot);
  fs.rmSync(path.join(lldRoot, ".webpack"), { recursive: true, force: true });
  fs.rmSync(buildDir, { recursive: true, force: true });

  await withPackageVersion(version, () => bundle(privKey && getPub(privKey)));

  process.env.CSC_IDENTITY_AUTO_DISCOVERY = "true";

  await electronBuild({
    projectDir: lldRoot,
    publish: "never",
    dir,
    config: {
      extends: "electron-builder-nosign.yml",
      extraMetadata: { version },
      directories: { output: buildDir },
      mac: { target: { target: "zip", arch: macArch } },
    },
  });

  copyToFeed(buildDir, version, latest);

  return { buildDir, version, unpackedApp };
}

export async function installFromFeed(version: string) {
  const { feedBinary, installedApp, install } = platformBuild();
  const binaryPath = feedBinary(version);
  fs.mkdirSync(installDir, { recursive: true });
  await install(binaryPath);
  console.log(`Installed ${path.basename(binaryPath)} as ${installedApp}`);
  return installedApp;
}

export function openApp(appPath: string, env: Record<string, string> = {}) {
  if (!fs.existsSync(appPath)) throw new Error(`No app at ${appPath}`);
  const app = spawn(platformBuild().executable(appPath), {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, ...env },
  });
  app.unref();
  return app;
}

// The updater only installs a downloaded update when the app quits with exit code 0.
export async function quitApp(app: ChildProcess) {
  if (hasExited(app)) return;
  const exited = once(app, "exit", { signal: AbortSignal.timeout(quitTimeout) });
  if (process.platform === "win32") {
    // Without /F, taskkill asks the app windows to close, and the app quits once they are closed.
    await execa("taskkill", ["/PID", String(app.pid)]);
  } else {
    app.kill("SIGTERM");
  }
  await exited;
}

export function hasExited(app: ChildProcess) {
  return app.exitCode !== null || app.signalCode !== null;
}

export async function isInstalled(version: string) {
  try {
    return await platformBuild().isInstalled(version);
  } catch {
    return false;
  }
}

export function isUpdateStaged(since: number) {
  try {
    return platformBuild().isUpdateStaged(since);
  } catch {
    return false;
  }
}

export function parseBump(value: string | undefined) {
  if (value === undefined || isReleaseType(value)) return value;
  throw new Error(`Unknown bump "${value}", use one of: ${[...releaseTypes].join(", ")}`);
}

function isReleaseType(value: string): value is ReleaseType {
  return releaseTypes.has(value);
}

function findFeedIssue(version: string, latest: boolean) {
  // The installable binary of this version must be in the feed.
  const { feedBinary, latestYml } = platformBuild();
  const binaryPath = feedBinary(version);
  if (!fs.existsSync(binaryPath)) return `${path.basename(binaryPath)} is missing from the feed`;

  // A build that is not the latest (the base) only needs its binary.
  if (!latest) return undefined;

  // The updater reads the latest yml to discover the update, so it must be in the feed.
  if (!fs.existsSync(latestYml)) return `${path.basename(latestYml)} is missing from the feed`;

  // The latest yml must announce this version, not one from an earlier build.
  const latestYmlContent = fs.readFileSync(latestYml, "utf8");
  const latestVersion = readTopLevelYamlValue(latestYmlContent, "version");
  if (latestVersion !== version) return `${path.basename(latestYml)} points at ${latestVersion}`;

  // It must point at this binary, and its hash must match the binary in the feed, or the
  // updater rejects the download (a rebuild of the same version changes the hash).
  const latestPath = readTopLevelYamlValue(latestYmlContent, "path");
  const latestHash = readTopLevelYamlValue(latestYmlContent, "sha512");
  if (latestPath !== path.basename(binaryPath) || latestHash !== sha512(binaryPath, "base64")) {
    return `${path.basename(latestYml)} does not match ${path.basename(binaryPath)}`;
  }
  return undefined;
}

function platformBuild(): PlatformBuild {
  switch (process.platform) {
    case "darwin": {
      const installedApp = path.join(installDir, `${pkg.productName}.app`);
      return {
        unpackedApp: path.join(
          macArch === "x64" ? "mac" : `mac-${macArch}`,
          `${pkg.productName}.app`,
        ),
        installedApp,
        latestYml: path.join(feedDir, "latest-mac.yml"),
        feedBinary: version => path.join(feedDir, `${pkg.name}-${version}-mac.zip`),
        install: zip => unzipApp(zip, installedApp),
        executable: app => path.join(app, "Contents", "MacOS", pkg.productName),
        isInstalled: version => bundleVersion(installedApp) === version,
        isUpdateStaged: since => isStagedByShipIt(installedApp, since),
      };
    }
    case "linux": {
      // Without a version in its name, the updater replaces the AppImage in place.
      const installedApp = path.join(installDir, `${pkg.productName}.AppImage`);
      const feedBinary = (version: string) =>
        path.join(feedDir, `${pkg.name}-${version}-linux-x86_64.AppImage`);
      return {
        unpackedApp: path.join("linux-unpacked", pkg.name),
        installedApp,
        latestYml: path.join(feedDir, "latest-linux.yml"),
        feedBinary,
        install: appImage => replaceFile(appImage, installedApp),
        executable: app => app,
        isInstalled: version => sha512(installedApp, "hex") === sha512(feedBinary(version), "hex"),
        isUpdateStaged: () => true,
      };
    }
    case "win32":
      return {
        unpackedApp: path.join("win-unpacked", `${pkg.productName}.exe`),
        installedApp: path.join(installDir, `${pkg.productName}.exe`),
        latestYml: path.join(feedDir, "latest.yml"),
        feedBinary: version => path.join(feedDir, `${pkg.name}-${version}-win-x64.exe`),
        install: runInstaller,
        executable: app => app,
        isInstalled: async version => (await registeredVersion()) === version,
        isUpdateStaged: () => true,
      };
    default:
      throw new Error(`Local builds are not supported on ${process.platform}`);
  }
}

async function unzipApp(zip: string, app: string) {
  fs.rmSync(app, { recursive: true, force: true });
  await execa("ditto", ["-x", "-k", zip, path.dirname(app)]);
}

function replaceFile(source: string, destination: string) {
  fs.rmSync(destination, { force: true });
  fs.copyFileSync(source, destination);
}

// The per-machine installer requires admin rights, which only a RunAs launch can request.
async function runInstaller(installer: string) {
  console.log(`Installing into ${installDir}, this replaces any installed Ledger Wallet`);
  await execa(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      [
        "$ErrorActionPreference = 'Stop'",
        '$installer = Start-Process -FilePath $env:INSTALLER -ArgumentList "/S /D=$env:INSTALL_DIR" -Verb RunAs -Wait -PassThru',
        "exit $installer.ExitCode",
      ].join("; "),
    ],
    { env: { INSTALLER: installer, INSTALL_DIR: installDir }, stdio: "inherit" },
  );
}

function bundleVersion(app: string) {
  const plist = fs.readFileSync(path.join(app, "Contents", "Info.plist"), "utf8");
  return /<key>CFBundleShortVersionString<\/key>\s*<string>([^<]*)<\/string>/.exec(plist)?.[1];
}

// ShipIt records the update it staged for an app, and installs it once that app quits.
function isStagedByShipIt(app: string, since: number) {
  const shipItDir = path.join(os.homedir(), "Library", "Caches", `${macBundleId}.ShipIt`);
  const statePath = path.join(shipItDir, "ShipItState.plist");
  const stats = fs.statSync(statePath, { throwIfNoEntry: false });
  if (!stats || stats.mtimeMs < since) return false;
  const { targetBundleURL } = JSON.parse(fs.readFileSync(statePath, "utf8"));
  return path.resolve(fileURLToPath(targetBundleURL)) === app;
}

// The installer records the installed version in the uninstall entry pointing at installDir.
async function registeredVersion() {
  const uninstallEntries = "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*";
  const { stdout } = await execa(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `(Get-ItemProperty '${uninstallEntries}' | Where-Object { "$($_.UninstallString)".Contains($env:INSTALL_DIR) }).DisplayVersion`,
    ],
    { env: { INSTALL_DIR: installDir } },
  );
  return stdout.trim().split(/\r?\n/)[0];
}

// electron-builder writes the top-level path and sha512 as copies of files[0].
function readTopLevelYamlValue(yaml: string, key: string) {
  return new RegExp(`^${key}: (.*)$`, "m").exec(yaml)?.[1];
}

function copyToFeed(buildDir: string, version: string, latest: boolean) {
  const latestYmls = latest ? ["latest*.yml"] : [];
  const files = fs.globSync([`${pkg.name}-${version}-*`, ...latestYmls], { cwd: buildDir });
  if (files.length === 0) return;
  fs.mkdirSync(feedDir, { recursive: true });
  for (const file of files) fs.copyFileSync(path.join(buildDir, file), path.join(feedDir, file));
  console.log(`Copied ${files.join(", ")} into ${feedDir}`);
}

async function withPackageVersion(bumpedVersion: string, run: () => Promise<unknown>) {
  if (bumpedVersion === pkg.version) return run();
  const original = fs.readFileSync(pkgPath, "utf8");
  const restore = () => fs.writeFileSync(pkgPath, original);
  fs.writeFileSync(
    pkgPath,
    JSON.stringify({ ...JSON.parse(original), version: bumpedVersion }, null, 2),
  );
  process.once("exit", restore);
  try {
    await run();
  } finally {
    process.off("exit", restore);
    restore();
  }
}

function bundle(pubKey: string | undefined) {
  if (pubKey) console.log(`Using the app update public key:\n${pubKey}`);
  return execa(process.execPath, ["./tools/main-rspack.mts", "build"], {
    env: { NODE_ENV: "production", STAGING: "1", ...(pubKey && { UPDATE_CHECK_PUBKEY: pubKey }) },
    stdio: "inherit",
  });
}

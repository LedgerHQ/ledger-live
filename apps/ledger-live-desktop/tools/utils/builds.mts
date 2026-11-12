import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { build as electronBuild } from "electron-builder";
import { execa } from "execa";
import semver, { type ReleaseType } from "semver";
import pkg from "../../package.json" with { type: "json" };

const lldRoot = path.resolve(import.meta.dirname, "..", "..");
const pkgPath = path.join(lldRoot, "package.json");
const feedDir = path.join(lldRoot, "dist", "feed");
const macArch = process.arch === "x64" ? "x64" : "arm64";
const releaseTypes: ReadonlySet<string> = new Set(semver.RELEASE_TYPES);

type BuildOptions = {
  dir?: boolean;
};

type BuildResult = { buildDir: string; version: string; unpackedApp: string };

type PlatformBuild = {
  unpackedApp: string;
  executable: (app: string) => string;
};

export async function build(
  bump?: ReleaseType,
  { dir = false }: BuildOptions = {},
): Promise<BuildResult> {
  const version = bump ? semver.inc(pkg.version, bump) : pkg.version;
  if (!version) throw new Error(`Cannot apply a ${bump} bump to ${pkg.version}`);
  const buildDir = path.join(lldRoot, "dist", bump ?? "base");
  const unpackedApp = path.join(buildDir, platformBuild().unpackedApp);

  console.log(`Building Ledger Wallet ${version} into ${buildDir}`);

  process.on("SIGINT", () => process.exit(130));
  process.chdir(lldRoot);
  fs.rmSync(path.join(lldRoot, ".webpack"), { recursive: true, force: true });
  fs.rmSync(buildDir, { recursive: true, force: true });

  await withPackageVersion(version, () => bundle());

  process.env.CSC_IDENTITY_AUTO_DISCOVERY = "false";

  await electronBuild({
    projectDir: lldRoot,
    publish: "never",
    dir,
    config: {
      extends: "electron-builder-nosign.yml",
      extraMetadata: { version },
      directories: { output: buildDir },
      mac: { target: { target: "dmg", arch: macArch } },
    },
  });

  copyToFeed(buildDir, version);

  return { buildDir, version, unpackedApp };
}

export function openApp(appPath: string) {
  if (!fs.existsSync(appPath)) throw new Error(`No app at ${appPath}`);
  const app = spawn(platformBuild().executable(appPath), { detached: true, stdio: "ignore" });
  app.unref();
  return app;
}

export function parseBump(value: string | undefined) {
  if (value === undefined || isReleaseType(value)) return value;
  throw new Error(`Unknown bump "${value}", use one of: ${[...releaseTypes].join(", ")}`);
}

function isReleaseType(value: string): value is ReleaseType {
  return releaseTypes.has(value);
}

function platformBuild(): PlatformBuild {
  switch (process.platform) {
    case "darwin":
      return {
        unpackedApp: path.join(
          macArch === "x64" ? "mac" : `mac-${macArch}`,
          `${pkg.productName}.app`,
        ),
        executable: app => path.join(app, "Contents", "MacOS", pkg.productName),
      };
    case "linux":
      return {
        unpackedApp: path.join("linux-unpacked", pkg.name),
        executable: app => app,
      };
    case "win32":
      return {
        unpackedApp: path.join("win-unpacked", `${pkg.productName}.exe`),
        executable: app => app,
      };
    default:
      throw new Error(`Local builds are not supported on ${process.platform}`);
  }
}

function copyToFeed(buildDir: string, version: string) {
  const files = fs.globSync([`${pkg.name}-${version}-*`, "latest*.yml"], { cwd: buildDir });
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

function bundle() {
  return execa(process.execPath, ["./tools/main-rspack.mts", "build"], {
    env: { NODE_ENV: "production", STAGING: "1" },
    stdio: "inherit",
  });
}

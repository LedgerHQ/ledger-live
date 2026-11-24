import { spawn } from "child_process";
import { createHash } from "crypto";
import { createWriteStream } from "fs";
import { access, chmod, mkdir, mkdtemp, readdir, rename, rm } from "fs/promises";
import * as path from "path";
import type { Readable } from "stream";
import { pipeline } from "stream/promises";
import axios from "axios";
import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";

/** Where electron-builder publishes the nightlies, with one update manifest per platform. */
const NIGHTLY_DOWNLOAD_URL = "https://download.live.ledger.com";
/** The checksums the in-app updater verifies a nightly against (`src/main/updater/init.ts`). */
const NIGHTLY_CHECKSUMS_URL = "https://lw-prerelease-sigs.s3.eu-west-1.amazonaws.com";
const NIGHTLY_BUILDS_DIR = path.join(__dirname, "../artifacts/nightly-builds");
/** `<next version>-nightly.<build time, UTC, YYYYMMDDHHMMSS>`: it ends up in URLs and cache paths. */
const NIGHTLY_VERSION = /^\d+\.\d+\.\d+-nightly\.\d{14}$/;

/** A published nightly, unpacked and ready to launch. */
export type NightlyBuild = { version: string; executablePath: string };

type NightlyPlatform = {
  /** The electron-builder update manifest of the nightly channel: it names the latest nightly. */
  manifest: string;
  artifactName: (version: string) => string;
  unpack: (artifactPath: string, destination: string) => Promise<void>;
  executablePath: (unpackedDir: string) => Promise<string>;
};

const NIGHTLY_PLATFORMS: Partial<Record<NodeJS.Platform, NightlyPlatform>> = {
  linux: {
    manifest: "nightly-linux.yml",
    artifactName: version => `ledger-live-desktop-${version}-linux-x86_64.AppImage`,
    unpack: async (artifactPath, destination) => {
      await chmod(artifactPath, 0o755);
      // Extracting needs no FUSE. Launched outside the AppImage, the app has no APPIMAGE env,
      // so electron-updater stays inactive.
      await run(artifactPath, ["--appimage-extract"], destination);
    },
    executablePath: async unpackedDir =>
      path.join(unpackedDir, "squashfs-root", "ledger-live-desktop"),
  },
  darwin: {
    manifest: "nightly-mac.yml",
    artifactName: version => `ledger-live-desktop-${version}-mac.zip`,
    // ditto keeps the framework symlinks and the signature that unzip would break.
    unpack: (artifactPath, destination) => run("ditto", ["-x", "-k", artifactPath, destination]),
    executablePath: async unpackedDir => {
      const bundle = (await readdir(unpackedDir)).find(entry => entry.endsWith(".app"));
      if (!bundle) throw new Error(`No .app bundle in ${unpackedDir}`);
      const macOsDir = path.join(unpackedDir, bundle, "Contents", "MacOS");
      const [executable] = await readdir(macOsDir);
      if (!executable) throw new Error(`No executable in ${macOsDir}`);
      return path.join(macOsDir, executable);
    },
  },
};

export function hasNightlyBuilds(platform: NodeJS.Platform = process.platform): boolean {
  return platform in NIGHTLY_PLATFORMS;
}

function nightlyPlatform(): NightlyPlatform {
  const platform = NIGHTLY_PLATFORMS[process.platform];
  if (!platform) {
    throw new Error(`No nightly build for ${process.platform}: only Linux and macOS are supported`);
  }
  return platform;
}

function run(command: string, args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // stdout is ignored: --appimage-extract prints every extracted file.
    const child = spawn(command, args, { cwd, stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", chunk => (stderr += String(chunk)));
    child.on("error", reject);
    child.on("close", code =>
      code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}: ${stderr}`)),
    );
  });
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function fetchText(url: string): Promise<string> {
  try {
    const { data } = await axios.get<string>(url, {
      responseType: "text",
      timeout: TIMEOUT.xlarge,
    });
    return data;
  } catch (error) {
    throw new Error(`Could not fetch ${url}: ${error instanceof Error ? error.message : error}`, {
      cause: error,
    });
  }
}

/**
 * Resolves `requested` to a published nightly version: unset or `latest` reads the latest one from
 * the platform's update manifest, anything else is taken as an exact version
 * (e.g. `4.30.0-nightly.20261121020412`).
 */
export async function resolveNightlyVersion(requested?: string): Promise<string> {
  if (requested && requested !== "latest")
    return checkNightlyVersion(requested, "Requested version");
  const manifestUrl = `${NIGHTLY_DOWNLOAD_URL}/${nightlyPlatform().manifest}`;
  const version = /^version:\s*(\S+)\s*$/m.exec(await fetchText(manifestUrl))?.[1];
  if (!version) throw new Error(`No version in ${manifestUrl}`);
  return checkNightlyVersion(version, manifestUrl);
}

function checkNightlyVersion(version: string, source: string): string {
  if (!NIGHTLY_VERSION.test(version)) {
    throw new Error(
      `${source}: "${version}" is not a nightly version, e.g. 4.30.0-nightly.20261121020412`,
    );
  }
  return version;
}

async function fetchExpectedChecksum(version: string, artifactName: string): Promise<string> {
  const checksumsUrl = `${NIGHTLY_CHECKSUMS_URL}/ledger-live-desktop-${version}.sha512sum`;
  const checksums = await fetchText(checksumsUrl);
  const entry = checksums
    .split("\n")
    .map(line => line.trim().split(/\s+/))
    .find(([, fileName]) => fileName === artifactName);
  if (!entry) throw new Error(`${artifactName} is not listed in ${checksumsUrl}`);
  return entry[0];
}

/** Downloads `url` to `destination` and returns its SHA-512, as hex. */
async function download(url: string, destination: string): Promise<string> {
  const response = await axios.get<Readable>(url, {
    responseType: "stream",
    timeout: TIMEOUT.xlarge,
  });
  const hash = createHash("sha512");
  await pipeline(
    response.data,
    async function* (source: AsyncIterable<Buffer>) {
      for await (const chunk of source) {
        hash.update(chunk);
        yield chunk;
      }
    },
    createWriteStream(destination),
  );
  return hash.digest("hex");
}

/**
 * Downloads, verifies and unpacks a nightly once per version under `tests/artifacts/nightly-builds`,
 * and returns it ready to launch.
 */
export async function installNightlyBuild(version: string): Promise<NightlyBuild> {
  const platform = nightlyPlatform();
  const unpackedDir = path.join(NIGHTLY_BUILDS_DIR, version);

  if (!(await exists(unpackedDir))) {
    await mkdir(NIGHTLY_BUILDS_DIR, { recursive: true });
    const workDir = await mkdtemp(path.join(NIGHTLY_BUILDS_DIR, `${version}-`));
    try {
      const artifactName = platform.artifactName(version);
      const expectedChecksum = await fetchExpectedChecksum(version, artifactName);
      const artifactPath = path.join(workDir, artifactName);
      const checksum = await download(`${NIGHTLY_DOWNLOAD_URL}/${artifactName}`, artifactPath);
      if (checksum !== expectedChecksum) {
        throw new Error(`${artifactName} does not match its published SHA-512 checksum`);
      }
      const unpacking = path.join(workDir, "unpacked");
      await mkdir(unpacking);
      await platform.unpack(artifactPath, unpacking);
      await rename(unpacking, unpackedDir).catch(async error => {
        // Another worker unpacked the same version first.
        if (!(await exists(unpackedDir))) throw error;
      });
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  return { version, executablePath: await platform.executablePath(unpackedDir) };
}

import { spawn } from "child_process";
import { createHash } from "crypto";
import { createWriteStream, readFileSync } from "fs";
import { access, chmod, mkdir, mkdtemp, readdir, rename, rm } from "fs/promises";
import * as path from "path";
import type { Readable } from "stream";
import { pipeline } from "stream/promises";
import axios, { type AxiosRequestConfig } from "axios";
import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";

/** Where electron-builder publishes every build, with one update manifest per channel and platform. */
const DOWNLOAD_URL = "https://download.live.ledger.com";
/** The checksums the in-app updater verifies nightlies and prereleases against (`src/main/updater/init.ts`). */
const CHECKSUMS_URL = "https://lw-prerelease-sigs.s3.eu-west-1.amazonaws.com";
const BUILDS_DIR = path.join(__dirname, "../artifacts/published-builds");
const LOCAL_PACKAGE_JSON = path.join(
  __dirname,
  "../../../../apps/ledger-live-desktop/package.json",
);

/**
 * Nightlies are built from develop, `next` prereleases from the release branch and `hotfix` ones
 * from the hotfix branch. Production builds are a separate app (`com.ledger.live`) that no
 * prerelease upgrades from, so they are left out.
 */
const CHANNELS = ["nightly", "next", "hotfix"] as const;
export type Channel = (typeof CHANNELS)[number];
const PRERELEASE_CHANNELS: Channel[] = ["next", "hotfix"];

/** `<version>-<channel>.<number>`, where a nightly's number is its build time (UTC, YYYYMMDDHHMMSS). */
const PUBLISHED_VERSION = /^(\d+\.\d+\.\d+)-([a-z]+)\.(\d+)$/;
const NIGHTLY_NUMBER = /^\d{14}$/;
/** More prereleases than one version ever gets: the last one of a version is searched up to it. */
const MAX_PRERELEASES = 30;

/**
 * The manifest only names the latest nightly and neither bucket can be listed, so earlier nightlies
 * are found from the public runs of the workflow that versions them (`release-final-nightly.yml`).
 */
const GITHUB_ACTIONS_API_URL = "https://api.github.com/repos/LedgerHQ/ledger-live/actions";
const NIGHTLY_RUNS_URL = `${GITHUB_ACTIONS_API_URL}/workflows/release-final-nightly.yml/runs?status=success&per_page=10`;
/** The step that stamps the nightly version with the time it runs, about a second after it starts. */
const NIGHTLY_VERSIONING_STEP = "snapshot versioning";
const NIGHTLY_STAMP_WINDOW_SECONDS = 15;
const GITHUB_REQUEST: AxiosRequestConfig = { headers: { Accept: "application/vnd.github+json" } };

type WorkflowRuns = { workflow_runs: { id: number; run_started_at: string }[] };
type WorkflowJobs = { jobs: { steps?: { name: string; started_at: string | null }[] }[] };

/** A published nightly or prerelease, unpacked and ready to launch. */
export type PublishedBuild = { version: string; executablePath: string };

type PublishedVersion = { base: string; channel: Channel; number: string };

type BuildPlatform = {
  /** The suffix of the platform's update manifests, e.g. `next-mac.yml`. */
  manifestSuffix: string;
  artifactName: (version: string) => string;
  unpack: (artifactPath: string, destination: string) => Promise<void>;
  executablePath: (unpackedDir: string) => Promise<string>;
};

const BUILD_PLATFORMS: Partial<Record<NodeJS.Platform, BuildPlatform>> = {
  linux: {
    manifestSuffix: "linux",
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
    manifestSuffix: "mac",
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

export function hasPublishedBuilds(platform: NodeJS.Platform = process.platform): boolean {
  return platform in BUILD_PLATFORMS;
}

function buildPlatform(): BuildPlatform {
  const platform = BUILD_PLATFORMS[process.platform];
  if (!platform) {
    throw new Error(
      `No published build for ${process.platform}: only Linux and macOS are supported`,
    );
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

async function fetchData<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
  try {
    const { data } = await axios.get<T>(url, { timeout: TIMEOUT.xlarge, ...config });
    return data;
  } catch (error) {
    throw new Error(`Could not fetch ${url}: ${error instanceof Error ? error.message : error}`, {
      cause: error,
    });
  }
}

function fetchText(url: string): Promise<string> {
  return fetchData<string>(url, { responseType: "text" });
}

function toChannel(value: string | undefined): Channel | undefined {
  return CHANNELS.find(channel => channel === value);
}

/**
 * The channel the checked-out app is published on: its version ends in `-next.N` on the release
 * branch and `-hotfix.N` on the hotfix branch. Anything else is tested against nightlies.
 */
export function localChannel(): Channel {
  const { version } = JSON.parse(readFileSync(LOCAL_PACKAGE_JSON, "utf8"));
  return toChannel(PUBLISHED_VERSION.exec(String(version))?.[2]) ?? "nightly";
}

/**
 * Resolves `requested` to a published version: a channel (`nightly`, `next` or `hotfix`) reads its
 * latest version from the platform's update manifest, anything else is taken as an exact version
 * (e.g. `4.30.0-next.1`).
 */
export async function resolvePublishedVersion(requested: string): Promise<string> {
  const channel = toChannel(requested);
  if (!channel) return checkPublishedVersion(requested, "Requested version");
  const manifestUrl = `${DOWNLOAD_URL}/${channel}-${buildPlatform().manifestSuffix}.yml`;
  const version = /^version:\s*(\S+)\s*$/m.exec(await fetchText(manifestUrl))?.[1];
  if (!version) throw new Error(`No version in ${manifestUrl}`);
  return checkPublishedVersion(version, manifestUrl);
}

function parsePublishedVersion(version: string, source: string): PublishedVersion {
  const [, base, channelName, number] = PUBLISHED_VERSION.exec(version) ?? [];
  const channel = toChannel(channelName);
  if (!base || !number || !channel || (channel === "nightly" && !NIGHTLY_NUMBER.test(number))) {
    throw new Error(
      `${source}: "${version}" is not a published nightly or prerelease, e.g. 4.30.0-next.1 or 4.30.0-nightly.20261121020412`,
    );
  }
  return { base, channel, number };
}

function checkPublishedVersion(version: string, source: string): string {
  parsePublishedVersion(version, source);
  return version;
}

function checksumsUrl(version: string): string {
  return `${CHECKSUMS_URL}/ledger-live-desktop-${version}.sha512sum`;
}

async function isPublished(version: string): Promise<boolean> {
  // The bucket answers 403, not 404, for a version that was never published.
  const { status } = await axios.head(checksumsUrl(version), {
    timeout: TIMEOUT.xlarge,
    validateStatus: () => true,
  });
  return status === 200;
}

/** `YYYYMMDDHHMMSS` in UTC, as a nightly version ends. */
function toStamp(time: number): string {
  return new Date(time).toISOString().replace(/\D/g, "").slice(0, 14);
}

/** The bases before `base`: the previous patch, then the previous minor. */
function previousBases(base: string): string[] {
  const [major, minor, patch] = base.split(".").map(Number);
  return [
    ...(patch > 0 ? [`${major}.${minor}.${patch - 1}`] : []),
    ...(minor > 0 ? [`${major}.${minor - 1}.0`] : []),
  ];
}

/**
 * Finds the published version just before `version` on its channel (n-1 for n). A version that
 * was never published, such as a failed build, is skipped.
 */
export async function findPreviousVersion(version: string): Promise<string> {
  const published = parsePublishedVersion(version, "Version to upgrade to");
  const previous =
    published.channel === "nightly"
      ? await findPreviousNightly(published)
      : await findPreviousPrerelease(published);
  if (!previous) {
    throw new Error(
      `No published ${published.channel} before ${version}: set E2E_UPGRADE_FROM_VERSION`,
    );
  }
  return previous;
}

/**
 * For each earlier nightly run, newest first, tries the versions stamped in the seconds after its
 * versioning step started. A nightly cut before a release has the previous minor version.
 */
async function findPreviousNightly({ base, number: stamp }: PublishedVersion) {
  const bases = [base, ...previousBases(base)];
  const { workflow_runs: runs } = await fetchData<WorkflowRuns>(NIGHTLY_RUNS_URL, GITHUB_REQUEST);
  for (const nightlyRun of runs) {
    if (toStamp(Date.parse(nightlyRun.run_started_at)) >= stamp) continue;
    const { jobs } = await fetchData<WorkflowJobs>(
      `${GITHUB_ACTIONS_API_URL}/runs/${nightlyRun.id}/jobs`,
      GITHUB_REQUEST,
    );
    const startedAt = jobs
      .flatMap(job => job.steps ?? [])
      .find(step => step.name === NIGHTLY_VERSIONING_STEP)?.started_at;
    if (!startedAt) continue;
    for (let second = 0; second <= NIGHTLY_STAMP_WINDOW_SECONDS; second++) {
      const candidateStamp = toStamp(Date.parse(startedAt) + second * 1000);
      if (candidateStamp >= stamp) break;
      for (const candidateBase of bases) {
        const candidate = `${candidateBase}-nightly.${candidateStamp}`;
        if (await isPublished(candidate)) return candidate;
      }
    }
  }
  return undefined;
}

/**
 * Prereleases are numbered from 0 for each version (`4.30.0-next.0`, `4.30.0-next.1`…), so n-1 is
 * the previous number. The first one follows the last prerelease of the version before, on its
 * channel or else on the other one: the first hotfix follows the release candidate it fixes
 * (`4.26.0-next.2` -> `4.26.1-hotfix.0`).
 */
async function findPreviousPrerelease({ base, channel, number }: PublishedVersion) {
  for (let previous = Number(number) - 1; previous >= 0; previous--) {
    const candidate = `${base}-${channel}.${previous}`;
    if (await isPublished(candidate)) return candidate;
  }
  const channels = [channel, ...PRERELEASE_CHANNELS.filter(other => other !== channel)];
  for (const previousBase of previousBases(base)) {
    for (const previousChannel of channels) {
      const last = await findLastPrerelease(previousBase, previousChannel);
      if (last) return last;
    }
  }
  return undefined;
}

async function findLastPrerelease(base: string, channel: Channel): Promise<string | undefined> {
  const candidates = Array.from(
    { length: MAX_PRERELEASES },
    (_, index) => `${base}-${channel}.${index}`,
  );
  const published = await Promise.all(candidates.map(isPublished));
  const last = published.lastIndexOf(true);
  return last >= 0 ? candidates[last] : undefined;
}

async function fetchExpectedChecksum(version: string, artifactName: string): Promise<string> {
  const url = checksumsUrl(version);
  const checksums = await fetchText(url);
  const entry = checksums
    .split("\n")
    .map(line => line.trim().split(/\s+/))
    .find(([, fileName]) => fileName === artifactName);
  if (!entry) throw new Error(`${artifactName} is not listed in ${url}`);
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
 * Downloads, verifies and unpacks a published build once per version under
 * `tests/artifacts/published-builds`, and returns it ready to launch.
 */
export async function installPublishedBuild(version: string): Promise<PublishedBuild> {
  const platform = buildPlatform();
  const unpackedDir = path.join(BUILDS_DIR, version);

  if (!(await exists(unpackedDir))) {
    await mkdir(BUILDS_DIR, { recursive: true });
    const workDir = await mkdtemp(path.join(BUILDS_DIR, `${version}-`));
    try {
      const artifactName = platform.artifactName(version);
      const expectedChecksum = await fetchExpectedChecksum(version, artifactName);
      const artifactPath = path.join(workDir, artifactName);
      const checksum = await download(`${DOWNLOAD_URL}/${artifactName}`, artifactPath);
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

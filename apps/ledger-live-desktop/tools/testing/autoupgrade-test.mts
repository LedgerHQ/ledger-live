import { once } from "events";
import { setTimeout as sleep } from "timers/promises";
import { findFreePort, requestQuit } from "./utils/appInspector.mts";
import { feedBinaryName, platformBuild } from "./utils/builds.mts";
import { parseAutoUpgradeOptions, startAutoUpgrade } from "./utils/startAutoUpgrade.mts";

const pollInterval = 1_000;
const readyTimeout = 180_000;
const installTimeout = 60_000;
// An app that skips the check downloads from the local feed right after fetching the signature.
const downloadTimeout = 15_000;
// A valid download is ready to install a few seconds after it is sent.
const stageTimeout = 15_000;
const quitTimeout = 30_000;

process.on("uncaughtException", error => {
  console.error(error);
  exit(false, error.message);
});

const options = parseAutoUpgradeOptions();
if (options.downloadSpeed) {
  throw new Error(
    "--download-speed is for watching the download with tools/testing/autoupgrade.mts",
  );
}
const startedAt = Date.now();
const served = new Set<string>();
const sentInFull = new Set<string>();

const { base, update, openInstalledApp } = await startAutoUpgrade(options, {
  onServe: file => served.add(file),
  onSent: file => sentInFull.add(file),
});
// quitApp quits the app through the inspector of its main process.
const inspectPort = await findFreePort();
const app = openInstalledApp([`--inspect=127.0.0.1:${inspectPort}`]);
// A run stopped by Ctrl+C or an error must not leave the app running for the next one.
process.on("exit", () => app.kill("SIGKILL"));

const updateBinary = feedBinaryName(update.version);
const signatureFetched = () =>
  [...served].some(file => file.endsWith(`-${update.version}.sha512sum.sig`));
// Also matches the blockmap, which a differential download requests first.
const updateDownloaded = () => [...served].some(file => file.startsWith(updateBinary));

if (!(await isInstalled(base.version))) {
  await quitApp();
  exit(false, `Could not read ${base.version} as the installed version`);
}

console.log(`Waiting for ${base.version} to check the signature of ${update.version}`);
if (!(await waitForApp(signatureFetched, readyTimeout))) {
  exit(false, `${base.version} did not fetch the signature of ${update.version}`);
}

if (options.badSignature) await checkRejection();
else if (options.corruptedUpdate) await checkCorruptedDownload();
else await checkUpgrade();

async function checkUpgrade() {
  console.log(`Waiting for ${base.version} to download ${update.version}`);
  if (!(await waitForApp(isUpdateStaged, readyTimeout))) {
    exit(false, `${update.version} was not ready to install within ${readyTimeout / 1000}s`);
  }

  console.log(`Quitting ${base.version}`);
  await quitApp();

  if (!(await poll(() => isInstalled(update.version), installTimeout))) {
    exit(false, `${base.version} did not upgrade to ${update.version}`);
  }

  exit(true, `${base.version} upgraded to ${update.version}`);
}

async function checkRejection() {
  console.log(`Checking that ${base.version} does not download ${update.version}`);
  if (await waitForApp(updateDownloaded, downloadTimeout)) {
    exit(false, `${base.version} downloaded ${update.version} despite the bad signature`);
  }

  console.log(`Quitting ${base.version}`);
  await quitApp();

  exit(true, `${base.version} did not download ${update.version}, which has a bad signature`);
}

async function checkCorruptedDownload() {
  console.log(`Waiting for ${base.version} to download the corrupted ${update.version}`);
  // A differential download gives up on its range request without reading the response, so only
  // the full download is sent in full.
  if (!(await waitForApp(() => sentInFull.has(updateBinary), readyTimeout))) {
    exit(false, `${base.version} did not download ${update.version}, which is correctly signed`);
  }

  console.log(`Checking that ${base.version} rejects the download`);
  if (await waitForApp(isUpdateStaged, stageTimeout)) {
    exit(false, `${base.version} accepted a corrupted download of ${update.version}`);
  }

  console.log(`Quitting ${base.version}`);
  await quitApp();

  if (!(await isInstalled(base.version))) {
    exit(false, `${base.version} was replaced after downloading a corrupted ${update.version}`);
  }
  exit(true, `${base.version} rejected a corrupted download of ${update.version}`);
}

async function waitForApp(check: () => boolean, timeout: number) {
  const passed = await poll(() => check() || hasExited(), timeout);
  if (hasExited()) {
    exit(
      false,
      `${base.version} quit on its own, did it crash or is another Ledger Wallet running?`,
    );
  }
  return passed;
}

async function poll(check: () => boolean | Promise<boolean>, timeout: number) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return true;
    await sleep(pollInterval);
  }
  return false;
}

function isUpdateStaged() {
  try {
    return platformBuild().isUpdateStaged(startedAt);
  } catch {
    return false;
  }
}

async function isInstalled(version: string) {
  try {
    return await platformBuild().isInstalled(version);
  } catch {
    return false;
  }
}

// On Windows and Linux, the updater installs on quit only when the app exits with code 0.
async function quitApp() {
  if (hasExited()) return;
  const exited = once(app, "exit", { signal: AbortSignal.timeout(quitTimeout) });
  try {
    await requestQuit(inspectPort);
    await exited;
  } catch (error) {
    app.kill("SIGKILL");
    throw new Error("Could not quit the app, killed it", { cause: error });
  }
  if (app.exitCode !== 0) {
    const exitReason = app.signalCode ?? `exit code ${app.exitCode}`;
    throw new Error(`The app quit abnormally, with ${exitReason}`);
  }
}

function hasExited() {
  return app.exitCode !== null || app.signalCode !== null;
}

function exit(passed: boolean, message: string): never {
  if (passed) console.log(`PASS: ${message}`);
  else console.error(`FAIL: ${message}`);
  process.exit(passed ? 0 : 1);
}

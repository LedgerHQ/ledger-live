import { execFile, spawn } from "node:child_process";
import { mkdir, open, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { device, log } from "detox";
import { allure } from "jest-allure2-reporter/api";
import { sanitizeError } from "@ledgerhq/live-e2e-shared/index";

const execFileAsync = promisify(execFile);

const APP_ID_PREFIX = "com.ledger.live";
const COMMAND_TIMEOUT_MS = 15_000;
// log show reads the simulator's whole log store before it filters.
const SIMULATOR_LOG_TIMEOUT_MS = 45_000;
const SIMULATOR_LOG_WINDOW = "5m";
const MAX_OUTPUT_BYTES = 32 * 1024 * 1024;
const IOS_SAMPLE_SECONDS = "3";
const IOS_APP_PROCESS = "ledgerlivemobile";
const ANDROID_ROOT_SHELL = ["shell", "su", "0"];
const ARTIFACTS_DIR = path.join(__dirname, "..", "artifacts");
const SIMULATOR_DIAGNOSTICS_DIR = path.join(ARTIFACTS_DIR, "simulator-diagnostics");

type SimulatorService = { label: string; name: string };
type LaunchdJob = { pid: string; label: string };

// The simulator services that launch, show, suspend and terminate apps for simctl.
const IOS_LAUNCH_SERVICES: SimulatorService[] = [
  { label: "com.apple.SpringBoard", name: "SpringBoard" },
  { label: "com.apple.backboardd", name: "backboardd" },
  { label: "com.apple.runningboardd", name: "runningboardd" },
  { label: "com.apple.CoreSimulator.bridge", name: "CoreSimulatorBridge" },
];

const simulatorsWithDiagnostics = new Set<string>();

async function run(file: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync(file, args, {
    timeout: COMMAND_TIMEOUT_MS,
    maxBuffer: MAX_OUTPUT_BYTES,
  });
  return stdout;
}

async function androidAppPid(serial: string): Promise<string | undefined> {
  const processes = await run("adb", ["-s", serial, "shell", "ps", "-A", "-o", "PID,NAME"]);
  return processes
    .split("\n")
    .map(line => line.trim().split(/\s+/))
    .find(
      ([, name]) =>
        name?.startsWith(APP_ID_PREFIX) && !name.includes(":") && !name.endsWith(".test"),
    )?.[0];
}

const iosLaunchctlList = (udid: string) =>
  run("xcrun", ["simctl", "spawn", udid, "launchctl", "list"]);

/** The running jobs of a `launchctl list` table, whose rows are PID, last exit status and label. */
const runningJobs = (launchctlList: string): LaunchdJob[] =>
  launchctlList
    .split("\n")
    .map(line => line.trim().split(/\s+/))
    .filter(([pid, , label]) => /^\d+$/.test(pid) && label !== undefined)
    .map(([pid, , label]) => ({ pid, label }));

async function iosAppPid(udid: string): Promise<string | undefined> {
  const jobs = runningJobs(await iosLaunchctlList(udid));
  return jobs.find(({ label }) => label.includes(`UIKitApplication:${APP_ID_PREFIX}`))?.pid;
}

async function attachAndroidThreadStacks(serial: string, pid: string) {
  const adbRoot = ["-s", serial, ...ANDROID_ROOT_SHELL];
  await allure.attachment(
    "Native thread stacks",
    await run("adb", [...adbRoot, "debuggerd", "-b", pid]),
    "text/plain",
  );
  await allure.attachment(
    "Java thread stacks",
    await run("adb", [...adbRoot, "debuggerd", "-j", pid]),
    "text/plain",
  );
}

async function attachIosThreadStacks(pid: string) {
  await allure.attachment(
    "Native thread stacks",
    await run("sample", [pid, IOS_SAMPLE_SECONDS]),
    "text/plain",
  );
}

/** Attaches every app thread's stack, to show what a frozen app is blocked on before teardown kills it. */
export async function attachAppThreadStacks(): Promise<void> {
  try {
    const isAndroid = device.getPlatform() === "android";
    const pid = isAndroid ? await androidAppPid(device.id) : await iosAppPid(device.id);
    if (!pid) {
      log.warn("Could not capture app thread stacks: app process not found");
      return;
    }
    if (isAndroid) await attachAndroidThreadStacks(device.id, pid);
    else await attachIosThreadStacks(pid);
  } catch (error) {
    log.warn(`Could not capture app thread stacks: ${sanitizeError(error)}`);
  }
}

async function sampleSimulatorService(
  jobs: LaunchdJob[],
  { label, name }: SimulatorService,
  dir: string,
) {
  const pid = jobs.find(job => job.label === label)?.pid;
  if (!pid) throw new Error(`${name} is not running`);
  await run("sample", [pid, IOS_SAMPLE_SECONDS, "-file", path.join(dir, `${name}.sample.txt`)]);
}

/** Streams to a file: a window that reaches back to the simulator's boot exceeds 10 MB. */
async function saveSimulatorLog(udid: string, dir: string) {
  const processes = [...IOS_LAUNCH_SERVICES.map(({ name }) => name), IOS_APP_PROCESS];
  const predicate = `process IN {${processes.map(name => `"${name}"`).join(", ")}}`;
  const args = ["simctl", "spawn", udid, "log", "show", "--last", SIMULATOR_LOG_WINDOW];
  const output = await open(path.join(dir, "system.log"), "w");
  try {
    await new Promise<void>((resolve, reject) => {
      const logShow = spawn("xcrun", [...args, "--style", "compact", "--predicate", predicate], {
        stdio: ["ignore", output.fd, "ignore"],
        timeout: SIMULATOR_LOG_TIMEOUT_MS,
      });
      logShow.on("error", reject);
      logShow.on("close", (code, signal) =>
        code === 0 ? resolve() : reject(new Error(`log show ended with ${signal ?? code}`)),
      );
    });
  } finally {
    await output.close();
  }
}

/**
 * Saves the stacks and recent log of the iOS services that launch and terminate apps, to show why
 * a simulator stopped doing so. Once per simulator: the first capture shows how a wedge began.
 */
export async function saveSimulatorDiagnostics(): Promise<void> {
  if (device.getPlatform() !== "ios" || simulatorsWithDiagnostics.has(device.id)) return;
  simulatorsWithDiagnostics.add(device.id);
  try {
    const capturedAt = new Date().toISOString().replace(/[:.]/g, "-");
    const dir = path.join(SIMULATOR_DIAGNOSTICS_DIR, `${device.id}-${capturedAt}`);
    await mkdir(dir, { recursive: true });
    const launchctlList = await iosLaunchctlList(device.id);
    await writeFile(path.join(dir, "launchctl-list.txt"), launchctlList);
    const jobs = runningJobs(launchctlList);
    const captures = await Promise.allSettled([
      ...IOS_LAUNCH_SERVICES.map(service => sampleSimulatorService(jobs, service, dir)),
      saveSimulatorLog(device.id, dir),
    ]);
    const failures = captures.flatMap(capture =>
      capture.status === "rejected" ? [sanitizeError(capture.reason)] : [],
    );
    failures.forEach(failure => log.warn(`Could not capture simulator diagnostics: ${failure}`));
    await allure.attachment(
      "Simulator diagnostics",
      [
        `Saved in the mobile test artifacts under ${path.relative(ARTIFACTS_DIR, dir)}`,
        ...failures.map(failure => `Not captured: ${failure}`),
      ].join("\n"),
      "text/plain",
    );
  } catch (error) {
    log.warn(`Could not capture simulator diagnostics: ${sanitizeError(error)}`);
  }
}

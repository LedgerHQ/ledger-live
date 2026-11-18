import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { device, log } from "detox";
import { allure } from "jest-allure2-reporter/api";
import { sanitizeError } from "@ledgerhq/live-e2e-shared/index";

const execFileAsync = promisify(execFile);

const APP_ID_PREFIX = "com.ledger.live";
const COMMAND_TIMEOUT_MS = 15_000;
const MAX_OUTPUT_BYTES = 32 * 1024 * 1024;
const IOS_SAMPLE_SECONDS = "3";
const ANDROID_ROOT_SHELL = ["shell", "su", "0"];

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

async function iosAppPid(udid: string): Promise<string | undefined> {
  const services = await run("xcrun", ["simctl", "spawn", udid, "launchctl", "list"]);
  return services
    .split("\n")
    .filter(line => line.includes(`UIKitApplication:${APP_ID_PREFIX}`))
    .map(line => line.trim().split(/\s+/)[0])
    .find(pid => /^\d+$/.test(pid));
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

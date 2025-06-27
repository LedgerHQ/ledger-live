import { close as closeBridge, findFreePort, init as initBridge } from "../bridge/server";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { exec } from "child_process";
import { device, log } from "detox";
import { allure } from "jest-allure2-reporter/api";
import { Device } from "@ledgerhq/live-common/e2e/enum/Device";
import { detoxSync } from "../utils/detoxSyncManager";

const BASE_DEEPLINK = "ledgerlive://";

export const currencyParam = "?currency=";

/**
 * Waits for a specified amount of time
 * /!\ Do not use it to wait for a specific element, use waitFor instead.
 * @param {number} ms
 */
export async function delay(ms: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve("delay complete");
    }, ms);
  });
}

/** @param path the part after "ledgerlive://", e.g. "portfolio", or "discover?param=123"  */
export async function openDeeplink(path?: string) {
  await device.openURL({ url: BASE_DEEPLINK + path });
}

export const describeIfNotNanoS = (...args: Parameters<typeof describe>) =>
  process.env.SPECULOS_DEVICE !== Device.LNS
    ? describe(...args)
    : describe.skip("[not available on LNS] " + args[0], args[1]);

export function isAndroid() {
  return device.getPlatform() === "android";
}

export function isIos(): boolean {
  return device.getPlatform() === "ios";
}

export function isSpeculosRemote(): boolean {
  return process.env.REMOTE_SPECULOS === "true";
}

export function isRemoteIos(): boolean {
  return isSpeculosRemote() && isIos();
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function addDelayBeforeInteractingWithDevice(
  // TODO: QAA-683
  delayIos: number = 10_000,
  ms: number = 0,
) {
  await delay(isSpeculosRemote() && isIos() ? delayIos : ms);
}

export async function launchApp() {
  const port = await findFreePort();
  closeBridge();
  initBridge(port);
  await device.launchApp({
    launchArgs: {
      wsPort: port,
      detoxURLBlacklistRegex:
        '\\(".*sdk.*.braze.*",".*.googleapis.com/.*",".*clients3.google.com.*",".*tron.coin.ledger.com/wallet/getBrokerage.*"\\)',
      mock: "0",
      disable_broadcast: getEnv("DISABLE_TRANSACTION_BROADCAST") ? 1 : 0,
      IS_TEST: true,
    },
    languageAndLocale: {
      language: "en-US",
      locale: "en-US",
    },
    permissions: {
      camera: "YES",
    },
  });
  return port;
}

export function setupEnvironment() {
  setEnv("DISABLE_APP_VERSION_REQUIREMENTS", true);
  setEnv("MOCK", "");
  process.env.MOCK = "";
  setEnv("DETOX", "1");
  process.env.SPECULOS_DEVICE = process.env.SPECULOS_DEVICE || Device.LNSP;

  const disableBroadcastEnv = process.env.DISABLE_TRANSACTION_BROADCAST;
  const shouldBroadcast = disableBroadcastEnv === "0";
  setEnv("DISABLE_TRANSACTION_BROADCAST", !shouldBroadcast);
}

export const logMemoryUsage = async (): Promise<void> => {
  const pid = process.pid;
  const isLinux = process.platform !== "darwin";
  const topArgs = isLinux ? `-b -n 1 -p ${pid}` : `-l 1 -pid ${pid}`;
  exec(
    `top ${topArgs} | grep "${pid}" | awk '{print ${isLinux ? "$6" : "$8"}}'`,
    async (error: Error | null, stdout: string, stderr: string): Promise<void> => {
      if (error || stderr) {
        log.error(`Error getting memory usage:\n Error: ${error}\n Stderr: ${stderr}`);
        return;
      }
      const logMessage = `📦 Detox Memory Usage: ${stdout.trim()}`;
      await allure.attachment("Memory Usage Details", logMessage, "text/plain");
      log.warn(logMessage);
    },
  );
};

/**
 * Waits for the app to become responsive after device interactions
 * This is a better alternative to hard delays
 */
export async function waitForAppResponsiveness(
  maxAttempts: number = 10,
  intervalMs: number = 2000,
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Try a simple interaction to test responsiveness
      const testElement = element(by.id("NavigationHeaderCloseButton")).atIndex(0);

      // Quick visibility check - if this succeeds, app is responsive
      await waitFor(testElement).toBeVisible().withTimeout(1000);
      log.info(`✅ App is responsive (attempt ${attempt}/${maxAttempts})`);
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        log.warn(`⚠️ App still unresponsive after ${maxAttempts} attempts`);
        // Fallback to a shorter delay
        await delay(5000);
        return;
      }

      log.info(`🔄 App unresponsive, waiting ${intervalMs}ms (attempt ${attempt}/${maxAttempts})`);
      await delay(intervalMs);
    }
  }
}

/**
 * Enhanced device action completion waiter with DetoxSync integration
 * Combines loading state check with responsiveness verification and sync management
 */
export async function waitForDeviceActionCompletion(
  loadingElementId: string,
  maxWaitMs: number = 60000,
): Promise<void> {
  const startTime = Date.now();

  try {
    // Set sync state to busy during device action
    await detoxSync.setState("busy");

    // First, wait for the loading element to disappear
    await waitFor(element(by.id(loadingElementId)))
      .not.toBeVisible()
      .withTimeout(maxWaitMs);

    log.info("✅ Device action loading completed");

    // Then verify app responsiveness
    await waitForAppResponsiveness();
  } catch (error) {
    const elapsed = Date.now() - startTime;
    log.warn(`⚠️ Device action completion timeout after ${elapsed}ms`);

    // Fallback: still check responsiveness
    await waitForAppResponsiveness(5, 1000);
  } finally {
    // Always reset sync state to idle when done
    await detoxSync.setState("idle");
  }
}

/**
 * Enhanced device streaming completion waiter with DetoxSync integration
 * Handles the specific case of device streaming with progress percentages
 */
export async function waitForDeviceStreamingCompletion(
  maxWaitMs: number = 120000, // 2 minutes for streaming
  progressCheckInterval: number = 3000,
): Promise<void> {
  const startTime = Date.now();
  log.info("🔄 Waiting for device streaming to complete...");

  try {
    // Set sync state to streaming
    await detoxSync.setState("streaming");

    while (Date.now() - startTime < maxWaitMs) {
      try {
        // Check if streaming progress text is still visible
        const progressElement = element(by.text(/Loading\.\.\.\s*\(\d+%\)/));
        const isProgressVisible = await progressElement.getAttributes().then(
          () => true,
          () => false,
        );

        if (!isProgressVisible) {
          log.info("✅ Device streaming completed");
          await waitForAppResponsiveness();
          return;
        }

        // Log current progress if visible
        try {
          const progressText = await element(by.text(/Loading\.\.\.\s*\(\d+%\)/)).getAttributes();
          log.info(`📊 Device streaming in progress: ${progressText}`);
        } catch {
          // Progress text might have changed, continue checking
        }

        await delay(progressCheckInterval);
      } catch (error) {
        // Element might not be found, which could mean streaming is done
        log.info("✅ Device streaming element not found - likely completed");
        await waitForAppResponsiveness();
        return;
      }
    }

    const elapsed = Date.now() - startTime;
    log.warn(`⚠️ Device streaming timeout after ${elapsed}ms`);
    await waitForAppResponsiveness(3, 2000);
  } finally {
    // Always reset sync state to idle when done
    await detoxSync.setState("idle");
  }
}

/**
 * Combined device action and streaming completion waiter with DetoxSync
 * Handles both regular loading states and streaming progress with proper sync management
 */
export async function waitForCompleteDeviceAction(
  loadingElementId: string,
  maxWaitMs: number = 120000,
): Promise<void> {
  const startTime = Date.now();
  log.info("🔄 Waiting for complete device action (loading + streaming)...");

  try {
    // Start with busy state
    await detoxSync.setState("busy");

    // First, try to wait for regular loading to complete
    await waitForDeviceActionCompletion(loadingElementId, Math.min(maxWaitMs, 60000));

    // Then check for streaming progress
    const remainingTime = maxWaitMs - (Date.now() - startTime);
    if (remainingTime > 5000) {
      await waitForDeviceStreamingCompletion(remainingTime);
    }

    log.info("✅ Complete device action finished");
  } catch (error) {
    const elapsed = Date.now() - startTime;
    log.warn(`⚠️ Complete device action timeout after ${elapsed}ms`);

    // Final responsiveness check
    await waitForAppResponsiveness(3, 1000);
  } finally {
    // Ensure sync is always reset to idle
    await detoxSync.reset();
  }
}

/**
 * Swap-specific device action waiter with enhanced DetoxSync management
 * Tailored for swap operations with streaming progress and device confirmations
 */
export async function waitForSwapDeviceAction(
  options: {
    loadingElementId?: string;
    maxWaitMs?: number;
    expectStreaming?: boolean;
    streamingTimeout?: number;
  } = {},
): Promise<void> {
  const {
    loadingElementId = "device-action-loading",
    maxWaitMs = 120000,
    expectStreaming = true,
    streamingTimeout = 90000,
  } = options;

  const startTime = Date.now();
  log.info("🔄 Starting swap device action with DetoxSync management");

  try {
    // Set initial sync state for swap
    await detoxSync.setState("busy");
    log.info(`📊 DetoxSync state: ${detoxSync.getState()}`);

    // Phase 1: Wait for initial loading to complete
    log.info("📋 Phase 1: Waiting for swap preparation...");
    await waitFor(element(by.id(loadingElementId)))
      .not.toBeVisible()
      .withTimeout(Math.min(maxWaitMs, 30000));

    // Phase 2: Handle streaming if expected
    if (expectStreaming) {
      log.info("📋 Phase 2: Checking for device streaming...");
      await detoxSync.setState("streaming");

      const remainingTime = Math.min(streamingTimeout, maxWaitMs - (Date.now() - startTime));
      await waitForDeviceStreamingCompletion(remainingTime);
    }

    // Phase 3: Final responsiveness check
    log.info("📋 Phase 3: Verifying app responsiveness...");
    await waitForAppResponsiveness();

    const elapsed = Date.now() - startTime;
    log.info(`✅ Swap device action completed in ${elapsed}ms`);
  } catch (error) {
    const elapsed = Date.now() - startTime;
    log.warn(`⚠️ Swap device action failed after ${elapsed}ms:`, error);

    // Emergency responsiveness recovery
    await waitForAppResponsiveness(3, 1000);
    throw error;
  } finally {
    // Always ensure sync is reset
    await detoxSync.reset();
    log.info(`📊 DetoxSync final state: ${detoxSync.getState()}`);
  }
}

import "@shared/env";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import {
  cleanupAllSpeculos,
  attachSpeculinhoLogsToAllure,
  takeSpeculosScreenshot,
} from "@e2e/utils/speculosUtils";
import {
  attachTestExecutionConsoleToAllure,
  attachFailureLogsToAllure,
  attachSpeculosStartupErrorToAllure,
  resetStderrCaptureForCurrentTest,
  installConsoleCapture,
  uninstallConsoleCapture,
} from "@e2e/utils/loggingUtils";
import { allure } from "jest-allure2-reporter/api";
import type { OptionalFeatureMap } from "@shared/feature-flags";
import { BRIDGE_RESPONSE_TIMEOUT, getLogs } from "@e2e/bridge/server";
import { Circus } from "@jest/types";
import {
  logMemoryUsage,
  takeAppScreenshot,
  captureNativeViewHierarchy,
  setupEnvironment,
} from "@e2e/helpers/commonHelpers";
import { config as detoxConfig, session as detoxSession } from "detox/internals";
import { Subject } from "rxjs";
import { sanitizeError } from "@ledgerhq/live-e2e-shared/index";
import { isBroadcastLockDeferralPass } from "@ledgerhq/live-e2e-shared/broadcastLock/deferralPasses";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { Delegate } from "@ledgerhq/live-e2e-shared/models/Delegate";
import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { Fee } from "@ledgerhq/live-e2e-shared/enum/Fee";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { Swap } from "@ledgerhq/live-e2e-shared/models/Swap";
import { CLI } from "@e2e/utils/cliUtils";
import * as cliCommandsUtils from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import {
  NativeElementHelpers,
  WebElementHelpers,
  isUnansweredDetoxRequestError,
} from "@e2e/helpers/elementHelpers";
import expect from "expect";
import { Application } from "@e2e/page/index";
import type { ServerData } from "~/e2e/bridge/types";

// @ts-expect-error detox doesn't provide type declarations for this module
import DetoxEnvironment from "detox/runners/jest/testEnvironment";
import { withTimeout } from "@e2e/utils/withTimeout";
import { armWorkerWatchdog, setWatchdogState, watchdogPhase } from "@e2e/helpers/workerWatchdog";
import {
  BROADCAST_DEFERRALS_DIR,
  BROADCAST_LOCK_WAITS_DIR,
  deferralMarkerName,
  SPEC_BROADCAST_LOCK,
  type SpecBroadcastLock,
} from "@e2e/utils/broadcastDeferrals";

const FAST_DIAGNOSTIC_TIMEOUT_MS = 5_000;
const SLOW_DIAGNOSTIC_TIMEOUT_MS = 15_000;
// getLogs is already capped by the bridge's own response timeout; this outer bound is
// defense-in-depth for a wedged worker where that inner timer is starved, so it must stay larger.
const GET_LOGS_TIMEOUT_MS = BRIDGE_RESPONSE_TIMEOUT + 2_000;

// Set by the patched Detox retry (patches/detox@20.51.3.patch) to the exact full names of the
// tests that failed in the previous attempt.
const retryTestNames = process.env.E2E_RETRY_TEST_NAMES
  ? new Set<string>(JSON.parse(process.env.E2E_RETRY_TEST_NAMES))
  : undefined;

// Unlike E2E_RETRY_TEST_NAMES, also set when Detox retries whole files.
const isDetoxRetry = () => (detoxSession.testSessionIndex ?? 0) > 0;

/**
 * Mark every test that is not in `names` (so passed in the previous attempt) as skipped.
 * Skipped tests write no Allure result, so the previous attempt's verdict remains.
 *
 * A block that keeps nothing is skipped as a block: jest-circus gates beforeAll/afterAll on the
 * block's own mode, so marking only its tests still runs every unrelated block's setup.
 */
const skipToRetrySet = (
  block: Circus.DescribeBlock,
  names: Set<string>,
  path: string[] = [],
): number => {
  let kept = 0;
  for (const child of block.children) {
    if (child.type === "describeBlock") {
      const keptInBlock = skipToRetrySet(child, names, [...path, child.name]);
      if (keptInBlock === 0) child.mode = "skip";
      kept += keptInBlock;
      // Mirrors jest-circus getTestID: the names path minus the root block, space-joined.
    } else if (names.has([...path, child.name].join(" "))) {
      kept++;
    } else {
      child.mode = "skip";
    }
  }
  return kept;
};

const JEST_TIMEOUT_PATTERN = /Exceeded timeout of .+ for a (test|hook)/;

/**
 * A Jest timeout leaves the test body running, and an unanswered Detox request stays in flight.
 * Either way the next atomic Detox call (disableSynchronization) makes Detox reject what is in
 * flight, which resumes the body and reports its next action's error instead of the real failure.
 */
function failureLeavesDetoxBusy(failure: unknown): boolean {
  const message = failure instanceof Error ? failure.message : String(failure);
  return JEST_TIMEOUT_PATTERN.test(message) || isUnansweredDetoxRequestError(failure);
}

const skipWholeFile = (root: Circus.DescribeBlock) => skipToRetrySet(root, new Set());

const hasEnabledTest = (block: Circus.DescribeBlock): boolean =>
  block.mode !== "skip" &&
  block.children.some(child =>
    child.type === "describeBlock"
      ? hasEnabledTest(child)
      : child.mode !== "skip" && child.mode !== "todo",
  );

const isSpecBroadcastLock = (value: unknown): value is SpecBroadcastLock =>
  typeof value === "object" &&
  value !== null &&
  "tryLock" in value &&
  "release" in value &&
  "takeWaitedMs" in value;

async function captureFailureDiagnostics(
  mergedFeatureFlags: OptionalFeatureMap | undefined,
  failure: unknown,
): Promise<void> {
  await withTimeout(takeSpeculosScreenshot(), FAST_DIAGNOSTIC_TIMEOUT_MS, "takeSpeculosScreenshot");
  await withTimeout(
    attachSpeculinhoLogsToAllure(),
    SLOW_DIAGNOSTIC_TIMEOUT_MS,
    "attachSpeculinhoLogsToAllure",
  );
  await withTimeout(
    takeAppScreenshot("Test Failure"),
    FAST_DIAGNOSTIC_TIMEOUT_MS,
    "takeAppScreenshot",
  );
  await withTimeout(
    attachTestExecutionConsoleToAllure(),
    FAST_DIAGNOSTIC_TIMEOUT_MS,
    "attachTestExecutionConsoleToAllure",
  );
  await withTimeout(
    attachSpeculosStartupErrorToAllure(),
    FAST_DIAGNOSTIC_TIMEOUT_MS,
    "attachSpeculosStartupErrorToAllure",
  );
  if (mergedFeatureFlags) {
    await withTimeout(
      allure.attachment(
        "Merged Feature Flags",
        JSON.stringify(mergedFeatureFlags, null, 2),
        "application/json",
      ),
      FAST_DIAGNOSTIC_TIMEOUT_MS,
      "attachMergedFeatureFlags",
    );
  }
  let logs = await withTimeout(getLogs(), GET_LOGS_TIMEOUT_MS, "getLogs");
  if (logs)
    await withTimeout(
      attachFailureLogsToAllure(logs),
      SLOW_DIAGNOSTIC_TIMEOUT_MS,
      "attachFailureLogsToAllure",
    );
  logs = "";

  if (failureLeavesDetoxBusy(failure)) {
    console.info("Skipping native view hierarchy capture: Detox may still be busy with the test");
  } else {
    await withTimeout(
      captureNativeViewHierarchy(),
      SLOW_DIAGNOSTIC_TIMEOUT_MS,
      "captureNativeViewHierarchy",
    );
  }
  console.info("Failure diagnostics capture completed");
}

// Jest's afterAll/teardown hooks are skipped when the worker dies from a signal (CI timeout, manual SIGINT, uncaught exception).
//  Without this, remote Speculos pods leak because nothing ever DELETEs them.
let speculosTerminationHandlersInstalled = false;
function installSpeculosTerminationHandlers() {
  if (speculosTerminationHandlersInstalled) return;
  speculosTerminationHandlersInstalled = true;

  let cleaning = false;
  const releaseAndExit = async (reason: string, exitCode: number) => {
    if (cleaning) return;
    cleaning = true;
    try {
      await withTimeout(
        cleanupAllSpeculos(),
        SLOW_DIAGNOSTIC_TIMEOUT_MS,
        `cleanupAllSpeculos(${reason})`,
      );
    } catch (error) {
      console.info(`Speculos cleanup on ${reason} failed:`, sanitizeError(error));
    } finally {
      process.exit(exitCode);
    }
  };

  process.on("SIGINT", () => void releaseAndExit("SIGINT", 130));
  process.on("SIGTERM", () => void releaseAndExit("SIGTERM", 143));
  process.on("uncaughtException", error => {
    console.error("uncaughtException — releasing Speculos:", sanitizeError(error));
    void releaseAndExit("uncaughtException", 1);
  });
  process.on("unhandledRejection", reason => {
    console.error("unhandledRejection — releasing Speculos:", sanitizeError(reason));
    void releaseAndExit("unhandledRejection", 1);
  });
}

export default class TestEnvironment extends DetoxEnvironment {
  declare global: typeof globalThis;
  declare readonly testPath: string;
  private deferred = false;

  async setup() {
    await armWorkerWatchdog();
    setWatchdogState({ spec: this.testPath, phase: "environment setup" });

    const workerId = Number(process.env.JEST_WORKER_ID ?? "1");
    if (workerId > 1) this.setupDeviceForSecondaryWorker(workerId);
    await super.setup();

    setupEnvironment();
    installSpeculosTerminationHandlers();

    const speculosDevicesMap = new Map<string, number>();
    const webSocketObj = {
      wss: undefined,
      ws: undefined,
      messages: {},
      e2eBridgeServer: new Subject<ServerData>(),
    };
    const pendingCallbacksMap = new Map<string, { callback: (data: string) => void }>();
    const appInstance = new Application();

    this.global.app = appInstance;
    this.global.IS_FAILED = false;
    this.global.mergedFeatureFlags = undefined;
    this.global.speculosDevices = speculosDevicesMap;
    this.global.webSocket = webSocketObj;
    this.global.pendingCallbacks = pendingCallbacksMap;

    globalThis.app = appInstance;
    globalThis.IS_FAILED = false;
    globalThis.speculosDevices = speculosDevicesMap;
    globalThis.webSocket = webSocketObj;
    globalThis.pendingCallbacks = pendingCallbacksMap;

    const enums = {
      Account,
      AppInfos,
      CLI,
      Currency,
      Delegate,
      detoxExpect: NativeElementHelpers.expect,
      Fee,
      jestExpect: expect,
      Swap,
      TokenAccount,
      Transaction,
    };

    const nativeHelpers = {
      clearTextByElement: NativeElementHelpers.clearTextByElement,
      countElements: NativeElementHelpers.countElements,
      countElementsById: NativeElementHelpers.countElementsById,
      getAttributesOfElement: NativeElementHelpers.getAttributesOfElement,
      getElementById: NativeElementHelpers.getElementById,
      getElementByIdAndText: NativeElementHelpers.getElementByIdAndText,
      getElementByIdWithAncestorIds: NativeElementHelpers.getElementByIdWithAncestorIds,
      getElementByIdWithDescendantTexts: NativeElementHelpers.getElementByIdWithDescendantTexts,
      getElementByText: NativeElementHelpers.getElementByText,
      getElementsById: NativeElementHelpers.getElementsById,
      getIdByRegexp: NativeElementHelpers.getIdByRegexp,
      getIdOfElement: NativeElementHelpers.getIdOfElement,
      getTextOfElement: NativeElementHelpers.getTextOfElement,
      getLabelOfElement: NativeElementHelpers.getLabelOfElement,
      IsIdPresent: NativeElementHelpers.isIdPresent,
      IsIdVisible: NativeElementHelpers.isIdVisible,
      revealForTap: NativeElementHelpers.revealForTap,
      scrollByPixels: NativeElementHelpers.scrollByPixels,
      scrollToId: NativeElementHelpers.scrollToId,
      scrollToText: NativeElementHelpers.scrollToText,
      tapByElement: NativeElementHelpers.tapByElement,
      tapById: NativeElementHelpers.tapById,
      tapByIdAndExpectToDisappear: NativeElementHelpers.tapByIdAndExpectToDisappear,
      tapByText: NativeElementHelpers.tapByText,
      typeTextByElement: NativeElementHelpers.typeTextByElement,
      typeTextById: NativeElementHelpers.typeTextById,
      waitForElement: NativeElementHelpers.waitForElement,
      waitForElementById: NativeElementHelpers.waitForElementById,
      waitForElementByText: NativeElementHelpers.waitForElementByText,
      waitForFullyVisibleById: NativeElementHelpers.waitForFullyVisibleById,
      waitForElementNotVisible: NativeElementHelpers.waitForElementNotVisible,
    };

    const webHelpers = {
      expectWebElementNotVisible: WebElementHelpers.expectWebElementNotVisible,
      getCurrentWebviewUrl: WebElementHelpers.getCurrentWebviewUrl,
      getValueByWebTestId: WebElementHelpers.getValueByWebTestId,
      getWebElementByCssSelector: WebElementHelpers.getWebElementByCssSelector,
      getWebElementById: WebElementHelpers.getWebElementById,
      getWebElementByTag: WebElementHelpers.getWebElementByTag,
      getWebElementByTestId: WebElementHelpers.getWebElementByTestId,
      getWebElementByXpath: WebElementHelpers.getWebElementByXpath,
      getWebElementsByIdAndText: WebElementHelpers.getWebElementsByIdAndText,
      getWebElementsText: WebElementHelpers.getWebElementsText,
      getWebElementText: WebElementHelpers.getWebElementText,
      isWebElementPresent: WebElementHelpers.isWebElementPresent,
      scrollToWebElement: WebElementHelpers.scrollToWebElement,
      tapWebElementByElement: WebElementHelpers.tapWebElementByElement,
      tapWebElementByTestId: WebElementHelpers.tapWebElementByTestId,
      typeTextByWebTestId: WebElementHelpers.typeTextByWebTestId,
      waitForCurrentWebviewUrlToContain: WebElementHelpers.waitForCurrentWebviewUrlToContain,
      waitForWebviewContentToRender: WebElementHelpers.waitForWebviewContentToRender,
      waitForWebElementToBeEnabled: WebElementHelpers.waitForWebElementToBeEnabled,
      waitForWebElementToMatchRegex: WebElementHelpers.waitForWebElementToMatchRegex,
      waitWebElement: WebElementHelpers.waitWebElement,
      waitWebElementByTestId: WebElementHelpers.waitWebElementByTestId,
    };

    Object.assign(this.global, enums);
    Object.assign(this.global, nativeHelpers);
    Object.assign(this.global, webHelpers);
    Object.assign(this.global, cliCommandsUtils);

    Object.assign(globalThis, enums);
    Object.assign(globalThis, nativeHelpers);
    Object.assign(globalThis, webHelpers);
    Object.assign(globalThis, cliCommandsUtils);
  }

  private setupDeviceForSecondaryWorker(workerId: number) {
    const configName = process.env.DETOX_CONFIGURATION;
    if (!configName) throw new Error("Missing DETOX_CONFIGURATION environment variable");

    const detoxConfigFile = require("./detox.config.js");
    const targetConfig = detoxConfigFile.configurations[configName];

    const deviceName = `${targetConfig.device}${workerId}`;
    const targetDevice = detoxConfigFile.devices[deviceName];

    if (!targetDevice) {
      throw new Error(
        `Device configuration not found for ${deviceName}, check your detox config file`,
      );
    }

    Object.assign(detoxConfig, { device: targetDevice });
  }

  async teardown() {
    setWatchdogState({ phase: "teardown" });

    try {
      await withTimeout(cleanupAllSpeculos(), SLOW_DIAGNOSTIC_TIMEOUT_MS, "cleanupAllSpeculos");
    } catch (error) {
      console.info("Speculos cleanup on teardown failed:", sanitizeError(error));
    }

    try {
      uninstallConsoleCapture();
      if (this.global.webSocket?.wss) {
        this.global.webSocket.wss.close();
        this.global.webSocket.wss = undefined;
      }
      if (this.global.webSocket?.ws && this.global.webSocket.ws.readyState !== 3) {
        this.global.webSocket.ws.close();
        this.global.webSocket.ws = undefined;
      }

      if (this.global.webSocket?.e2eBridgeServer && !this.global.webSocket.e2eBridgeServer.closed) {
        this.global.webSocket.e2eBridgeServer.complete();
      }

      try {
        const { DeviceManagementKitTransportSpeculos } =
          await import("@ledgerhq/live-dmk-speculos");
        await DeviceManagementKitTransportSpeculos.disconnectAll();
      } catch {
        // Ignore cleanup errors
      }

      global.gc?.();
    } catch (error) {
      console.info("Error during environment teardown :", sanitizeError(error));
    }

    await super.teardown();
    setWatchdogState({ spec: "<idle>", phase: "idle" });
  }

  private specBroadcastLock(): SpecBroadcastLock | undefined {
    const specLock: unknown = Reflect.get(this.global, SPEC_BROADCAST_LOCK);
    return isSpecBroadcastLock(specLock) ? specLock : undefined;
  }

  private specMarker(dir: string) {
    // Detox makes testPath relative to the worker's cwd; markers are looked up by absolute path.
    const specPath = resolve(this.testPath);
    return { specPath, path: join(__dirname, dir, deferralMarkerName(specPath)) };
  }

  /** Skips the whole file, before the app starts, when its broadcast accounts are busy. */
  private async deferIfBroadcastAccountsBusy(state: Circus.State): Promise<boolean> {
    const specLock = this.specBroadcastLock();
    if (!specLock || !hasEnabledTest(state.rootDescribeBlock)) return false;
    try {
      if ((await specLock.tryLock()) !== "busy") return false;
    } catch (error) {
      console.warn(`[broadcastLock] could not check the spec's accounts: ${sanitizeError(error)}`);
      return false;
    }
    skipWholeFile(state.rootDescribeBlock);
    const marker = this.specMarker(BROADCAST_DEFERRALS_DIR);
    await mkdir(dirname(marker.path), { recursive: true });
    await writeFile(marker.path, marker.specPath);
    console.warn(
      `[broadcastLock] ${basename(this.testPath)} moved to a later pass: its broadcast accounts are busy`,
    );
    return true;
  }

  /** Only the first attempt is timed: Detox retries write no results. */
  private async recordBroadcastLockWait() {
    const waitedMs = this.specBroadcastLock()?.takeWaitedMs() ?? 0;
    if (isDetoxRetry() || this.deferred || waitedMs === 0) return;
    const marker = this.specMarker(BROADCAST_LOCK_WAITS_DIR);
    await mkdir(dirname(marker.path), { recursive: true });
    await writeFile(marker.path, JSON.stringify({ spec: marker.specPath, waitedMs }));
  }

  async handleTestEvent(event: Circus.Event, state: Circus.State) {
    const phase = watchdogPhase(event, state);
    if (phase) setWatchdogState({ phase });

    if (event.name === "hook_failure") {
      this.global.IS_FAILED = true;
      await captureFailureDiagnostics(this.global.mergedFeatureFlags, event.error);
    }

    await super.handleTestEvent(event, state);

    if (event.name === "test_fn_failure") {
      this.global.IS_FAILED = true;
      await captureFailureDiagnostics(this.global.mergedFeatureFlags, event.error);
    }

    if (event.name === "run_start") await this.onRunStart(state);
    if (event.name === "run_finish") await this.onRunFinish();
  }

  private async onRunStart(state: Circus.State) {
    this.specBroadcastLock()?.takeWaitedMs();
    this.deferred =
      !isDetoxRetry() &&
      isBroadcastLockDeferralPass() &&
      (await this.deferIfBroadcastAccountsBusy(state));
    // A marker left by an earlier attempt of this file in the same Detox run must not outlive it.
    if (!this.deferred) await rm(this.specMarker(BROADCAST_DEFERRALS_DIR).path, { force: true });
    if (retryTestNames) {
      const kept = skipToRetrySet(state.rootDescribeBlock, retryTestNames);
      // Detox only retries spec files that failed, and narrowing is all-or-nothing, so every
      // retried file contributed at least one name. Matching none means the names and the tree
      // disagree — fail loudly rather than skip the whole file and report a green pass.
      if (kept === 0) {
        throw new Error(
          `E2E_RETRY_TEST_NAMES matched no test in this file, so the retry would run nothing. ` +
            `Expected one of: ${[...retryTestNames].join(" | ")}`,
        );
      }
    }
    resetStderrCaptureForCurrentTest();
    installConsoleCapture();
    await logMemoryUsage();
  }

  private async onRunFinish() {
    try {
      await this.specBroadcastLock()?.release();
    } catch (error) {
      console.warn(`[broadcastLock] ${sanitizeError(error)}`);
    }
    try {
      await this.recordBroadcastLockWait();
    } catch (error) {
      console.warn(`[broadcastLock] could not record the lock wait: ${sanitizeError(error)}`);
    }
  }
}

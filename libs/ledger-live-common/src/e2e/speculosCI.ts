import axios from "axios";
import {
  conventionalAppSubpath,
  DeviceParams,
  reverseModelMap,
} from "@ledgerhq/speculos-transport";
import { SpeculosDevice } from "./speculos";
import https from "https";
import fs from "fs";
import path from "path";
import { sanitizeError } from "./index";

const { GITHUB_TOKEN, SPECULOS_IMAGE_TAG } = process.env;
const GIT_API_URL = "https://api.github.com/repos/LedgerHQ/actions/actions/";
const START_WORKFLOW_ID = "workflows/161487603/dispatches";
const STOP_WORKFLOW_ID = "workflows/161487604/dispatches";
const GITHUB_REF = "main";
const getSpeculosAddress = (runId: string) => `https://${runId}.speculos.aws.stg.ldg-tech.com`;
const speculosPort = 443;

// ============================================================================
// SPECULOS CI MONITORING
// ============================================================================

type SpeculosOperation = {
  type: "create" | "release";
  runId: string;
  appName?: string;
  appVersion?: string;
  timestamp: string;
  status: "success" | "failed" | "pending";
  error?: string;
  caller?: string;
  testName?: string;
  testFile?: string;
};

const speculosOperations: SpeculosOperation[] = [];

function getCallerInfo(): string {
  const stack = new Error().stack;
  if (!stack) return "unknown";

  const lines = stack.split("\n");
  // Skip first 3 lines (Error, getCallerInfo, logOperation/create/release)
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i];
    // Skip internal node_modules and this file
    if (
      line.includes("speculosCI") ||
      line.includes("node_modules") ||
      line.includes("node:internal")
    ) {
      continue;
    }
    // Extract file:line from the stack trace
    const match = line.match(/at\s+(?:.*?\s+)?\(?(.+?):(\d+):(\d+)\)?/);
    if (match) {
      const [, file, lineNum] = match;
      const fileName = file.split("/").slice(-2).join("/");
      return `${fileName}:${lineNum}`;
    }
  }
  return "unknown";
}

type ExpectState = { currentTestName?: string; testPath?: string };
type ExpectWithState = { getState?: () => ExpectState };

function getTestInfo(): { testName?: string; testFile?: string } {
  try {
    // Try to get Jest's expect state which contains current test info
    // This works in Jest test environments
    const jestExpect = (globalThis as Record<string, unknown>).jestExpect as
      | ExpectWithState
      | undefined;
    if (jestExpect?.getState) {
      const state = jestExpect.getState();
      return {
        testName: state.currentTestName,
        testFile: state.testPath?.split("/").slice(-1)[0],
      };
    }

    // Alternative: try global expect
    const globalExpect = (globalThis as Record<string, unknown>).expect as
      | ExpectWithState
      | undefined;
    if (globalExpect?.getState) {
      const state = globalExpect.getState();
      return {
        testName: state.currentTestName,
        testFile: state.testPath?.split("/").slice(-1)[0],
      };
    }

    // Fallback: check for JEST environment variables
    const testPath = process.env.JEST_WORKER_ID
      ? "Jest Worker " + process.env.JEST_WORKER_ID
      : undefined;
    return { testFile: testPath };
  } catch {
    return {};
  }
}

function logOperation(operation: SpeculosOperation, updateExisting = false): void {
  if (updateExisting) {
    // Find and update existing pending operation
    const existingOp = speculosOperations.find(
      op => op.runId === operation.runId && op.type === operation.type && op.status === "pending",
    );
    if (existingOp) {
      existingOp.status = operation.status;
      existingOp.error = operation.error;
      existingOp.timestamp = operation.timestamp;
    }
  } else {
    speculosOperations.push(operation);
  }

  const emoji = operation.type === "create" ? "🚀" : "🛑";
  const statusEmoji =
    operation.status === "success" ? "✅" : operation.status === "failed" ? "❌" : "⏳";

  const details = operation.appName
    ? `${operation.appName}${operation.appVersion ? `:${operation.appVersion}` : ""}`
    : "";

  const testInfo = operation.testName
    ? `test: ${operation.testName}`
    : operation.testFile
      ? `file: ${operation.testFile}`
      : "";

  // eslint-disable-next-line no-console
  console.log(
    `[SpeculosCI] ${emoji} ${operation.type.toUpperCase()} ${statusEmoji} | ` +
      `runId: ${operation.runId} | ${details ? `app: ${details} | ` : ""}` +
      `${testInfo ? `${testInfo} | ` : ""}` +
      `caller: ${operation.caller} | time: ${operation.timestamp}` +
      `${operation.error ? ` | error: ${operation.error}` : ""}`,
  );
}

/**
 * Get all Speculos CI operations that occurred during this execution
 */
export function getSpeculosOperations(): SpeculosOperation[] {
  return [...speculosOperations];
}

type PendingCleanupInfo = {
  runId: string;
  appName?: string;
  testName?: string;
  testFile?: string;
  createdAt: string;
};

/**
 * Get a summary of Speculos CI operations
 */
export function getSpeculosOperationsSummary(): {
  total: number;
  created: number;
  released: number;
  createdSuccessful: number;
  createdFailed: number;
  releasedSuccessful: number;
  releasedFailed: number;
  pendingCleanup: PendingCleanupInfo[];
} {
  const created = speculosOperations.filter(op => op.type === "create");
  const released = speculosOperations.filter(op => op.type === "release");

  const createdIds = new Set(created.map(op => op.runId));
  const releasedIds = new Set(released.map(op => op.runId));

  const pendingCleanupIds = [...createdIds].filter(id => !releasedIds.has(id));

  // Get detailed info for pending cleanup instances
  const pendingCleanup: PendingCleanupInfo[] = pendingCleanupIds.map(runId => {
    const createOp = created.find(op => op.runId === runId);
    return {
      runId,
      appName: createOp?.appName,
      testName: createOp?.testName,
      testFile: createOp?.testFile,
      createdAt: createOp?.timestamp || "unknown",
    };
  });

  return {
    total: speculosOperations.length,
    created: created.length,
    released: released.length,
    createdSuccessful: created.filter(op => op.status === "success").length,
    createdFailed: created.filter(op => op.status === "failed").length,
    releasedSuccessful: released.filter(op => op.status === "success").length,
    releasedFailed: released.filter(op => op.status === "failed").length,
    pendingCleanup,
  };
}

/**
 * Print a summary of all Speculos CI operations
 */
export function printSpeculosOperationsSummary(): void {
  const summary = getSpeculosOperationsSummary();

  /* eslint-disable no-console */
  console.log("\n" + "=".repeat(70));
  console.log("[SpeculosCI] EXECUTION SUMMARY");
  console.log("=".repeat(70));
  console.log(`Total operations: ${summary.total}`);
  console.log(
    `  Created:  ${summary.created} (success: ${summary.createdSuccessful}, failed: ${summary.createdFailed})`,
  );
  console.log(
    `  Released: ${summary.released} (success: ${summary.releasedSuccessful}, failed: ${summary.releasedFailed})`,
  );

  if (summary.pendingCleanup.length > 0) {
    console.log("\n⚠️  WARNING: The following Speculos instances may not have been cleaned up:");
    summary.pendingCleanup.forEach(info => {
      const testInfo = info.testName
        ? `test: "${info.testName}"`
        : info.testFile
          ? `file: ${info.testFile}`
          : "unknown test";
      const appInfo = info.appName ? ` (${info.appName})` : "";
      console.log(`  - ${info.runId}${appInfo}`);
      console.log(`      Created by: ${testInfo}`);
      console.log(`      Created at: ${info.createdAt}`);
    });
  } else {
    console.log("\n✅ All created Speculos instances have been released.");
  }

  console.log("=".repeat(70) + "\n");

  // Log all operations in detail
  if (speculosOperations.length > 0) {
    console.log("[SpeculosCI] Detailed operation log:");
    speculosOperations.forEach((op, idx) => {
      console.log(
        `  ${idx + 1}. [${op.timestamp}] ${op.type.toUpperCase()} ${op.runId} - ${op.status}` +
          `${op.appName ? ` (${op.appName})` : ""}` +
          `${op.error ? ` - Error: ${op.error}` : ""}`,
      );
    });
  }
  /* eslint-enable no-console */

  // Write summary to artifacts file
  writeSpeculosExecutionSummary();
}

/**
 * Clear the operations log (useful for test isolation)
 */
export function clearSpeculosOperations(): void {
  speculosOperations.length = 0;
}

/**
 * Get the path to the e2e mobile artifacts directory
 */
function getArtifactsPath(): string {
  // Try to find the e2e/mobile/artifacts directory relative to workspace root
  // This handles both running from different directories and CI environments
  const possiblePaths = [
    // When running from workspace root
    path.resolve(process.cwd(), "e2e/mobile/artifacts"),
    // When running from e2e/mobile
    path.resolve(process.cwd(), "artifacts"),
    // When running from libs/ledger-live-common
    path.resolve(process.cwd(), "../../e2e/mobile/artifacts"),
    // Fallback: use environment variable if set
    process.env.E2E_ARTIFACTS_PATH,
  ].filter(Boolean) as string[];

  for (const artifactsPath of possiblePaths) {
    if (fs.existsSync(artifactsPath)) {
      return artifactsPath;
    }
  }

  // Default fallback - create in e2e/mobile/artifacts if possible
  const defaultPath = possiblePaths[0];
  try {
    fs.mkdirSync(defaultPath, { recursive: true });
    return defaultPath;
  } catch {
    // If we can't create the directory, use current working directory
    return process.cwd();
  }
}

/**
 * Write the Speculos CI execution summary to a file in the artifacts directory
 */
export function writeSpeculosExecutionSummary(): void {
  const summary = getSpeculosOperationsSummary();
  const artifactsPath = getArtifactsPath();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `speculos-execution-summary-${timestamp}.json`;
  const filepath = path.join(artifactsPath, filename);

  const summaryData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalOperations: summary.total,
      created: {
        total: summary.created,
        successful: summary.createdSuccessful,
        failed: summary.createdFailed,
      },
      released: {
        total: summary.released,
        successful: summary.releasedSuccessful,
        failed: summary.releasedFailed,
      },
      pendingCleanup: summary.pendingCleanup,
    },
    operations: speculosOperations.map(op => ({
      type: op.type,
      runId: op.runId,
      appName: op.appName,
      appVersion: op.appVersion,
      timestamp: op.timestamp,
      status: op.status,
      error: op.error,
      caller: op.caller,
      testName: op.testName,
      testFile: op.testFile,
    })),
  };

  try {
    fs.writeFileSync(filepath, JSON.stringify(summaryData, null, 2));
    // eslint-disable-next-line no-console
    console.log(`[SpeculosCI] Execution summary written to: ${filepath}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[SpeculosCI] Failed to write execution summary: ${sanitizeError(error)}`);
  }
}

let exitHandlerRegistered = false;

/**
 * Register a process exit handler to print summary and warn about uncleaned instances
 * This ensures we catch ALL operations, even those that happen after normal teardown
 */
export function registerSpeculosExitHandler(): void {
  if (exitHandlerRegistered) return;
  exitHandlerRegistered = true;

  const printFinalSummary = () => {
    const summary = getSpeculosOperationsSummary();

    // Always write the summary to artifacts
    writeSpeculosExecutionSummary();

    if (summary.pendingCleanup.length > 0) {
      /* eslint-disable no-console */
      console.log("\n" + "!".repeat(70));
      console.log("[SpeculosCI] ⚠️  FINAL EXIT SUMMARY - UNCLEANED INSTANCES DETECTED!");
      console.log("!".repeat(70));
      console.log(`Total operations: ${summary.total}`);
      console.log(`Created: ${summary.created}, Released: ${summary.released}`);
      console.log("\n🚨 The following Speculos instances were NOT cleaned up:");
      summary.pendingCleanup.forEach(info => {
        const testInfo = info.testName
          ? `test: "${info.testName}"`
          : info.testFile
            ? `file: ${info.testFile}`
            : "unknown test";
        console.log(`  ❌ ${info.runId}${info.appName ? ` (${info.appName})` : ""}`);
        console.log(`      Created by: ${testInfo}`);
        console.log(`      Created at: ${info.createdAt}`);
      });
      console.log("!".repeat(70) + "\n");
      /* eslint-enable no-console */
    }
  };

  // Handle both graceful and ungraceful exits
  process.on("exit", printFinalSummary);
  process.on("SIGINT", () => {
    printFinalSummary();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    printFinalSummary();
    process.exit(143);
  });
}

// ============================================================================

function uniqueId(): string {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).slice(2, 7);
  return timestamp + randomString;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Helper function to make API requests with error handling
 */
async function githubApiRequest<T = unknown>({
  method = "POST",
  urlSuffix,
  data,
  params,
}: {
  method?: "GET" | "POST";
  urlSuffix: string;
  data?: Record<string, unknown>;
  params?: Record<string, unknown>;
}): Promise<T> {
  const url = `${GIT_API_URL}${urlSuffix}`;
  try {
    const response = await axios({
      method,
      url,
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      data,
      params,
    });
    return response.data;
  } catch (error) {
    console.warn(`API Request failed: ${method} ${url}`, sanitizeError(error));
    throw sanitizeError(error);
  }
}

export function waitForSpeculosReady(
  deviceId: string,
  { interval = 2_000, timeout = 150_000 } = {},
) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let currentRequest: ReturnType<typeof https.get> | null = null;
    const url = getSpeculosAddress(deviceId);

    function cleanup() {
      if (currentRequest) {
        currentRequest.destroy();
        currentRequest = null;
      }
    }

    function check() {
      cleanup();

      currentRequest = https.get(url, { timeout: 10000 }, res => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          process.env.SPECULOS_ADDRESS = url;
          cleanup();
          console.warn(`Speculos is ready at ${url}`);
          resolve(true);
        } else {
          console.warn(`Speculos not ready yet, status: ${res.statusCode}`);
          retry();
        }
      });

      currentRequest.on("error", error => {
        console.error(`Request error: ${error.message}`);
        retry();
      });

      currentRequest.on("timeout", () => {
        console.error("Request timeout");
        retry();
      });
    }

    function retry() {
      if (Date.now() - startTime >= timeout) {
        cleanup();
        reject(new Error(`Timeout: ${url} did not become available within ${timeout}ms`));
      } else {
        setTimeout(check, interval);
      }
    }

    check();
  });
}

function createStartPayload(deviceParams: DeviceParams, runId: string) {
  const { model, firmware, appName, appVersion, dependency, dependencies } = deviceParams;

  let additional_args = "-p";

  if (dependency) {
    additional_args = `${additional_args} -l ${dependency}:/apps/${conventionalAppSubpath(model, firmware, dependency, appVersion)}`;
  } else if (dependencies) {
    additional_args = [
      ...new Set(
        dependencies.map(
          dep =>
            `${additional_args} -l ${dep.name}:/apps/${conventionalAppSubpath(
              model,
              firmware,
              dep.name,
              dep.appVersion ?? "1.0.0",
            )}`,
        ),
      ),
    ].join(" ");
  }

  return {
    ref: GITHUB_REF,
    inputs: {
      speculos_version: SPECULOS_IMAGE_TAG?.split(":")[1] || "master",
      coin_app: appName,
      coin_app_version: appVersion,
      device: reverseModelMap[model],
      device_os_version: firmware,
      run_id: runId,
      additional_args,
    },
  };
}

export async function createSpeculosDeviceCI(
  deviceParams: DeviceParams,
): Promise<SpeculosDevice | undefined> {
  // Register exit handler on first create to catch any uncleaned instances
  registerSpeculosExitHandler();

  const runId = `${slugify(deviceParams.appName)}-${uniqueId()}`;
  const caller = getCallerInfo();
  const timestamp = new Date().toISOString();
  const { testName, testFile } = getTestInfo();

  // Log pending operation
  logOperation({
    type: "create",
    runId,
    appName: deviceParams.appName,
    appVersion: deviceParams.appVersion,
    timestamp,
    status: "pending",
    caller,
    testName,
    testFile,
  });

  try {
    const data = createStartPayload(deviceParams, runId);
    await githubApiRequest({ urlSuffix: START_WORKFLOW_ID, data });

    // Update existing pending operation to success
    logOperation(
      {
        type: "create",
        runId,
        appName: deviceParams.appName,
        appVersion: deviceParams.appVersion,
        timestamp: new Date().toISOString(),
        status: "success",
        caller,
      },
      true,
    );

    return {
      id: runId,
      port: speculosPort,
      appName: deviceParams.appName,
      appVersion: deviceParams.appVersion,
    };
  } catch (error) {
    const errorMsg = sanitizeError(error)?.message || String(error);

    // Update existing pending operation to failed
    logOperation(
      {
        type: "create",
        runId,
        appName: deviceParams.appName,
        appVersion: deviceParams.appVersion,
        timestamp: new Date().toISOString(),
        status: "failed",
        error: errorMsg,
        caller,
      },
      true,
    );

    console.warn(
      `Failed to create remote Speculos ${deviceParams.appName}:${deviceParams.appVersion}:`,
      sanitizeError(error),
    );
    return {
      id: runId,
      port: 0,
      appName: deviceParams.appName,
      appVersion: deviceParams.appVersion,
    };
  }
}

export async function releaseSpeculosDeviceCI(runId: string) {
  const caller = getCallerInfo();
  const timestamp = new Date().toISOString();

  // Log pending operation
  logOperation({
    type: "release",
    runId,
    timestamp,
    status: "pending",
    caller,
  });

  const data = {
    ref: GITHUB_REF,
    inputs: {
      run_id: runId.toString(),
    },
  };

  try {
    await githubApiRequest({ urlSuffix: STOP_WORKFLOW_ID, data });

    // Update existing pending operation to success
    logOperation(
      {
        type: "release",
        runId,
        timestamp: new Date().toISOString(),
        status: "success",
        caller,
      },
      true,
    );
  } catch (error) {
    const errorMsg = sanitizeError(error)?.message || String(error);

    // Update existing pending operation to failed
    logOperation(
      {
        type: "release",
        runId,
        timestamp: new Date().toISOString(),
        status: "failed",
        error: errorMsg,
        caller,
      },
      true,
    );

    console.warn(`Failed to release remote Speculos ${runId}:`, sanitizeError(error));
  }
}

import { device } from "detox";
import { closeProxy } from "./bridge/proxy";
import { close as closeBridge, getLogs } from "./bridge/server";
import { launchApp, setupEnvironment } from "./helpers/commonHelpers";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { allure } from "jest-allure2-reporter/api";
import https from "https";
import http from "http";

const broadcastOriginalValue = getEnv("DISABLE_TRANSACTION_BROADCAST");
setupEnvironment();

// Handle uncaught exceptions from TLS socket serialization errors.
// When jest-worker serializes test results, destroyed TLS sockets cause:
// "TypeError: Cannot read properties of null (reading 'reading')"
// This handler prevents the crash from propagating and killing the worker.
process.on("uncaughtException", async error => {
  if (
    error instanceof TypeError &&
    error.message?.includes("Cannot read properties of null") &&
    error.stack?.includes("structured-clone")
  ) {
    console.warn("[E2E] Caught TLS socket serialization error, attempting recovery...");

    // Log diagnostic info to identify the source
    try {
      const { DeviceManagementKitTransportSpeculos } = await import("@ledgerhq/live-dmk-speculos");
      const info = DeviceManagementKitTransportSpeculos.getByBaseInfo();
      console.warn("[E2E] DMK byBase state:", JSON.stringify(info));
      if (info.count > 0) {
        console.warn(
          "[E2E] DMK byBase had entries - this is likely the source of the TLS socket error!",
        );
        await DeviceManagementKitTransportSpeculos.closeAll();
      }
    } catch {
      console.warn("[E2E] Could not check DMK byBase state");
    }

    // Force cleanup to prevent further issues
    https.globalAgent.destroy();
    http.globalAgent.destroy();
    global.gc?.();
    // Don't rethrow - let the test continue
    return;
  }
  // Rethrow other errors
  throw error;
});

/**
 * Cleans up HTTP/HTTPS connections and DeviceManagementKit transport to prevent TLS socket serialization errors.
 * When jest-worker tries to serialize test results using @ungap/structured-clone,
 * references to destroyed TLS sockets cause "Cannot read properties of null (reading 'reading')" errors.
 */
async function cleanupConnections() {
  try {
    // CRITICAL: Clean up DeviceManagementKitTransportSpeculos connections.
    // When Speculos stops, the TLS socket is destroyed but references remain in the static byBase map.
    // jest-worker's serialization then fails when accessing the destroyed socket.
    try {
      const { DeviceManagementKitTransportSpeculos } = await import("@ledgerhq/live-dmk-speculos");
      await DeviceManagementKitTransportSpeculos.closeAll();
    } catch {
      // Module might not be loaded - ignore
    }

    // Destroy all HTTP/HTTPS agent connections
    https.globalAgent.destroy();
    http.globalAgent.destroy();

    // Clear global state that might hold socket references
    if (globalThis.speculosDevices) {
      globalThis.speculosDevices.clear();
    }
    if (globalThis.proxySubscriptions) {
      globalThis.proxySubscriptions.clear();
    }

    // Force garbage collection if available
    global.gc?.();
  } catch {
    // Ignore cleanup errors
  }
}

beforeAll(
  async () => {
    const port = await launchApp();
    await device.reverseTcpPort(8081);
    await device.reverseTcpPort(port);
    await device.reverseTcpPort(52619); // To allow the android emulator to access the dummy app
    const testFileName = expect.getState().testPath?.replace(/^.*\/(.+?)(?:\.spec)?\.[^.]+$/, "$1");
    allure.description("Test file : " + testFileName);
  },
  process.env.CI ? 150000 : 120000,
);

// Clean up connections after EACH test to prevent TLS socket serialization errors
// This is critical because the crash happens when jest-worker serializes the test result
afterEach(async () => {
  await cleanupConnections();
});

afterAll(async () => {
  if (IS_FAILED && process.env.CI) {
    await allure.attachment("App logs", await getLogs(), "application/json");
  }
  setEnv("DISABLE_TRANSACTION_BROADCAST", broadcastOriginalValue);
  closeBridge();
  closeProxy();
  await app.common.removeSpeculos();
  await cleanupConnections();
});

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

/**
 * Cleans up HTTP/HTTPS connections and global state to prevent TLS socket serialization errors.
 * This is needed because jest-worker uses @ungap/structured-clone to serialize test results,
 * which can fail if the state contains references to destroyed TLS sockets from remote
 * Speculos HTTPS connections.
 */
function cleanupConnections() {
  // Force close any lingering HTTP/HTTPS connections
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

afterAll(async () => {
  if (IS_FAILED && process.env.CI) {
    await allure.attachment("App logs", await getLogs(), "application/json");
  }
  setEnv("DISABLE_TRANSACTION_BROADCAST", broadcastOriginalValue);
  closeBridge();
  closeProxy();
  await app.common.removeSpeculos();
  cleanupConnections();
});

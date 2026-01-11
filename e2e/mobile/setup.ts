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
 * MONKEY-PATCH: Wrap @ungap/structured-clone to catch TLS socket errors.
 *
 * When jest-worker serializes test results using @ungap/structured-clone,
 * destroyed TLS sockets cause "Cannot read properties of null (reading 'reading')".
 * This patch catches the error at the source - the structured-clone library itself.
 */
function patchStructuredClone() {
  // Try to find @ungap/structured-clone in the module cache
  const cacheKeys = Object.keys(require.cache);
  const serializeKey = cacheKeys.find(
    k => k.includes("@ungap") && k.includes("structured-clone") && k.includes("serialize"),
  );

  if (serializeKey) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serializeModule = require.cache[serializeKey]?.exports as any;
    if (serializeModule?.serialize) {
      const originalSerialize = serializeModule.serialize;
      serializeModule.serialize = function (...args: unknown[]) {
        try {
          return originalSerialize.apply(this, args);
        } catch (err) {
          if (
            err instanceof TypeError &&
            (err as Error).message?.includes("Cannot read properties of null")
          ) {
            console.warn("[E2E PATCH] Caught TLS socket error in structured-clone serialize");
            // Force cleanup
            https.globalAgent.destroy();
            http.globalAgent.destroy();
            // Return a simple serializable object instead of crashing
            return JSON.stringify({ _fallbackSerialization: true, error: "TLS socket cleanup" });
          }
          throw err;
        }
      };
      console.info("[E2E PATCH] Successfully patched @ungap/structured-clone serialize");
      return true;
    }
  }

  // Alternative: Try to require it directly
  const possiblePaths = ["@ungap/structured-clone", "@ungap/structured-clone/cjs/serialize"];

  for (const modulePath of possiblePaths) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require(modulePath);
      if (mod.serialize) {
        const originalSerialize = mod.serialize;
        mod.serialize = function (...args: unknown[]) {
          try {
            return originalSerialize.apply(this, args);
          } catch (err) {
            if (
              err instanceof TypeError &&
              (err as Error).message?.includes("Cannot read properties of null")
            ) {
              console.warn("[E2E PATCH] Caught TLS socket error in structured-clone");
              https.globalAgent.destroy();
              http.globalAgent.destroy();
              return JSON.stringify({ _fallbackSerialization: true });
            }
            throw err;
          }
        };
        console.info("[E2E PATCH] Successfully patched structured-clone from:", modulePath);
        return true;
      }
    } catch {
      // Try next path
    }
  }

  // Last resort: patch the module cache to intercept future loads
  // by wrapping Module._load
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Module = require("module");
    const originalLoad = Module._load;
    Module._load = function (request: string, parent: unknown, isMain: boolean) {
      const result = originalLoad.call(this, request, parent, isMain);
      if (request.includes("structured-clone") && result?.serialize && !result._patched) {
        const originalSerialize = result.serialize;
        result.serialize = function (...args: unknown[]) {
          try {
            return originalSerialize.apply(this, args);
          } catch (err) {
            if (
              err instanceof TypeError &&
              (err as Error).message?.includes("Cannot read properties of null")
            ) {
              console.error("[E2E PATCH] Caught TLS socket error via Module._load patch");
              https.globalAgent.destroy();
              http.globalAgent.destroy();
              return JSON.stringify({ _fallbackSerialization: true });
            }
            throw err;
          }
        };
        result._patched = true;
        console.error("[E2E PATCH] Patched structured-clone via Module._load");
      }
      return result;
    };
    console.info("[E2E PATCH] Installed Module._load interceptor for structured-clone");
    return true;
  } catch (err) {
    console.warn("[E2E PATCH] Could not install Module._load interceptor:", err);
  }

  console.warn("[E2E PATCH] Could not patch structured-clone");
  return false;
}

try {
  patchStructuredClone();
} catch (err) {
  console.warn("[E2E PATCH] Error patching structured-clone:", (err as Error).message);
}

// Handle uncaught exceptions from TLS socket serialization errors.
// When jest-worker serializes test results, destroyed TLS sockets cause:
// "TypeError: Cannot read properties of null (reading 'reading')"
// This handler prevents the crash from propagating and killing the worker.
process.on("uncaughtException", async error => {
  console.dir(error, { depth: 10 });
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

// DEBUG FLAG: Set to true to force the TLS socket crash
// This creates a destroyed TLS socket and stores it in globalThis,
// causing jest-worker serialization to fail with "Cannot read properties of null (reading 'reading')"
const DEBUG_FORCE_TLS_CRASH = false;

/**
 * Forces a TLS socket crash by creating a real TLS connection and destroying it.
 * This simulates exactly what happens when a Speculos connection is closed but not cleaned up.
 */
async function createDestroyedSocketForTesting() {
  if (!DEBUG_FORCE_TLS_CRASH) return;

  console.warn("[E2E DEBUG] Creating real TLS connection to force crash...");

  const tls = await import("tls");

  // Create a REAL TLS socket using tls.connect - this is more reliable than https.get
  // We connect to a public HTTPS server (google.com:443)
  const socket = await new Promise<import("tls").TLSSocket>(resolve => {
    const sock = tls.connect(
      {
        host: "google.com",
        port: 443,
        timeout: 3000,
        rejectUnauthorized: false, // Don't care about cert validation for this test
      },
      () => {
        console.warn("[E2E DEBUG] TLS connection established, destroying socket...");
        sock.destroy();
        resolve(sock);
      },
    );

    sock.on("error", err => {
      console.warn("[E2E DEBUG] TLS connection error:", err.message);
      // Still resolve with the socket - it exists even if connection failed
      sock.destroy();
      resolve(sock);
    });

    // Timeout fallback
    setTimeout(() => {
      if (!sock.destroyed) {
        console.warn("[E2E DEBUG] TLS connection timeout, destroying anyway...");
        sock.destroy();
      }
      resolve(sock);
    }, 3000);
  });

  console.warn("[E2E DEBUG] Socket created, destroyed:", socket.destroyed);

  // Create a trap object that will throw the EXACT same error when structured-clone tries to serialize it
  // This simulates what happens when accessing socket[kRes].reading on a destroyed socket
  const kRes = Symbol("kRes");
  const fakeDestroyedSocket = {
    [kRes]: null, // This is what causes the crash - kRes is null on destroyed sockets
    get reading() {
      // This getter is what structured-clone triggers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this as any)[kRes].reading; // Throws: Cannot read properties of null (reading 'reading')
    },
    // Add other properties that structured-clone might traverse
    destroyed: true,
    readable: false,
    writable: false,
  };

  try {
    // Inject directly into the DMK transport's byBase map
    // This is exactly what causes the real crash - stale entries with destroyed sockets
    const { DeviceManagementKitTransportSpeculos } = await import("@ledgerhq/live-dmk-speculos");

    // Create a fake entry that mimics a real DMK entry with a destroyed connection
    const fakeEntry = {
      dmk: {
        // Fake dmk with a reference that will cause structured-clone to fail
        _httpsAgent: {
          sockets: { "test:443": [socket, fakeDestroyedSocket] },
        },
      },
      sessionId: "fake-session-for-crash-test",
      // Also put the trap directly on the entry
      _socket: fakeDestroyedSocket,
    };

    // @ts-expect-error - intentionally injecting bad data for testing
    DeviceManagementKitTransportSpeculos.byBase.set("https://fake-speculos-crash-test", fakeEntry);

    // Also attach to globalThis properties that MIGHT be serialized
    // The real crash happens when something in the test context references the socket
    if (globalThis.speculosDevices) {
      // @ts-expect-error - injecting for crash test
      globalThis.speculosDevices.set("__crash_test_socket__", fakeDestroyedSocket);
    }

    // Attach to app if it exists - this is more likely to be serialized
    if (globalThis.app) {
      // @ts-expect-error - injecting for crash test
      globalThis.app.__debugDestroyedSocket = fakeDestroyedSocket;
      // @ts-expect-error - injecting for crash test
      globalThis.app.__debugDestroyedSocketAgent = fakeEntry.dmk._httpsAgent;
    }

    // Also attach directly to globalThis - this SHOULD be traversed during serialization
    // @ts-expect-error - injecting for crash test
    globalThis.__crashTestSocket = fakeDestroyedSocket;

    console.warn(
      "[E2E DEBUG] Injected fake destroyed socket trap. Crash expected on serialization!",
    );
    console.warn(
      "[E2E DEBUG] byBase now has",
      DeviceManagementKitTransportSpeculos.byBase.size,
      "entries",
    );

    // Verify the trap works by trying to access .reading
    try {
      console.warn("[E2E DEBUG] Testing trap... accessing .reading should throw");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const _ = (fakeDestroyedSocket as any).reading;
      console.warn("[E2E DEBUG] WARNING: Trap did NOT throw! Value:", _);
    } catch (e) {
      console.warn("[E2E DEBUG] Trap works! Threw:", (e as Error).message);
    }
  } catch (err) {
    console.warn("[E2E DEBUG] Failed to inject socket:", err);
  }
}

/**
 * Cleans up HTTP/HTTPS connections and DeviceManagementKit transport to prevent TLS socket serialization errors.
 * When jest-worker tries to serialize test results using @ungap/structured-clone,
 * references to destroyed TLS sockets cause "Cannot read properties of null (reading 'reading')" errors.
 */
async function cleanupConnections() {
  try {
    // When DEBUG_FORCE_TLS_CRASH is true, skip ALL cleanup to force the crash
    if (DEBUG_FORCE_TLS_CRASH) {
      console.warn("[E2E DEBUG] Skipping all cleanup to force TLS crash!");
      return;
    }

    // CRITICAL: Clean up DeviceManagementKitTransportSpeculos connections.
    // When Speculos stops, the TLS socket is destroyed but references remain in the static byBase map.
    // jest-worker's serialization then fails when accessing the destroyed socket.
    try {
      const { DeviceManagementKitTransportSpeculos } = await import("@ledgerhq/live-dmk-speculos");
      await DeviceManagementKitTransportSpeculos.closeAll();
    } catch {
      // Module might not be loaded - ignore
    }

    // Clean up debug socket if it exists
    if ((globalThis as Record<string, unknown>).__debugDestroyedSocket) {
      delete (globalThis as Record<string, unknown>).__debugDestroyedSocket;
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
  // DEBUG: Create destroyed socket BEFORE cleanup to test if cleanup prevents the crash
  await createDestroyedSocketForTesting();
  await cleanupConnections();
});

afterAll(async () => {
  await createDestroyedSocketForTesting();
  if (IS_FAILED && process.env.CI) {
    await allure.attachment("App logs", await getLogs(), "application/json");
  }
  setEnv("DISABLE_TRANSACTION_BROADCAST", broadcastOriginalValue);
  closeBridge();
  closeProxy();
  await app.common.removeSpeculos();
  await cleanupConnections();
});

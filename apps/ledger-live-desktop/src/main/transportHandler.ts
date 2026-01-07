/**
 * Direct transport handling in main process for Speculos and HTTP proxy
 * No more internal process - much simpler!
 */
import { ipcMain } from "electron";
import { log } from "@ledgerhq/logs";
import Transport from "@ledgerhq/hw-transport";
import TransportHttp from "@ledgerhq/hw-transport-http";
import {
  DeviceManagementKitTransportSpeculos,
  SpeculosHttpTransportOpts,
} from "@ledgerhq/live-dmk-speculos";

const LOG_TYPE = "main-transport-handler";

// Store active transports
const activeTransports = new Map<string, Transport>();

export function setupTransportHandlers() {
  log(LOG_TYPE, "Setting up transport handlers in main process");

  // Handle transport open
  ipcMain.handle("transport:open", async (event, { requestId, descriptor, timeout }) => {
    try {
      log(LOG_TYPE, "transport open", { descriptor, requestId });

      let transport;

      if (descriptor?.includes("speculos") || process.env.SPECULOS_API_PORT) {
        // Speculos transport
        const req: SpeculosHttpTransportOpts = {
          apiPort: String(process.env.SPECULOS_API_PORT || "5000"),
        };
        transport = await DeviceManagementKitTransportSpeculos.open(req);
      } else if (process.env.DEVICE_PROXY_URL) {
        // HTTP proxy transport
        const TransportHttpProxy = TransportHttp(process.env.DEVICE_PROXY_URL.split("|"));
        transport = await TransportHttpProxy.create(timeout || 3000, timeout || 5000);
      } else {
        throw new Error("No suitable transport found for descriptor: " + descriptor);
      }

      activeTransports.set(requestId, transport);

      return {
        type: "open-response",
        requestId,
        data: { descriptor: descriptor || "" },
      };
    } catch (error: unknown) {
      const err = error as Error;
      log(LOG_TYPE, "transport open error", { error: err.message, descriptor, requestId });
      return {
        type: "open-error",
        requestId,
        error: {
          message: err.message,
          id: (err as Error & { id?: string }).id || "TransportOpenError",
        },
      };
    }
  });

  // Handle transport exchange
  ipcMain.handle("transport:exchange", async (event, { requestId, apdu, timeout }) => {
    try {
      const transport = activeTransports.get(requestId);
      if (!transport) {
        throw new Error("Transport not found for request: " + requestId);
      }

      log(LOG_TYPE, "transport exchange", { apdu, requestId });

      const buffer = Buffer.from(apdu, "hex");
      const response = await transport.exchange(buffer, { abortTimeoutMs: timeout });
      const responseHex = response.toString("hex");

      log(LOG_TYPE, "transport exchange response", { response: responseHex, requestId });

      return {
        type: "exchange-response",
        requestId,
        data: responseHex,
      };
    } catch (error: unknown) {
      const err = error as Error;
      log(LOG_TYPE, "transport exchange error", { error: err.message, apdu, requestId });
      return {
        type: "exchange-error",
        requestId,
        error: {
          message: err.message,
          id: (err as Error & { id?: string }).id || "TransportExchangeError",
        },
      };
    }
  });

  // Handle transport close
  ipcMain.handle("transport:close", async (event, { requestId }) => {
    try {
      const transport = activeTransports.get(requestId);
      if (transport) {
        log(LOG_TYPE, "transport close", { requestId });
        await transport.close();
        activeTransports.delete(requestId);
      }

      return {
        type: "close-response",
        requestId,
      };
    } catch (error: unknown) {
      const err = error as Error;
      log(LOG_TYPE, "transport close error", { error: err.message, requestId });
      // Still clean up the transport reference
      activeTransports.delete(requestId);
      return {
        type: "close-response",
        requestId,
      };
    }
  });

  // Handle transport listen (simplified for HTTP transports)
  ipcMain.handle("transport:listen", async (event, { requestId }) => {
    try {
      log(LOG_TYPE, "transport listen", { requestId });

      // For HTTP transports, we don't really have device discovery
      // Send a simple response indicating the transport is available
      return {
        type: "listen-response",
        requestId,
        data: { type: "add", descriptor: "http-proxy", device: {} },
      };
    } catch (error: unknown) {
      const err = error as Error;
      log(LOG_TYPE, "transport listen error", { error: err.message, requestId });
      return {
        type: "listen-error",
        requestId,
        error: {
          message: err.message,
          id: (err as Error & { id?: string }).id || "TransportListenError",
        },
      };
    }
  });

  // Handle transport listen unsubscribe
  ipcMain.handle("transport:listen:unsubscribe", async (event, { requestId }) => {
    try {
      log(LOG_TYPE, "transport listen unsubscribe", { requestId });
      // Nothing to do for HTTP transports
      return { type: "unsubscribe-response", requestId };
    } catch (error: unknown) {
      const err = error as Error;
      log(LOG_TYPE, "transport listen unsubscribe error", { error: err.message, requestId });
      return { type: "unsubscribe-response", requestId };
    }
  });
}

// Cleanup function for app shutdown
export function cleanupTransports() {
  log(LOG_TYPE, "cleanup", { activeTransports: activeTransports.size });

  // Close all active transports
  for (const [requestId, transport] of activeTransports.entries()) {
    try {
      transport.close();
    } catch (error: unknown) {
      const err = error as Error;
      log(LOG_TYPE, "cleanup transport close error", { error: err.message, requestId });
    }
  }

  activeTransports.clear();
}

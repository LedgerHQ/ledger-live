import "~/live-common-setup-base";
import "~/live-common-set-supported-currencies";
import "./families";

import { Store } from "redux";
import VaultTransport from "@ledgerhq/hw-transport-vault";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import { getEnv } from "@ledgerhq/live-env";
import { retry } from "@ledgerhq/live-common/promise";
import { TraceContext, listen as listenLogs, trace } from "@ledgerhq/logs";
import logger from "./logger";
import { setDeviceMode } from "@ledgerhq/live-common/hw/actions/app";
import { DeviceManagementKitTransport } from "@ledgerhq/live-dmk-desktop";
import IPCTransport from "./IPCTransport";

enum RendererTransportModule {
  DeviceManagementKit,
  IPC, // For Speculos and HTTP proxy via internal process
  Vault,
}

/**
 * Register transport modules for the renderer process.
 *
 * NB: the order of the transport modules is important.
 * Whenever calling `withDevice` in the renderer process, the first registered transport
 * module that will return a truthy value from `open()` will be used.
 *
 * This logic allows all transports to be registered at initialization time,
 * and then depending on a set of conditions, the right transport will be used.
 */
export function registerTransportModules(_store: Store) {
  const vaultTransportPrefixID = "vault-transport:";

  listenLogs(({ id, date, ...log }) => {
    if (log.type === "hid-frame") return;
    logger.debug(log);
  });

  function whichTransportModuleToUse(deviceId: string): RendererTransportModule {
    if (deviceId.startsWith(vaultTransportPrefixID)) return RendererTransportModule.Vault;
    if (getEnv("SPECULOS_API_PORT") || getEnv("DEVICE_PROXY_URL"))
      return RendererTransportModule.IPC;
    // Always use DeviceManagementKit for regular USB devices (WebHID)
    return RendererTransportModule.DeviceManagementKit;
  }

  /**
   * DeviceManagementKit Transport Module.
   * It only supports regular USB devices.
   */
  registerTransportModule({
    id: "deviceManagementKitTransport",
    open: (id: string, timeoutMs?: number, context?: TraceContext) => {
      if (whichTransportModuleToUse(id) !== RendererTransportModule.DeviceManagementKit) return;

      trace({
        type: "renderer-setup",
        message: "Open called on registered module",
        data: {
          transport: "DeviceManagementKitTransport",
          timeoutMs,
        },
        context: {
          openContext: context,
        },
      });

      return DeviceManagementKitTransport.open();
    },

    disconnect: () => Promise.resolve(),
  });

  /**
   * IPC Transport Module.
   * Handles Speculos and HTTP proxy via internal process.
   * Uses IPC to communicate with internal process that manages actual transports.
   */
  registerTransportModule({
    id: "ipc-transport",
    open: (id: string, timeoutMs?: number, context?: TraceContext) => {
      if (whichTransportModuleToUse(id) !== RendererTransportModule.IPC) return;

      trace({
        type: "renderer-setup",
        message: "Open called on registered module",
        data: {
          transport: "IPCTransport",
          timeoutMs,
        },
        context: {
          openContext: context,
        },
      });

      // Use a descriptive ID that helps the internal process choose the right transport
      let descriptor = "ipc";
      if (getEnv("SPECULOS_API_PORT")) {
        descriptor = "speculos";
      } else if (getEnv("DEVICE_PROXY_URL")) {
        descriptor = "proxy";
      }

      return retry(() => IPCTransport.open(descriptor, timeoutMs, context), {
        interval: 500,
        maxRetry: 4,
      });
    },
    disconnect: () => Promise.resolve(),
  });

  /**
   * Vault Transport Module.
   */
  registerTransportModule({
    id: "vault-transport",
    open: (id: string) => {
      if (whichTransportModuleToUse(id) !== RendererTransportModule.Vault) return;
      setDeviceMode("polling");
      const params = new URLSearchParams(id.split(vaultTransportPrefixID)[1]);
      return retry(() =>
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        VaultTransport.open(params.get("host") as string).then(transport => {
          transport.setData({
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            token: params.get("token") as string,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            workspace: params.get("workspace") as string,
          });
          return Promise.resolve(transport);
        }),
      );
    },
    disconnect: () => Promise.resolve(),
  });
}

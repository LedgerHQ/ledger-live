import "~/live-common-setup-base";
import "~/live-common-set-supported-currencies";
import "./families";

import { Store } from "redux";
import VaultTransport from "@ledgerhq/hw-transport-vault";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import { getEnv } from "@ledgerhq/live-env";
import { retry } from "@ledgerhq/live-common/promise";
import { TraceContext, listen as listenLogs, trace } from "@ledgerhq/logs";
import { getUserId } from "~/helpers/user";
import { setEnvOnAllThreads } from "./../helpers/env";
import { IPCTransport } from "./IPCTransport";
import logger from "./logger";
import { setDeviceMode } from "@ledgerhq/live-common/hw/actions/app";
import { getFeature } from "@ledgerhq/live-common/featureFlags/index";
import { overriddenFeatureFlagsSelector } from "~/renderer/reducers/settings";
import { DeviceManagementKitTransport } from "@ledgerhq/live-dmk";

const isDeviceManagementKitEnabled = (store: Store) => {
  const state = store.getState();
  const localOverrides = overriddenFeatureFlagsSelector(state);
  return getFeature({ key: "ldmkTransport", localOverrides })?.enabled;
};

enum RendererTransportModule {
  DeviceManagementKit,
  IPC,
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
export function registerTransportModules(store: Store) {
  setEnvOnAllThreads("USER_ID", getUserId());
  const vaultTransportPrefixID = "vault-transport:";

  listenLogs(({ id, date, ...log }) => {
    if (log.type === "hid-frame") return;
    logger.debug(log);
  });

  function whichTransportModuleToUse(deviceId: string): RendererTransportModule {
    if (deviceId.startsWith(vaultTransportPrefixID)) return RendererTransportModule.Vault;
    if (getEnv("SPECULOS_API_PORT")) return RendererTransportModule.IPC;
    if (getEnv("DEVICE_PROXY_URL")) return RendererTransportModule.IPC;
    if (isDeviceManagementKitEnabled(store)) return RendererTransportModule.DeviceManagementKit;
    return RendererTransportModule.IPC;
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
   * It acts as a bridge with transports registered in the internal process:
   * Node HID as well as HTTP transports (Speculos & Proxy).
   */
  registerTransportModule({
    id: "ipc",
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

      // Retries in the `renderer` process if the open failed. No retry is done in the `internal` process to avoid multiplying retries.
      return retry(() => IPCTransport.open(id, timeoutMs, context), {
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
        VaultTransport.open(params.get("host") as string).then(transport => {
          transport.setData({
            token: params.get("token") as string,
            workspace: params.get("workspace") as string,
          });
          return Promise.resolve(transport);
        }),
      );
    },
    disconnect: () => Promise.resolve(),
  });
}

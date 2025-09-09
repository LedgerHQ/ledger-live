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
import logger from "./logger";
import { setDeviceMode } from "@ledgerhq/live-common/hw/actions/app";
import { DeviceManagementKitTransport } from "@ledgerhq/live-dmk-desktop";
import TransportHttp from "@ledgerhq/hw-transport-http";
import SpeculosHttpTransport, {
  SpeculosHttpTransportOpts,
} from "@ledgerhq/hw-transport-node-speculos-http";

enum RendererTransportModule {
  DeviceManagementKit,
  Speculos,
  HttpProxy,
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
  setEnvOnAllThreads("USER_ID", getUserId());
  const vaultTransportPrefixID = "vault-transport:";

  listenLogs(({ id, date, ...log }) => {
    if (log.type === "hid-frame") return;
    logger.debug(log);
  });

  function whichTransportModuleToUse(deviceId: string): RendererTransportModule {
    if (deviceId.startsWith(vaultTransportPrefixID)) return RendererTransportModule.Vault;
    if (getEnv("SPECULOS_API_PORT")) return RendererTransportModule.Speculos;
    if (getEnv("DEVICE_PROXY_URL")) return RendererTransportModule.HttpProxy;
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
   * Speculos HTTP Transport Module.
   * Direct connection to Speculos simulator via HTTP API.
   */
  registerTransportModule({
    id: "speculos-http",
    open: (id: string, timeoutMs?: number, context?: TraceContext) => {
      if (whichTransportModuleToUse(id) !== RendererTransportModule.Speculos) return;

      trace({
        type: "renderer-setup",
        message: "Open called on registered module",
        data: {
          transport: "SpeculosHttpTransport",
          timeoutMs,
        },
        context: {
          openContext: context,
        },
      });

      const req: SpeculosHttpTransportOpts = {
        apiPort: String(getEnv("SPECULOS_API_PORT")),
      };

      return retry(() => SpeculosHttpTransport.open(req), {
        interval: 500,
        maxRetry: 4,
      });
    },
    disconnect: () => Promise.resolve(),
  });

  /**
   * HTTP Proxy Transport Module.
   * Direct connection to HTTP proxy for testing.
   */
  registerTransportModule({
    id: "http-proxy",
    open: (id: string, timeoutMs?: number, context?: TraceContext) => {
      if (whichTransportModuleToUse(id) !== RendererTransportModule.HttpProxy) return;

      trace({
        type: "renderer-setup",
        message: "Open called on registered module",
        data: {
          transport: "TransportHttp",
          timeoutMs,
        },
        context: {
          openContext: context,
        },
      });

      const Tr = TransportHttp(getEnv("DEVICE_PROXY_URL").split("|"));
      return retry(() => Tr.create(3000, 5000), {
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

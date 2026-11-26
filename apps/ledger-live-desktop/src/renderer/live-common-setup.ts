import "./live-common-setup-renderer";
import "~/live-common-set-supported-currencies";
import "./families";

import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import { getEnv } from "@shared/env";
import { retry } from "@ledgerhq/live-common/promise";
import { TraceContext, listen as listenLogs, trace } from "@ledgerhq/logs";
import logger from "./logger";
import { DeviceManagementKitTransport, getDeviceManagementKit } from "@ledgerhq/live-dmk-desktop";
import { AppDmkSpeculosTransport } from "@ledgerhq/live-dmk-speculos";

enum RendererTransportModule {
  DeviceManagementKit,
  DeviceManagementKitSpeculos,
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
export function registerTransportModules() {
  listenLogs(({ id, date, ...log }) => {
    if (log.type === "hid-frame") return;
    logger.debug(log);
  });

  function whichTransportModuleToUse(): RendererTransportModule {
    if (getEnv("SPECULOS_API_PORT")) return RendererTransportModule.DeviceManagementKitSpeculos;
    return RendererTransportModule.DeviceManagementKit;
  }

  /**
   * DeviceManagementKit Transport Module.
   * It only supports regular USB devices.
   */
  registerTransportModule({
    id: "deviceManagementKitTransport",
    open: (_id: string, timeoutMs?: number, context?: TraceContext) => {
      if (whichTransportModuleToUse() !== RendererTransportModule.DeviceManagementKit) return;

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

  registerTransportModule({
    id: "deviceManagementKitSpeculosTransport",
    open: (_id: string, timeoutMs?: number, context?: TraceContext) => {
      if (whichTransportModuleToUse() !== RendererTransportModule.DeviceManagementKitSpeculos)
        return;

      trace({
        type: "renderer-setup",
        message: "Open called on registered module",
        data: {
          transport: "AppDmkSpeculosTransport",
          timeoutMs,
        },
        context: {
          openContext: context,
        },
      });

      return retry(() => AppDmkSpeculosTransport.open(getDeviceManagementKit(), timeoutMs), {
        interval: 500,
        maxRetry: 4,
      });
    },
    disconnect: () => Promise.resolve(),
  });
}

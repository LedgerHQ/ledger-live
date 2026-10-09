import "./live-common-setup-renderer";
import "~/live-common-set-supported-currencies";
import "./families";

import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import { getEnv } from "@shared/env";
import { retry } from "@ledgerhq/live-common/promise";
import { TraceContext, listen as listenLogs, trace } from "@ledgerhq/logs";
import logger from "./logger";
import { DeviceManagementKitTransport } from "@ledgerhq/live-dmk-desktop";
import { DeviceManagementKitTransportSpeculos } from "@ledgerhq/live-dmk-speculos";
import { ledgerToDmkDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";

enum RendererTransportModule {
  DeviceManagementKit,
  DeviceManagementKitSpeculos,
}

// Speculos cannot tell the DMK transport which device it emulates (it defaults
// to Stax), so we map the SPECULOS_DEVICE name set by the e2e setup to the model.
const SPECULOS_DEVICE_TO_MODEL: Record<string, DeviceModelId> = {
  nanoS: DeviceModelId.nanoS,
  nanoSP: DeviceModelId.nanoSP,
  nanoX: DeviceModelId.nanoX,
  stax: DeviceModelId.stax,
  flex: DeviceModelId.europa,
  nanoGen5: DeviceModelId.apex,
};

function getSpeculosDmkModel() {
  const model = SPECULOS_DEVICE_TO_MODEL[getEnv("SPECULOS_DEVICE")];
  return model ? ledgerToDmkDeviceIdMap[model] : undefined;
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
          transport: "DeviceManagementKitTransportSpeculos",
          timeoutMs,
        },
        context: {
          openContext: context,
        },
      });

      const speculosApiPort = getEnv("SPECULOS_API_PORT");

      return retry(
        () =>
          DeviceManagementKitTransportSpeculos.open({
            apiPort: speculosApiPort ? String(speculosApiPort) : undefined,
            timeout: timeoutMs,
            model: getSpeculosDmkModel(),
          }),
        {
          interval: 500,
          maxRetry: 4,
        },
      );
    },
    disconnect: () => Promise.resolve(),
  });
}

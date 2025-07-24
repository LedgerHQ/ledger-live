import { DeviceManagementKit, DeviceSessionId } from "@ledgerhq/device-management-kit";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { DeviceDeprecationError } from "../errors";

export const throwErrorWhenDeviceDeprecated = (
  dmk: DeviceManagementKit,
  sessionId: DeviceSessionId,
  passDeprecation: boolean,
  appName: string,
  dependencies?: string[],
): void => {
  if (passDeprecation) {
    return;
  }
  const config =
    appName === "Exchange" && dependencies && dependencies.length > 0
      ? LiveConfig.getValueByKey(
          `config_nanoapp_${dependencies[0].toLowerCase().replace(/ /g, "_")}`,
        )
      : LiveConfig.getValueByKey(`config_nanoapp_${appName.toLowerCase().replace(/ /g, "_")}`);
  if (!config || !config.deviceDeprecated) {
    return;
  }
  const { modelId } = dmk.getConnectedDevice({ sessionId });
  const today = new Date();
  for (const deviceDeprecated of config.deviceDeprecated) {
    if (deviceDeprecated.deviceModelId !== modelId) {
      continue;
    }

    if (deviceDeprecated.errorScreen) {
      const errorDate = new Date(deviceDeprecated.errorScreen.date);
      if (errorDate < today) {
        throw new DeviceDeprecationError("error", {
          modelId,
          date: errorDate.toISOString(),
        });
      }
    }
    if (deviceDeprecated.warningClearSigningScreen) {
      const warningDate = new Date(deviceDeprecated.warningClearSigningScreen.date);
      if (warningDate < today) {
        throw new DeviceDeprecationError("warning", {
          modelId,
          date: warningDate.toISOString(),
          tokenExceptions: deviceDeprecated.warningClearSigningScreen.tokenExceptions,
          deprecatedFlowExceptions:
            deviceDeprecated.warningClearSigningScreen.deprecatedFlowExceptions,
        });
      }
    }
    if (deviceDeprecated.infoScreen) {
      const infoDate = new Date(deviceDeprecated.infoScreen.date);
      if (infoDate < today) {
        throw new DeviceDeprecationError("info", {
          modelId,
          date: infoDate.toISOString(),
        });
      }
    }
  }
};

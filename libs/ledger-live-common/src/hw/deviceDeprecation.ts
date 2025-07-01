import { DeviceManagementKit, DeviceSessionId } from "@ledgerhq/device-management-kit";
import { DeviceDeprecationError } from "../errors";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { getDeviceModel } from "@ledgerhq/devices/index";
import { DeviceDeprecationErrorType } from "./connectApp";

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
  const productName = getDeviceModel(dmkToLedgerDeviceIdMap[modelId]).productName;
  const today = new Date();
  for (const deviceDeprecated of config.deviceDeprecated) {
    if (deviceDeprecated.deviceModelId !== modelId) {
      continue;
    }
    const errorDate = new Date(deviceDeprecated.errorScreen.date);
    if (deviceDeprecated.errorScreen) {
      if (errorDate < today) {
        throw new DeviceDeprecationError("error", {
          clearSigningScreenVisible: false,
          warningScreenVisible: false,
          errorScreenVisible: true,
          productName,
          date: errorDate,
          errorScreenConfig: {
            tokenExceptions: deviceDeprecated.errorScreen.tokenExceptions,
            deprecatedFlow: deviceDeprecated.errorScreen.deprecatedFlow,
          },
        });
      }
    }
    const deprecationData: DeviceDeprecationErrorType = {
      clearSigningScreenVisible: false,
      warningScreenVisible: false,
      errorScreenVisible: false,
      productName,
      date: errorDate,
      warningScreenConfig: {
        tokenExceptions: deviceDeprecated.infoScreen.tokenExceptions,
        deprecatedFlow: deviceDeprecated.infoScreen.deprecatedFlow,
      },
    };
    if (deviceDeprecated.infoScreen) {
      const infoDate = new Date(deviceDeprecated.infoScreen.date);
      if (infoDate < today) {
        deprecationData.warningScreenVisible = true;
      }
      if (deviceDeprecated.warningClearSigningScreen) {
        const warningDate = new Date(deviceDeprecated.warningClearSigningScreen.date);
        if (warningDate < today) {
          deprecationData.clearSigningScreenVisible = true;
          deprecationData.clearSigningScreenConfig = {
            tokenExceptions: deviceDeprecated.warningClearSigningScreen.tokenExceptions,
            deprecatedFlow: deviceDeprecated.warningClearSigningScreen.deprecated,
          };
        }
      }
      throw new DeviceDeprecationError("warning", deprecationData);
    }
    if (deviceDeprecated.warningClearSigningScreen) {
      const clearSigningDate = new Date(deviceDeprecated.warningClearSigningScreen.date);
      if (clearSigningDate < today) {
        deprecationData.clearSigningScreenVisible = true;
        deprecationData.clearSigningScreenConfig = {
          tokenExceptions: deviceDeprecated.warningClearSigningScreen.tokenExceptions,
          deprecatedFlow: deviceDeprecated.warningClearSigningScreen.deprecatedFlow,
        };
        throw new DeviceDeprecationError("clearSigning", deprecationData);
      }
    }
  }
};

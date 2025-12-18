import { dmkToLedgerDeviceIdMap } from "../../config/dmkToLedgerDeviceIdMap";
import type {
  DeviceDeprecationConfigs,
  DeviceDeprecationConfig,
  DeviceDeprecationRules,
  DeviceDeprecationScreenRules,
  DeviceDeprecationScreenConfig,
} from "./types";
import type { DeviceModelId } from "@ledgerhq/device-management-kit";

export function isDeviceDeprecated(
  configs: DeviceDeprecationConfigs,
  modelId: DeviceModelId,
): DeviceDeprecationRules {
  const now = new Date();
  const fallbackDate = now;

  const base: DeviceDeprecationRules = {
    warningScreenVisible: false,
    clearSigningScreenVisible: false,
    errorScreenVisible: false,
    modelId: dmkToLedgerDeviceIdMap[modelId],
    date: fallbackDate,
    warningScreenRules: { exception: [], deprecatedFlow: [] },
    clearSigningScreenRules: { exception: [], deprecatedFlow: [] },
    errorScreenRules: { exception: [], deprecatedFlow: [] },
    onContinue: () => {},
  };

  const config: DeviceDeprecationConfig | undefined = configs.find(
    (cfg: DeviceDeprecationConfig) => cfg.deviceModelId === modelId,
  );
  if (!config) return base;
  const createScreenRules = (
    screenConfig?: DeviceDeprecationScreenConfig,
  ): DeviceDeprecationScreenRules => ({
    exception: screenConfig?.exception ?? [],
    deprecatedFlow: screenConfig?.deprecatedFlow ?? [],
  });

  const isPast = (dateStr?: string) => !!dateStr && new Date(dateStr) < now;

  const data: DeviceDeprecationRules = { ...base };
  data.date = new Date(config.errorScreen.date);
  const apply = (
    screenConfig: DeviceDeprecationScreenConfig | undefined,
    setConfig: (rule: DeviceDeprecationScreenRules) => void,
    setVisibleKey: "warningScreenVisible" | "clearSigningScreenVisible" | "errorScreenVisible",
  ) => {
    if (!screenConfig) return;
    setConfig(createScreenRules(screenConfig));
    if (isPast(screenConfig.date)) {
      (data as any)[setVisibleKey] = true;
    }
  };

  apply(config.errorScreen, rule => (data.errorScreenRules = rule), "errorScreenVisible");
  apply(config.warningScreen, rule => (data.warningScreenRules = rule), "warningScreenVisible");
  apply(
    config.warningClearSigningScreen,
    rule => (data.clearSigningScreenRules = rule),
    "clearSigningScreenVisible",
  );
  console.log("deprecation data", modelId, data);
  return data;
}

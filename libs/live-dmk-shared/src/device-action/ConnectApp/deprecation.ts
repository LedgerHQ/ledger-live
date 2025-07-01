import { dmkToLedgerDeviceIdMap } from "../../config/dmkToLedgerDeviceIdMap";
import type {
  DeviceDeprecated,
  DeviceDeprecatedEntry,
  DeviceDeprecationPayload,
  DeviceDeprecationConfig,
} from "./types";
import type { DeviceModelId } from "@ledgerhq/device-management-kit";

export function computeDeviceDeprecation(
  deviceDeprecated: DeviceDeprecated,
  modelId: DeviceModelId,
): DeviceDeprecationPayload {
  const now = new Date();
  const fallbackDate = now;

  const base: DeviceDeprecationPayload = {
    warningScreenVisible: false,
    clearSigningScreenVisible: false,
    errorScreenVisible: false,
    modelId: dmkToLedgerDeviceIdMap[modelId],
    date: fallbackDate,
    warningScreenConfig: { exception: [], deprecatedFlow: [] },
    clearSigningScreenConfig: { exception: [], deprecatedFlow: [] },
    errorScreenConfig: { exception: [], deprecatedFlow: [] },
    onContinue: () => {},
  };

  const dd: DeviceDeprecatedEntry | undefined = deviceDeprecated.find(
    (d: DeviceDeprecatedEntry) => d.deviceModelId === modelId,
  );
  if (!dd) return base;

  const toConfig = (screen?: {
    exception?: string[];
    deprecatedFlow?: string[];
  }): DeviceDeprecationConfig => ({
    exception: screen?.exception ?? [],
    deprecatedFlow: screen?.deprecatedFlow ?? [],
  });

  const isPast = (dateStr?: string) => !!dateStr && new Date(dateStr) < now;

  const data: DeviceDeprecationPayload = { ...base };

  const apply = (
    screen: { date?: string; exception?: string[]; deprecatedFlow?: string[] } | undefined,
    setConfig: (cfg: DeviceDeprecationConfig) => void,
    setVisibleKey: "warningScreenVisible" | "clearSigningScreenVisible" | "errorScreenVisible",
    alsoSetDate = false,
  ) => {
    if (!screen) return;
    setConfig(toConfig(screen));
    if (isPast(screen.date)) {
      (data as any)[setVisibleKey] = true;
      if (alsoSetDate && screen.date) {
        data.date = new Date(screen.date);
      }
    }
  };

  apply(dd.errorScreen, cfg => (data.errorScreenConfig = cfg), "errorScreenVisible", true);
  apply(dd.infoScreen, cfg => (data.warningScreenConfig = cfg), "warningScreenVisible");
  apply(
    dd.warningClearSigningScreen,
    cfg => (data.clearSigningScreenConfig = cfg),
    "clearSigningScreenVisible",
  );

  return data;
}

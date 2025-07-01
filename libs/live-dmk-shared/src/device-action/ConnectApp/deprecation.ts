import { dmkToLedgerDeviceIdMap } from "../../config/dmkToLedgerDeviceIdMap";
import type { DeviceDeprecated, DeviceDeprecatedEntry, DeviceDeprecationPayload } from "./types";
import type { DeviceModelId } from "@ledgerhq/device-management-kit";

export function computeDeviceDeprecation(
  deviceDeprecated: DeviceDeprecated,
  modelId: DeviceModelId,
): DeviceDeprecationPayload {
  const now = new Date();
  const fallbackDate = now;
  const base = {
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
  const errorDate = dd.errorScreen?.date ? new Date(dd.errorScreen.date) : null;
  const infoDate = dd.infoScreen?.date ? new Date(dd.infoScreen.date) : null;
  const clearDate = dd.warningClearSigningScreen?.date
    ? new Date(dd.warningClearSigningScreen.date)
    : null;

  const data: DeviceDeprecationPayload = {
    ...base,
  };
  data.date = errorDate || fallbackDate;

  if (dd.errorScreen) {
    data.errorScreenConfig = {
      exception: dd.errorScreen.exception ?? [],
      deprecatedFlow: dd.errorScreen.deprecatedFlow ?? [],
    };
    if (errorDate && errorDate < now) {
      data.errorScreenVisible = true;
    }
  }
  if (dd.infoScreen) {
    data.warningScreenConfig = {
      exception: dd.infoScreen.exception ?? [],
      deprecatedFlow: dd.infoScreen.deprecatedFlow ?? [],
    };
    if (infoDate && infoDate < now) {
      data.warningScreenVisible = true;
    }
  }

  if (dd.warningClearSigningScreen) {
    data.clearSigningScreenConfig = {
      exception: dd.warningClearSigningScreen.exception ?? [],
      deprecatedFlow: dd.warningClearSigningScreen.deprecatedFlow ?? [],
    };
    if (clearDate && clearDate < now) {
      data.clearSigningScreenVisible = true;
    }
  }
  return data;
}

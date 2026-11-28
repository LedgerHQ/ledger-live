import type { GetBatteryStatusResponse } from "@ledgerhq/device-management-kit";

export const asBatteryPercentage = (response: GetBatteryStatusResponse): number => {
  if (typeof response !== "number") {
    throw new TypeError("Expected a battery percentage, got battery flags");
  }
  return response;
};

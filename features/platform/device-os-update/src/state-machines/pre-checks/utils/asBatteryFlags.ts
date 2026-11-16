import type { GetBatteryStatusResponse } from "@ledgerhq/device-management-kit";

export const asBatteryFlags = (
  response: GetBatteryStatusResponse,
): Exclude<GetBatteryStatusResponse, number> => {
  if (typeof response === "number") {
    throw new TypeError("Expected battery flags, got a battery percentage");
  }
  return response;
};

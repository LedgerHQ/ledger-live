import { deviceIdMap } from "./deviceIdMap";
import { DeviceModelId as DMKDeviceModelId } from "@ledgerhq/device-management-kit";
import { DeviceModelId as LLDeviceModelId } from "@ledgerhq/types-devices";

describe("deviceIdMap", () => {
  it("should map DMK device model ids to LL device model ids", () => {
    expect(deviceIdMap[DMKDeviceModelId.FLEX]).toBe(LLDeviceModelId.europa);
  });
});

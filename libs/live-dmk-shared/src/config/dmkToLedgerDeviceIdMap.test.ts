import { dmkToLedgerDeviceIdMap } from "./dmkToLedgerDeviceIdMap";
import { DeviceModelId as DMKDeviceModelId } from "@ledgerhq/device-management-kit";
import { DeviceModelId as LLDeviceModelId } from "@ledgerhq/types-devices";

describe("dmkToLedgerDeviceIdMap", () => {
  it("should map DMK device model ids to LL device model ids", () => {
    expect(dmkToLedgerDeviceIdMap[DMKDeviceModelId.FLEX]).toBe(LLDeviceModelId.europa);
  });
});

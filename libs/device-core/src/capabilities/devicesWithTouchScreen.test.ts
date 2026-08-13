import { DeviceModelId } from "@ledgerhq/devices";
import { DevicesWithTouchScreen } from "./devicesWithTouchScreen";

describe("DevicesWithTouchScreen", () => {
  it("includes only touchscreen device models", () => {
    expect(DevicesWithTouchScreen).toEqual([
      DeviceModelId.stax,
      DeviceModelId.europa,
      DeviceModelId.apex,
    ]);
  });
});

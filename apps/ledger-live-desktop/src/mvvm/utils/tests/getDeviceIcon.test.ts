import { DeviceModelId } from "@ledgerhq/types-devices";
import { Apex, Flex, LedgerDevices, Nano, Stax } from "@ledgerhq/lumen-ui-react/symbols";

import { getDeviceIcon } from "../getDeviceIcon";

describe("getDeviceIcon", () => {
  it.each([DeviceModelId.nanoS, DeviceModelId.nanoSP, DeviceModelId.nanoX, DeviceModelId.blue])(
    "should return the Nano icon for %s",
    modelId => {
      expect(getDeviceIcon(modelId)).toBe(Nano);
    },
  );

  it("should return the Stax icon for Ledger Stax", () => {
    expect(getDeviceIcon(DeviceModelId.stax)).toBe(Stax);
  });

  it("should return the Flex icon for Ledger Flex", () => {
    expect(getDeviceIcon(DeviceModelId.europa)).toBe(Flex);
  });

  it("should return the Apex icon for Ledger Apex", () => {
    expect(getDeviceIcon(DeviceModelId.apex)).toBe(Apex);
  });

  it("should return the generic Ledger devices icon for an unknown model", () => {
    expect(getDeviceIcon(undefined)).toBe(LedgerDevices);
  });
});

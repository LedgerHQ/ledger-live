import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { isTouchscreen } from "./deviceModel";

describe("isTouchscreen", () => {
  it.each([DeviceModelId.STAX, DeviceModelId.FLEX, DeviceModelId.APEX])("accepts %s", model => {
    expect(isTouchscreen(model)).toBe(true);
  });

  it.each([DeviceModelId.NANO_S, DeviceModelId.NANO_SP, DeviceModelId.NANO_X])(
    "refuses %s",
    model => {
      expect(isTouchscreen(model)).toBe(false);
    },
  );

  it("reads DMK's own model names, where the Flex is `flex` and the Apex `apexp`", () => {
    expect(DeviceModelId.FLEX).toBe("flex");
    expect(DeviceModelId.APEX).toBe("apexp");
  });
});

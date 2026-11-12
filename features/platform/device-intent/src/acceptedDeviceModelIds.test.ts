import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { acceptedDeviceModelIdsExcluding } from "./acceptedDeviceModelIds";

describe("acceptedDeviceModelIdsExcluding", () => {
  it("accepts every model when nothing is excluded", () => {
    expect(acceptedDeviceModelIdsExcluding()).toEqual([]);
    expect(acceptedDeviceModelIdsExcluding([])).toEqual([]);
  });

  it("lists every other model when some are excluded", () => {
    const accepted = acceptedDeviceModelIdsExcluding([DeviceModelId.NANO_S]);

    expect(accepted).not.toContain(DeviceModelId.NANO_S);
    expect(accepted).toEqual(
      Object.values(DeviceModelId).filter(model => model !== DeviceModelId.NANO_S),
    );
  });
});

import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { acceptedDeviceModelIdsExcluding } from "./acceptedDeviceModelIds";
import { NoAcceptedDeviceModelError } from "./errors";

describe("acceptedDeviceModelIdsExcluding", () => {
  it("should accept every model when no model is excluded", () => {
    expect(acceptedDeviceModelIdsExcluding()).toEqual([]);
    expect(acceptedDeviceModelIdsExcluding([])).toEqual([]);
  });

  it("should accept every other model when one model is excluded", () => {
    const accepted = acceptedDeviceModelIdsExcluding([DeviceModelId.NANO_S]);

    expect(accepted).not.toContain(DeviceModelId.NANO_S);
    expect(accepted).toEqual(
      Object.values(DeviceModelId).filter(modelId => modelId !== DeviceModelId.NANO_S),
    );
  });

  it("should ignore a model excluded twice", () => {
    expect(acceptedDeviceModelIdsExcluding([DeviceModelId.NANO_S, DeviceModelId.NANO_S])).toEqual(
      acceptedDeviceModelIdsExcluding([DeviceModelId.NANO_S]),
    );
  });

  it("should throw when every model is excluded", () => {
    expect(() => acceptedDeviceModelIdsExcluding(Object.values(DeviceModelId))).toThrow(
      NoAcceptedDeviceModelError,
    );
  });
});

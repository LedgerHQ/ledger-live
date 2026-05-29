import { DeviceModelId } from "@ledgerhq/devices";
import { isLegacyNano } from "../isLegacyNano";

describe("isLegacyNano", () => {
  it.each([
    DeviceModelId.nanoS,
    DeviceModelId.nanoSP,
    DeviceModelId.nanoX,
  ])("should return true for legacy Nano model %s", modelId => {
    expect(isLegacyNano(modelId)).toBe(true);
  });

  it.each([DeviceModelId.stax, DeviceModelId.europa, DeviceModelId.apex, null, undefined])(
    "should return false for non-legacy model %s",
    modelId => {
      expect(isLegacyNano(modelId)).toBe(false);
    },
  );
});

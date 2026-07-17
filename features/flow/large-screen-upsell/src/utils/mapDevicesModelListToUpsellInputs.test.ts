import { mapDevicesModelListToUpsellInputs } from "./mapDevicesModelListToUpsellInputs";

describe("mapDevicesModelListToUpsellInputs", () => {
  it("should map nano models and ignore unknown devices", () => {
    expect(mapDevicesModelListToUpsellInputs(["nanoS", "blue", "nanoX"])).toEqual({
      seenNanoModelIds: ["nanoS", "nanoX"],
      hasSeenTouchscreenDevice: false,
    });
  });

  it("should flag touchscreen devices without treating them as nanos", () => {
    expect(mapDevicesModelListToUpsellInputs(["nanoSP", "stax"])).toEqual({
      seenNanoModelIds: ["nanoSP"],
      hasSeenTouchscreenDevice: true,
    });
  });

  it("should return empty inputs for an empty device list", () => {
    expect(mapDevicesModelListToUpsellInputs([])).toEqual({
      seenNanoModelIds: [],
      hasSeenTouchscreenDevice: false,
    });
  });
});

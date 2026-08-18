import { getNanoOnlyDeviceModel } from "./getNanoOnlyDeviceModel";

describe("getNanoOnlyDeviceModel", () => {
  it("should return undefined when no devices have been seen", () => {
    expect(getNanoOnlyDeviceModel([])).toBeUndefined();
  });

  it("should return the seen nano when it is the only known device", () => {
    expect(getNanoOnlyDeviceModel(["nanoS"])).toBe("nanoS");
    expect(getNanoOnlyDeviceModel(["nanoSP"])).toBe("nanoSP");
    expect(getNanoOnlyDeviceModel(["nanoX"])).toBe("nanoX");
  });

  it("should prefer last seen nano when several nanos are known", () => {
    expect(getNanoOnlyDeviceModel(["nanoS", "nanoX"], "nanoX")).toBe("nanoX");
  });

  it("should return undefined when a large-screen device has been seen", () => {
    expect(getNanoOnlyDeviceModel(["nanoS", "stax"])).toBeUndefined();
    expect(getNanoOnlyDeviceModel(["europa"])).toBeUndefined();
    expect(getNanoOnlyDeviceModel(["apex"])).toBeUndefined();
  });
});

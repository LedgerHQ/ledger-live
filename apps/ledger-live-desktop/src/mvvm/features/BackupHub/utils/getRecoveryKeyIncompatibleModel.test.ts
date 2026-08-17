import { getRecoveryKeyIncompatibleModel } from "./getRecoveryKeyIncompatibleModel";

describe("getRecoveryKeyIncompatibleModel", () => {
  it("should return undefined when no devices have been seen", () => {
    expect(getRecoveryKeyIncompatibleModel([])).toBeUndefined();
  });

  it("should return the seen nano when it is the only known device", () => {
    expect(getRecoveryKeyIncompatibleModel(["nanoS"])).toBe("nanoS");
    expect(getRecoveryKeyIncompatibleModel(["nanoSP"])).toBe("nanoSP");
    expect(getRecoveryKeyIncompatibleModel(["nanoX"])).toBe("nanoX");
  });

  it("should prefer last seen nano when several nanos are known", () => {
    expect(getRecoveryKeyIncompatibleModel(["nanoS", "nanoX"], "nanoX")).toBe("nanoX");
  });

  it("should return undefined when a large-screen device has been seen", () => {
    expect(getRecoveryKeyIncompatibleModel(["nanoS", "stax"])).toBeUndefined();
    expect(getRecoveryKeyIncompatibleModel(["europa"])).toBeUndefined();
    expect(getRecoveryKeyIncompatibleModel(["apex"])).toBeUndefined();
  });
});

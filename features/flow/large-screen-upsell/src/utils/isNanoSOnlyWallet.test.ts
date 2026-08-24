import { isNanoSOnlyWallet } from "./isNanoSOnlyWallet";

describe("isNanoSOnlyWallet", () => {
  it("should be false when no devices have been seen", () => {
    expect(isNanoSOnlyWallet([])).toBe(false);
  });

  it("should be true when every seen device is nanoS", () => {
    expect(isNanoSOnlyWallet(["nanoS"])).toBe(true);
    expect(isNanoSOnlyWallet(["nanoS", "nanoS"])).toBe(true);
  });

  it("should be false when any other device has been seen", () => {
    expect(isNanoSOnlyWallet(["nanoSP"])).toBe(false);
    expect(isNanoSOnlyWallet(["nanoX"])).toBe(false);
    expect(isNanoSOnlyWallet(["nanoS", "nanoSP"])).toBe(false);
    expect(isNanoSOnlyWallet(["nanoS", "stax"])).toBe(false);
  });
});

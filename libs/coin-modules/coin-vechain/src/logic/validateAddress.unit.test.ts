import { isValidAddress, validateAddress } from "./validateAddress";

const VALID = "0x0fe6688548f0C303932bB197B0A96034f1d74dba";

describe("validateAddress", () => {
  it("returns true for a valid VeChain address", async () => {
    expect(isValidAddress(VALID)).toBe(true);
    await expect(validateAddress(VALID, {})).resolves.toBe(true);
  });

  it("returns false for a malformed address", async () => {
    expect(isValidAddress("0xnot-an-address")).toBe(false);
    await expect(validateAddress("0xnot-an-address", {})).resolves.toBe(false);
  });
});

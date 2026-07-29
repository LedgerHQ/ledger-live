import { isValidZcashAddress, validateAddress } from "./validateAddress";

describe("logic/validateAddress", () => {
  it("accepts a valid transparent t1 address", () => {
    expect(isValidZcashAddress("t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7F")).toBe(true);
  });

  it("rejects an empty address", () => {
    expect(isValidZcashAddress("")).toBe(false);
  });

  it("rejects a malformed address", () => {
    expect(isValidZcashAddress("not-an-address")).toBe(false);
  });

  it("rejects a t-address whose checksum does not hold", () => {
    // The valid address above with its last character changed: only Base58Check
    // catches this, the ZIP-316 classifier reads the prefix alone.
    expect(isValidZcashAddress("t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7G")).toBe(false);
  });

  it("rejects a Sapling zs1 address (unsupported)", () => {
    expect(
      isValidZcashAddress(
        "zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly",
      ),
    ).toBe(false);
  });

  it("validateAddress delegates to isValidZcashAddress", async () => {
    await expect(
      validateAddress("t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7F", { currencyId: "zcash", networkId: 1 }),
    ).resolves.toBe(true);
    await expect(validateAddress("invalid")).resolves.toBe(false);
  });
});

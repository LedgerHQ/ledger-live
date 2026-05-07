import { getValidateAddress } from "./validateAddress";

describe("validateAddress", () => {
  it.each(["evm", "stellar", "tezos", "xrp", "ripple"])(
    "returns address validation for '%s' network",
    network => {
      expect(getValidateAddress(network)).toBeInstanceOf(Function);
    },
  );

  it("fails on unknown network", () => {
    expect(() => getValidateAddress("unknown-network")).toThrow(
      "No validate address function for network unknown-network",
    );
  });
});

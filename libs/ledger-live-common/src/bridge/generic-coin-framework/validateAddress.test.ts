import { getValidateAddress } from "./validateAddress";

describe("validateAddress", () => {
  it.each(["evm", "stellar", "tezos", "xrp", "ripple"])(
    "returns address validation for '%s' network",
    async network => {
      const fn = await getValidateAddress(network);
      expect(fn).toBeInstanceOf(Function);
    },
  );

  it("fails on unknown network", async () => {
    await expect(getValidateAddress("unknown-network")).rejects.toThrow(
      "No validate address function for network unknown-network",
    );
  });
});

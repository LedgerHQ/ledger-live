import { DAPP_SELECTORS } from "../../selectors";

// A flat merge of 12 per-chain enums, so a later enum silently overwrites an earlier one.
describe("DAPP_SELECTORS", () => {
  it("never resolves a selector to the string 'undefined'", () => {
    const bogus = Object.entries(DAPP_SELECTORS).filter(([, name]) => name === "undefined");
    expect(bogus).toEqual([]);
  });

  it("has no empty or non-string names", () => {
    const invalid = Object.entries(DAPP_SELECTORS).filter(
      ([, name]) => typeof name !== "string" || name.length === 0,
    );
    expect(invalid).toEqual([]);
  });

  describe("ERC-4626 vault methods (stablecoin yield + staking deposits)", () => {
    it.each([
      ["0x6e553f65", "deposit"],
      ["0x94bf804d", "mint"],
      ["0xb460af94", "withdraw"],
      ["0x095ea7b3", "approve"],
    ])("%s -> %s", (selector, expected) => {
      expect(DAPP_SELECTORS[selector]).toBe(expected);
    });

    it("resolves redeem from BASE, which a typo'd ETHEREUM entry used to shadow", () => {
      expect(DAPP_SELECTORS["0xba087652"]).toBe("redeem");
    });
  });

  describe("ETH staking providers", () => {
    it.each([
      ["0xd0e30db0", "deposit"], // Kiln deposit()
      ["0xa1903eab", "submit"], // Lido submit(address)
      ["0xd6681042", "requestWithdrawals"], // Lido
      ["0xe3afe0a3", "claimWithdrawals"], // Lido
    ])("%s -> %s", (selector, expected) => {
      expect(DAPP_SELECTORS[selector]).toBe(expected);
    });
  });
});

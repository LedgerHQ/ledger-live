import { isTestnet } from "../../logic/isTestnet";

describe("isTestnet", () => {
  it("should return true for testnet currencies", () => {
    expect(isTestnet("aptos_testnet")).toBe(true);
  });

  it("should return false for mainnet currencies", () => {
    expect(isTestnet("aptos")).toBe(false);
  });
});

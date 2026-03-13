import { FEE_CURRENCY_BY_CONTRACT, FEE_CURRENCY_OPTIONS } from "../constants";

describe("celo fee currency constants", () => {
  it("defines CELO, USDT and USDC as fee currency options", () => {
    expect(FEE_CURRENCY_OPTIONS.map(option => option.name)).toEqual(["CELO", "USDT", "USDC"]);
  });

  it("keeps adapter address distinct from token contract for 6 decimals stablecoins", () => {
    const usdc = FEE_CURRENCY_OPTIONS.find(option => option.name === "USDC");
    const usdt = FEE_CURRENCY_OPTIONS.find(option => option.name === "USDT");

    expect(usdc?.adapterAddress).toBeDefined();
    expect(usdt?.adapterAddress).toBeDefined();
    expect(usdc?.adapterAddress).not.toEqual(usdc?.contractAddress);
    expect(usdt?.adapterAddress).not.toEqual(usdt?.contractAddress);
  });

  it("supports case-insensitive lookup by token contract address", () => {
    const usdc = FEE_CURRENCY_OPTIONS.find(option => option.name === "USDC");
    expect(usdc?.contractAddress).toBeDefined();

    const upperContract = usdc!.contractAddress!.toUpperCase();
    expect(FEE_CURRENCY_BY_CONTRACT.get(upperContract.toLowerCase())?.name).toBe("USDC");
  });
});


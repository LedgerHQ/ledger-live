import {
  FEE_CURRENCY_BY_CONTRACT,
  FEE_CURRENCY_OPTIONS,
  CELO_STABLE_TOKENS,
  getStableTokenRegistryName,
} from "../constants";

describe("celo fee currency constants", () => {
  it("includes CELO, USDT and USDC as fee currency options", () => {
    const names = FEE_CURRENCY_OPTIONS.map(option => option.name);
    expect(names).toContain("CELO");
    expect(names).toContain("USDT");
    expect(names).toContain("USDC");
  });

  it("lists all expected fee currency tokens", () => {
    const names = FEE_CURRENCY_OPTIONS.map(option => option.name);
    expect(names).toEqual([
      "CELO",
      "USDT",
      "USDC",
      "PHPm",
      "KESm",
      "ZARm",
      "AUDm",
      "XOFm",
      "USDm",
      "COPm",
      "GBPm",
      "WETH",
      "EURm",
      "NGNm",
      "CHFm",
      "JPYm",
      "BRLm",
      "GHSm",
      "CADm",
    ]);
  });

  it("keeps adapter address distinct from token contract for 6 decimals stablecoins", () => {
    const usdc = FEE_CURRENCY_OPTIONS.find(option => option.name === "USDC");
    const usdt = FEE_CURRENCY_OPTIONS.find(option => option.name === "USDT");

    expect(usdc?.adapterAddress).toEqual(expect.any(String));
    expect(usdt?.adapterAddress).toEqual(expect.any(String));
    expect(usdc?.adapterAddress).not.toEqual(usdc?.contractAddress);
    expect(usdt?.adapterAddress).not.toEqual(usdt?.contractAddress);
  });

  it("supports case-insensitive lookup by token contract address", () => {
    const usdc = FEE_CURRENCY_OPTIONS.find(option => option.name === "USDC");
    expect(usdc?.contractAddress).toEqual(expect.any(String));

    const upperContract = usdc!.contractAddress!.toUpperCase();
    expect(FEE_CURRENCY_BY_CONTRACT.get(upperContract.toLowerCase())?.name).toBe("USDC");
  });

  it("maps stable token tickers to registry contract names", () => {
    expect(getStableTokenRegistryName("cUSD")).toBe("StableToken");
    expect(getStableTokenRegistryName("cEUR")).toBe("StableTokenEUR");
    expect(getStableTokenRegistryName("cREAL")).toBe("StableTokenBRL");
    expect(CELO_STABLE_TOKENS).toEqual(expect.arrayContaining(["cUSD", "cEUR", "cREAL"]));
  });
});

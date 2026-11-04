import { sanitizeAssetNameForTestId } from "./sanitizeAssetNameForTestId";

describe("sanitizeAssetNameForTestId", () => {
  it("replaces spaces with hyphens and lowercases", () => {
    expect(sanitizeAssetNameForTestId("Bitcoin Cash")).toBe("bitcoin-cash");
  });

  it("lowercases mixed case", () => {
    expect(sanitizeAssetNameForTestId("EtHeReUm")).toBe("ethereum");
  });

  it("strips parentheses", () => {
    expect(sanitizeAssetNameForTestId("USD Coin (USDC)")).toBe("usd-coin-usdc");
  });

  it("strips underscores", () => {
    expect(sanitizeAssetNameForTestId("Test_Coin")).toBe("testcoin");
  });

  it("strips diacritics", () => {
    expect(sanitizeAssetNameForTestId("Café Token")).toBe("caf-token");
  });
});

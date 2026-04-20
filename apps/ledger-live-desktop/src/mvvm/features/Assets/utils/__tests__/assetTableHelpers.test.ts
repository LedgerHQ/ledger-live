import { sanitizeAssetNameForTestId } from "../assetTableHelpers";

describe("sanitizeAssetNameForTestId", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(sanitizeAssetNameForTestId("Bitcoin Cash")).toBe("bitcoin-cash");
  });

  it("normalizes mixed casing to lowercase", () => {
    expect(sanitizeAssetNameForTestId("EtHeReUm")).toBe("ethereum");
  });

  it("strips punctuation", () => {
    expect(sanitizeAssetNameForTestId("USD Coin (USDC)")).toBe("usd-coin-usdc");
  });

  it("removes characters outside a-z, 0-9, hyphen", () => {
    expect(sanitizeAssetNameForTestId("Test_Coin")).toBe("testcoin");
  });

  it("normalizes unicode / diacritics by removing non-alphanumeric segments", () => {
    expect(sanitizeAssetNameForTestId("Café Token")).toBe("caf-token");
  });
});

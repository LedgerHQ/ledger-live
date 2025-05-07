import { Currency } from "@ledgerhq/types-cryptoassets";
import { hasMemoDisclaimer } from "../hasMemoTag";

describe("hasMemoDisclaimer", () => {
  it("should return true for algorand currency", () => {
    const algorandCurrency = { type: "CryptoCurrency", family: "algorand" } as Currency;

    expect(hasMemoDisclaimer(algorandCurrency)).toBeTruthy();
  });

  it("should return true for algorand token", () => {
    const usdcAlgorandToken = {
      type: "TokenCurrency",
      parentCurrency: { type: "CryptoCurrency", family: "algorand" },
    } as Currency;

    expect(hasMemoDisclaimer(usdcAlgorandToken)).toBeTruthy();
  });

  it("should return false for internet computer currency", () => {
    const icpCurrency = { type: "CryptoCurrency", family: "internet_computer" } as Currency;

    expect(hasMemoDisclaimer(icpCurrency)).toBeFalsy();
  });

  it("should return false for ethereum token", () => {
    const usdcEthereumToken = {
      type: "TokenCurrency",
      parentCurrency: { type: "CryptoCurrency", family: "ethereum" },
    } as Currency;

    expect(hasMemoDisclaimer(usdcEthereumToken)).toBeFalsy();
  });
});

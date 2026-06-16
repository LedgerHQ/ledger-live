import { getCurrencyColor } from "./color";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

const defaultColor = "#999";

describe("getCurrencyColor", () => {
  it("returns the crypto currency's own color", () => {
    const eth = getCryptoCurrencyById("ethereum");
    expect(getCurrencyColor(eth)).toBe(eth.color);
  });

  it("falls back to the default color for a crypto currency without a color", () => {
    const noColor = { type: "CryptoCurrency", id: "x", ticker: "X" } as unknown as CryptoCurrency;
    expect(getCurrencyColor(noColor)).toBe(defaultColor);
  });

  it("resolves a token's color from its parentCurrencyId", () => {
    const eth = getCryptoCurrencyById("ethereum");
    const token = {
      type: "TokenCurrency",
      id: "ethereum/erc20/usdc",
      ticker: "USDC",
      parentCurrencyId: "ethereum",
    } as unknown as TokenCurrency;
    expect(getCurrencyColor(token)).toBe(eth.color);
  });

  it("falls back to the default color (without throwing) when the parentCurrencyId cannot be resolved", () => {
    const token = {
      type: "TokenCurrency",
      id: "unknown/erc20/x",
      ticker: "X",
      parentCurrencyId: "not_a_real_currency",
    } as unknown as TokenCurrency;
    expect(() => getCurrencyColor(token)).not.toThrow();
    expect(getCurrencyColor(token)).toBe(defaultColor);
  });
});

import { getCurrencyColor } from "./color";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { CryptoCurrencySchema, TokenCurrencySchema } from "@domain/entity-currency";

const defaultColor = "#999";

describe("getCurrencyColor", () => {
  it("returns the crypto currency's own color", () => {
    const eth = getCryptoCurrencyById("ethereum");
    expect(getCurrencyColor(eth)).toBe(eth.color);
  });

  it("falls back to the default color for a crypto currency without a color", () => {
    const noColor = CryptoCurrencySchema.parse({
      type: "CryptoCurrency",
      id: "testcoin",
      name: "Test Coin",
      ticker: "X",
      managerAppName: "TestCoin",
      coinType: 0,
      scheme: "testcoin",
      color: "",
      family: "testcoin",
      units: [{ name: "Test", code: "X", magnitude: 0 }],
      explorerViews: [],
    });
    expect(getCurrencyColor(noColor)).toBe(defaultColor);
  });

  it("resolves a token's color from its parentCurrencyId", () => {
    const eth = getCryptoCurrencyById("ethereum");
    const token = TokenCurrencySchema.parse({
      type: "TokenCurrency",
      id: "ethereum/erc20/usdc",
      ticker: "USDC",
      parentCurrencyId: "ethereum",
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      tokenType: "erc20",
      name: "USD Coin",
      units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
    });
    expect(getCurrencyColor(token)).toBe(eth.color);
  });

  it("falls back to the default color (without throwing) when the parentCurrencyId cannot be resolved", () => {
    const token = TokenCurrencySchema.parse({
      type: "TokenCurrency",
      id: "unknown/erc20/x",
      ticker: "X",
      parentCurrencyId: "not_a_real_currency",
      contractAddress: "0x0000000000000000000000000000000000000000",
      tokenType: "erc20",
      name: "Unknown Token",
      units: [{ name: "Unknown", code: "X", magnitude: 0 }],
    });
    expect(() => getCurrencyColor(token)).not.toThrow();
    expect(getCurrencyColor(token)).toBe(defaultColor);
  });
});

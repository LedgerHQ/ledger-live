import { TokenCurrencySchema } from "./schema";
import { mockTokenCurrency } from "./schema.mock";

describe("TokenCurrencySchema", () => {
  it("parses a valid token currency from mock factory", () => {
    const token = mockTokenCurrency();
    const result = TokenCurrencySchema.parse(token);
    expect(result.id).toBe("ethereum/erc20/usd-tether");
    expect(result.type).toBe("TokenCurrency");
  });

  it("requires at least one unit", () => {
    expect(() => TokenCurrencySchema.parse(mockTokenCurrency({ units: [] }))).toThrow();
  });

  it("rejects missing required fields", () => {
    const { contractAddress: _, ...withoutAddress } = mockTokenCurrency();
    expect(() => TokenCurrencySchema.parse(withoutAddress)).toThrow();
  });

  it("rejects wrong type discriminant", () => {
    expect(() =>
      TokenCurrencySchema.parse({ ...mockTokenCurrency(), type: "CryptoCurrency" }),
    ).toThrow();
  });

  it("accepts optional fields when provided", () => {
    const token = mockTokenCurrency({
      delisted: true,
      disableCountervalue: true,
      ledgerSignature: "3045022100abc",
    });
    const result = TokenCurrencySchema.parse(token);
    expect(result.delisted).toBe(true);
    expect(result.disableCountervalue).toBe(true);
    expect(result.ledgerSignature).toBe("3045022100abc");
  });

  it("optional fields default to undefined", () => {
    const result = TokenCurrencySchema.parse(mockTokenCurrency());
    expect(result.delisted).toBeUndefined();
    expect(result.disableCountervalue).toBeUndefined();
    expect(result.ledgerSignature).toBeUndefined();
  });

  it("parentCurrencyId is a string FK, not an embedded object", () => {
    const result = TokenCurrencySchema.parse(mockTokenCurrency());
    expect(typeof result.parentCurrencyId).toBe("string");
    expect(result.parentCurrencyId).toBe("ethereum");
  });
});

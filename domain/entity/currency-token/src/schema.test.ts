import { TokenCurrencyIdSchema, TokenCurrencySchema } from "./schema";
import { mockTokenCurrency } from "./schema.mock";

describe("TokenCurrencyIdSchema", () => {
  it("accepts a non-empty string", () => {
    expect(TokenCurrencyIdSchema.parse("ethereum/erc20/usd-tether")).toBe(
      "ethereum/erc20/usd-tether",
    );
  });
  it("rejects an empty string", () => {
    expect(() => TokenCurrencyIdSchema.parse("")).toThrow();
  });
});

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
      tokenIdentifier: "USDC-c76f1f",
    });
    const result = TokenCurrencySchema.parse(token);
    expect(result.delisted).toBe(true);
    expect(result.disableCountervalue).toBe(true);
    expect(result.ledgerSignature).toBe("3045022100abc");
    expect(result.tokenIdentifier).toBe("USDC-c76f1f");
  });

  it("optional fields default to undefined", () => {
    const result = TokenCurrencySchema.parse(mockTokenCurrency());
    expect(result.delisted).toBeUndefined();
    expect(result.disableCountervalue).toBeUndefined();
    expect(result.ledgerSignature).toBeUndefined();
    expect(result.tokenIdentifier).toBeUndefined();
  });

  it("parentCurrencyId is a string FK, not an embedded object", () => {
    const result = TokenCurrencySchema.parse(mockTokenCurrency());
    expect(typeof result.parentCurrencyId).toBe("string");
    expect(result.parentCurrencyId).toBe("ethereum");
  });
});

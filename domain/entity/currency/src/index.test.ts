import { CryptoOrTokenCurrencySchema, CurrencySchema } from "./index";
import { mockCryptoCurrency } from "@domain/entity-currency-crypto/schema.mock";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import { mockFiatCurrency } from "@domain/entity-currency-fiat/schema.mock";

describe("CryptoOrTokenCurrencySchema", () => {
  it("accepts a CryptoCurrency", () => {
    const result = CryptoOrTokenCurrencySchema.parse(mockCryptoCurrency());
    expect(result.type).toBe("CryptoCurrency");
  });

  it("accepts a TokenCurrency", () => {
    const result = CryptoOrTokenCurrencySchema.parse(mockTokenCurrency());
    expect(result.type).toBe("TokenCurrency");
  });

  it("rejects a FiatCurrency", () => {
    expect(() => CryptoOrTokenCurrencySchema.parse(mockFiatCurrency())).toThrow();
  });
});

describe("CurrencySchema", () => {
  it("accepts a CryptoCurrency", () => {
    const result = CurrencySchema.parse(mockCryptoCurrency());
    expect(result.type).toBe("CryptoCurrency");
  });

  it("accepts a TokenCurrency", () => {
    const result = CurrencySchema.parse(mockTokenCurrency());
    expect(result.type).toBe("TokenCurrency");
  });

  it("accepts a FiatCurrency", () => {
    const result = CurrencySchema.parse(mockFiatCurrency());
    expect(result.type).toBe("FiatCurrency");
  });

  it("rejects an unknown type", () => {
    expect(() => CurrencySchema.parse({ type: "Unknown", id: "x" })).toThrow();
  });
});

import { CRYPTO_CURRENCIES_IDS, CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { UnknownNetworkError } from "./errors";
import { NetworkIdSchema, currencyIdFromNetwork, networkFromCurrencyId } from "./network";

describe("currencyIdFromNetwork", () => {
  it.each(CRYPTO_CURRENCIES_IDS)("round-trips %s", id => {
    expect(currencyIdFromNetwork(networkFromCurrencyId(id))).toBe(id);
  });

  it("throws on an unknown network", () => {
    expect(() => currencyIdFromNetwork(NetworkIdSchema.parse("notachain"))).toThrow(
      UnknownNetworkError,
    );
  });

  it("throws on an unknown currency", () => {
    expect(() => networkFromCurrencyId(CryptoCurrencyIdSchema.parse("notachain"))).toThrow(
      UnknownNetworkError,
    );
  });
});

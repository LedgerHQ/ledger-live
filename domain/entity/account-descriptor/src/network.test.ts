import { CRYPTO_CURRENCIES_IDS, CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { UnknownNetworkError } from "./errors";
import {
  NetworkIdSchema,
  currencyIdFromNetwork,
  networkFromCurrencyId,
  toNetworkId,
} from "./network";

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

describe("toNetworkId", () => {
  it("reads a network id", () => {
    expect(toNetworkId("bitcoin_testnet")).toBe(NetworkIdSchema.parse("bitcoin_testnet"));
  });

  it.each(["", "bit coin", "ethereum:mainnet"])("throws UnknownNetworkError for %p", id => {
    expect(() => toNetworkId(id)).toThrow(new UnknownNetworkError(`Unknown network "${id}"`));
  });
});

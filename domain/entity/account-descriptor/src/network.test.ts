import { CRYPTO_CURRENCIES_IDS } from "@domain/entity-currency-crypto";
import { UnknownNetworkError } from "./errors";
import { currencyIdFromNetwork, networkFromCurrencyId } from "./network";

describe("currencyIdFromNetwork", () => {
  it.each(CRYPTO_CURRENCIES_IDS)("round-trips %s", id => {
    expect(currencyIdFromNetwork(networkFromCurrencyId(id))).toBe(id);
  });

  it("throws on an unknown network", () => {
    expect(() => currencyIdFromNetwork("notachain")).toThrow(UnknownNetworkError);
  });

  it("throws on an unknown currency", () => {
    expect(() => networkFromCurrencyId("notachain")).toThrow(UnknownNetworkError);
  });

  it("resolves the exact id only: LBRY, not lbry", () => {
    expect(currencyIdFromNetwork("LBRY")).toBe("LBRY");
    expect(() => currencyIdFromNetwork("lbry")).toThrow(UnknownNetworkError);
  });
});

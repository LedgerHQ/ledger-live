import { CRYPTO_CURRENCIES_REGISTRY, CRYPTO_CURRENCY_ALIASES } from "./registry";
import { findCryptoCurrencyById, getCryptoCurrencyById, hasCryptoCurrencyId } from "./accessors";

describe("findCryptoCurrencyById", () => {
  it("resolves a known id to its registry object", () => {
    expect(findCryptoCurrencyById("bitcoin")).toBe(CRYPTO_CURRENCIES_REGISTRY.bitcoin);
  });

  it("returns undefined for an unknown id", () => {
    expect(findCryptoCurrencyById("does_not_exist")).toBeUndefined();
  });

  it.each(Object.entries(CRYPTO_CURRENCY_ALIASES))(
    "resolves legacy alias %s to its canonical currency",
    (alias, id) => {
      expect(findCryptoCurrencyById(alias)).toBe(CRYPTO_CURRENCIES_REGISTRY[id]);
    },
  );
});

describe("getCryptoCurrencyById", () => {
  it("resolves a known id to its registry object", () => {
    expect(getCryptoCurrencyById("bitcoin")).toBe(CRYPTO_CURRENCIES_REGISTRY.bitcoin);
  });

  it("resolves a legacy alias key", () => {
    expect(getCryptoCurrencyById("osmosis")).toBe(CRYPTO_CURRENCIES_REGISTRY.osmo);
  });

  it("throws for an unknown id", () => {
    expect(() => getCryptoCurrencyById("does_not_exist")).toThrow(
      'currency with id "does_not_exist" not found',
    );
  });
});

describe("hasCryptoCurrencyId", () => {
  it("is true for a known id", () => {
    expect(hasCryptoCurrencyId("bitcoin")).toBe(true);
  });

  it("is true for a legacy alias key", () => {
    expect(hasCryptoCurrencyId("osmosis")).toBe(true);
  });

  it("is false for an unknown id", () => {
    expect(hasCryptoCurrencyId("does_not_exist")).toBe(false);
  });
});

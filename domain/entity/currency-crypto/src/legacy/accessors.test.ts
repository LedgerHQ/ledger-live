import { CRYPTO_CURRENCIES_REGISTRY, CRYPTO_CURRENCY_ALIASES } from "../registry";
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

// The registry is a normal object (Object.fromEntries), so a naive index read resolves inherited
// Object.prototype keys. These must be treated as unknown ids, not as currencies.
describe.each(["__proto__", "constructor", "toString", "hasOwnProperty", "valueOf"])(
  "does not resolve the Object.prototype key %s",
  key => {
    it("findCryptoCurrencyById returns undefined", () => {
      expect(findCryptoCurrencyById(key)).toBeUndefined();
    });

    it("hasCryptoCurrencyId returns false", () => {
      expect(hasCryptoCurrencyId(key)).toBe(false);
    });

    it("getCryptoCurrencyById throws", () => {
      expect(() => getCryptoCurrencyById(key)).toThrow();
    });
  },
);

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

import * as currencies from "./currencies";
import { CRYPTO_CURRENCIES_REGISTRY, CRYPTO_CURRENCIES_IDS } from "./registry";

describe("CRYPTO_CURRENCIES_REGISTRY", () => {
  it("is non-empty", () => {
    expect(Object.keys(CRYPTO_CURRENCIES_REGISTRY).length).toBeGreaterThan(0);
  });

  it("has no duplicate ids across currency files", () => {
    // Check at the source level — Object.fromEntries in the registry already
    // collapses duplicates, so checking registry keys cannot detect collisions.
    const seen = new Map<string, string>();
    for (const [varName, currency] of Object.entries(currencies)) {
      const existing = seen.get(currency.id);
      expect(existing).toBeUndefined(); // fail with conflicting var name if duplicate
      seen.set(currency.id, varName);
    }
  });

  it("every entry is keyed by its own id", () => {
    for (const [key, currency] of Object.entries(CRYPTO_CURRENCIES_REGISTRY)) {
      expect(currency.id).toBe(key);
    }
  });

  it("every entry has type CryptoCurrency and a non-empty id", () => {
    for (const currency of Object.values(CRYPTO_CURRENCIES_REGISTRY)) {
      expect(currency.type).toBe("CryptoCurrency");
      expect(currency.id.length).toBeGreaterThan(0);
    }
  });
});

describe("CRYPTO_CURRENCIES_IDS", () => {
  it("length matches registry", () => {
    expect(CRYPTO_CURRENCIES_IDS.length).toBe(Object.keys(CRYPTO_CURRENCIES_REGISTRY).length);
  });

  it("contains all registry ids", () => {
    const registryIds = new Set(Object.keys(CRYPTO_CURRENCIES_REGISTRY));
    for (const id of CRYPTO_CURRENCIES_IDS) {
      expect(registryIds.has(id)).toBe(true);
    }
  });
});

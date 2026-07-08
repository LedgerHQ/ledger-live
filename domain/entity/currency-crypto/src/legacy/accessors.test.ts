import { CRYPTO_CURRENCIES_REGISTRY, CRYPTO_CURRENCY_ALIASES } from "../registry";
import {
  findCryptoCurrencyById,
  getCryptoCurrencyById,
  hasCryptoCurrencyId,
  listCryptoCurrencies,
  findCryptoCurrency,
  findCryptoCurrencyByScheme,
  findCryptoCurrencyByTicker,
  findCryptoCurrencyByKeyword,
} from "./accessors";

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

describe("listCryptoCurrencies", () => {
  it("returns a non-empty array", () => {
    expect(listCryptoCurrencies().length).toBeGreaterThan(0);
  });

  it("includes bitcoin by default", () => {
    const list = listCryptoCurrencies();
    expect(list.some(c => c.id === "bitcoin")).toBe(true);
  });

  it("excludes testnet currencies by default", () => {
    const list = listCryptoCurrencies();
    expect(list.every(c => !c.isTestnetFor)).toBe(true);
  });

  it("includes testnet currencies when withDevCrypto = true", () => {
    const all = listCryptoCurrencies(true);
    expect(all.some(c => c.id === "ethereum_sepolia")).toBe(true);
  });

  it("ethereum_sepolia is absent by default but present with withDevCrypto", () => {
    expect(listCryptoCurrencies().some(c => c.id === "ethereum_sepolia")).toBe(false);
    expect(listCryptoCurrencies(true).some(c => c.id === "ethereum_sepolia")).toBe(true);
  });

  it("returns the same registry object references (not copies)", () => {
    const [first] = listCryptoCurrencies();
    expect(first).toBe(CRYPTO_CURRENCIES_REGISTRY[first.id]);
  });
});

describe("findCryptoCurrency", () => {
  it("returns the first currency matching the predicate", () => {
    const result = findCryptoCurrency(c => c.id === "bitcoin");
    expect(result).toBe(CRYPTO_CURRENCIES_REGISTRY.bitcoin);
  });

  it("returns undefined when no currency matches", () => {
    expect(findCryptoCurrency(() => false)).toBeUndefined();
  });

  it("searches testnet currencies too", () => {
    const result = findCryptoCurrency(c => c.id === "ethereum_sepolia");
    expect(result).toBeDefined();
    expect(result?.isTestnetFor).toBe("ethereum");
  });
});

describe("findCryptoCurrencyByScheme", () => {
  it("resolves a known scheme to its registry object", () => {
    expect(findCryptoCurrencyByScheme("bitcoin")).toBe(CRYPTO_CURRENCIES_REGISTRY.bitcoin);
  });

  it("returns undefined for an unknown scheme", () => {
    expect(findCryptoCurrencyByScheme("does_not_exist")).toBeUndefined();
  });

  it("returns undefined when scheme is undefined", () => {
    expect(findCryptoCurrencyByScheme(undefined)).toBeUndefined();
  });

  it.each(["__proto__", "constructor", "toString"])(
    "returns undefined for the Object.prototype key %s",
    key => {
      expect(findCryptoCurrencyByScheme(key)).toBeUndefined();
    },
  );
});

describe("findCryptoCurrencyByTicker", () => {
  it("resolves an unambiguous ticker to its registry object", () => {
    // BTC is unique — only bitcoin holds it
    expect(findCryptoCurrencyByTicker("BTC")).toBe(CRYPTO_CURRENCIES_REGISTRY.bitcoin);
  });

  it("returns undefined for an unknown ticker", () => {
    expect(findCryptoCurrencyByTicker("DOES_NOT_EXIST")).toBeUndefined();
  });

  it("excludes testnet currencies from ticker resolution", () => {
    // ethereum_sepolia has ticker "ETH" but isTestnetFor is set — it must not win
    const result = findCryptoCurrencyByTicker("ETH");
    expect(result?.isTestnetFor).toBeUndefined();
  });

  it.each(["__proto__", "constructor", "toString"])(
    "returns undefined for the Object.prototype key %s",
    key => {
      expect(findCryptoCurrencyByTicker(key)).toBeUndefined();
    },
  );
});

describe("findCryptoCurrencyByKeyword", () => {
  it("matches by currency name (case-insensitive, whitespace stripped)", () => {
    expect(findCryptoCurrencyByKeyword("bitcoin")).toBe(CRYPTO_CURRENCIES_REGISTRY.bitcoin);
  });

  it("normalises multi-space inputs (Bitcoin Cash searched with extra space)", () => {
    // "bitcoin  cash" → strip all whitespace → "bitcoincash"; "Bitcoin Cash".replace → "BitcoinCash" → match
    const result = findCryptoCurrencyByKeyword("bitcoin  cash", ["name"]);
    expect(result?.id).toBe("bitcoin_cash");
  });

  it("matches by currency id", () => {
    // id strategy lowercases the search term
    expect(findCryptoCurrencyByKeyword("BITCOIN", ["id"])).toBe(CRYPTO_CURRENCIES_REGISTRY.bitcoin);
  });

  it("matches by ticker", () => {
    // ticker strategy uppercases the search term
    expect(findCryptoCurrencyByKeyword("btc", ["ticker"])).toBe(CRYPTO_CURRENCIES_REGISTRY.bitcoin);
  });

  it("matches by manager app name", () => {
    expect(findCryptoCurrencyByKeyword("bitcoin", ["manager"])).toBe(
      CRYPTO_CURRENCIES_REGISTRY.bitcoin,
    );
  });

  it("returns undefined when no strategy matches", () => {
    expect(findCryptoCurrencyByKeyword("zzz_no_match_zzz")).toBeUndefined();
  });

  it("respects a custom tests array and skips unlisted strategies", () => {
    // "bitcoin" matches by name but not by ticker — restricting to ticker only yields undefined
    expect(findCryptoCurrencyByKeyword("bitcoin", ["ticker"])).toBeUndefined();
  });

  it("returns the first match across strategies in order", () => {
    // "bitcoin" matches both keywords (if present) and name; either way result is bitcoin
    const result = findCryptoCurrencyByKeyword("bitcoin");
    expect(result).toBeDefined();
    expect(result?.id).toBe("bitcoin");
  });
});

import type { CryptoAssetMeta } from "@domain/entity-aggregated-asset";
import {
  allSettled,
  assertDadaApiHost,
  chunkCurrencyIds,
  deepMergeCryptoAssets,
  emptyAssetsData,
} from "./utils";

const makeIds = (n: number, prefix = "cur") => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

describe("chunkCurrencyIds", () => {
  it("should return an empty array when given no IDs", () => {
    expect(chunkCurrencyIds([])).toEqual([]);
  });

  it("should return a single chunk with one ID", () => {
    expect(chunkCurrencyIds(["bitcoin"])).toEqual([["bitcoin"]]);
  });

  it("should keep 25 IDs in one chunk with default size", () => {
    const ids = makeIds(25);
    expect(chunkCurrencyIds(ids).map(c => c.length)).toEqual([25]);
  });

  it("should split 75 IDs into 3 chunks of 25", () => {
    const ids = makeIds(75);
    const chunks = chunkCurrencyIds(ids);

    expect(chunks.map(c => c.length)).toEqual([25, 25, 25]);
    expect(chunks.flat()).toEqual(ids);
  });

  it("should handle a non-divisible count (last chunk smaller)", () => {
    const ids = makeIds(30);
    const chunks = chunkCurrencyIds(ids);

    expect(chunks.map(c => c.length)).toEqual([25, 5]);
    expect(chunks.flat()).toEqual(ids);
  });

  it("should respect a custom chunk size", () => {
    const ids = makeIds(10, "id");
    const chunks = chunkCurrencyIds(ids, 3);

    expect(chunks.map(c => c.length)).toEqual([3, 3, 3, 1]);
  });

  it.each([0, -1, NaN, Infinity])("should throw RangeError for invalid size %s", size => {
    expect(() => chunkCurrencyIds(["a"], size)).toThrow(RangeError);
  });
});

type MetaMap = Record<string, CryptoAssetMeta>;

const makeMeta = (id: string, assetsIds: Record<string, string>): CryptoAssetMeta => ({
  id,
  ticker: id.toUpperCase(),
  name: id,
  assetsIds,
});

describe("deepMergeCryptoAssets", () => {
  it("should add new meta-currencies from source", () => {
    const target: MetaMap = {};
    deepMergeCryptoAssets(target, { eth: makeMeta("eth", { ethereum: "ethereum" }) });

    expect(target.eth.assetsIds).toEqual({ ethereum: "ethereum" });
  });

  it("should merge assetsIds when same meta-currency exists in both", () => {
    const target: MetaMap = { eth: makeMeta("eth", { ethereum: "ethereum" }) };
    deepMergeCryptoAssets(target, { eth: makeMeta("eth", { arbitrum: "arbitrum", base: "base" }) });

    expect(target.eth.assetsIds).toEqual({
      ethereum: "ethereum",
      arbitrum: "arbitrum",
      base: "base",
    });
  });

  it("should overwrite assetsIds entries from source", () => {
    const target: MetaMap = { eth: makeMeta("eth", { ethereum: "ethereum-v1" }) };
    deepMergeCryptoAssets(target, {
      eth: makeMeta("eth", { ethereum: "ethereum-v2", optimism: "optimism" }),
    });

    expect(target.eth.assetsIds.ethereum).toBe("ethereum-v2");
    expect(target.eth.assetsIds.optimism).toBe("optimism");
  });

  it("should handle both new and existing meta-currencies in one call", () => {
    const target: MetaMap = { eth: makeMeta("eth", { ethereum: "ethereum" }) };
    deepMergeCryptoAssets(target, {
      eth: makeMeta("eth", { arbitrum: "arbitrum" }),
      btc: makeMeta("btc", { bitcoin: "bitcoin" }),
    });

    expect(Object.keys(target)).toEqual(["eth", "btc"]);
    expect(target.eth.assetsIds).toEqual({ ethereum: "ethereum", arbitrum: "arbitrum" });
    expect(target.btc.assetsIds).toEqual({ bitcoin: "bitcoin" });
  });

  it("should be a no-op for empty source", () => {
    const target: MetaMap = { eth: makeMeta("eth", { ethereum: "ethereum" }) };
    deepMergeCryptoAssets(target, {});

    expect(target.eth.assetsIds).toEqual({ ethereum: "ethereum" });
  });

  it("should populate empty target from source", () => {
    const target: MetaMap = {};
    const source = { btc: makeMeta("btc", { bitcoin: "bitcoin" }) };
    deepMergeCryptoAssets(target, source);

    expect(target.btc).toEqual(source.btc);
  });
});

describe("emptyAssetsData", () => {
  it("returns every collection, all empty", () => {
    expect(emptyAssetsData()).toEqual({
      cryptoAssets: {},
      networks: {},
      cryptoOrTokenCurrencies: {},
      interestRates: {},
      markets: {},
      currenciesOrder: { metaCurrencyIds: [], key: "", order: "" },
    });
  });

  /*
   * Load-bearing: the chunked lookup endpoint uses this as a reduce seed and then mutates the
   * accumulator in place. A shared instance would leak merged assets between queries.
   */
  it("returns a fresh object on every call", () => {
    const first = emptyAssetsData();
    const second = emptyAssetsData();

    expect(first).not.toBe(second);
    expect(first.cryptoAssets).not.toBe(second.cryptoAssets);
    expect(first.currenciesOrder).not.toBe(second.currenciesOrder);
    expect(first.currenciesOrder.metaCurrencyIds).not.toBe(second.currenciesOrder.metaCurrencyIds);
  });

  it("is not affected by mutating a previous result", () => {
    const first = emptyAssetsData();
    first.cryptoAssets.btc = { id: "btc", ticker: "BTC", name: "Bitcoin", assetsIds: {} };
    first.currenciesOrder.metaCurrencyIds.push("btc");

    expect(emptyAssetsData().cryptoAssets).toEqual({});
    expect(emptyAssetsData().currenciesOrder.metaCurrencyIds).toEqual([]);
  });
});

describe("assertDadaApiHost", () => {
  it.each(["https://dada.api.ledger.com/assets", "https://dada.api.ledger-test.com/assets"])(
    "allows the known DADA host %s",
    href => {
      expect(() => assertDadaApiHost(href)).not.toThrow();
    },
  );

  /*
   * This guards the endpoints that build their own `fetch` instead of going through `baseQuery`,
   * so a mis-resolved base url cannot send the request to another host.
   */
  it.each([
    "https://evil.example.com/assets",
    "https://dada.api.ledger.com.evil.example.com/assets",
    "https://ledger.com/assets",
  ])("blocks %s", href => {
    expect(() => assertDadaApiHost(href)).toThrow(/untrusted host/);
  });

  it("names the rejected hostname in the error", () => {
    expect(() => assertDadaApiHost("https://evil.example.com/assets")).toThrow(
      "Blocked request to untrusted host: evil.example.com",
    );
  });

  it("matches on hostname only, ignoring port and protocol", () => {
    expect(() => assertDadaApiHost("http://dada.api.ledger.com:8080/x")).not.toThrow();
  });
});

describe("allSettled", () => {
  it("resolves an empty list", async () => {
    await expect(allSettled([])).resolves.toEqual([]);
  });

  it("reports fulfilled values in input order", async () => {
    const results = await allSettled([Promise.resolve("a"), Promise.resolve("b")]);

    expect(results).toEqual([
      { status: "fulfilled", value: "a" },
      { status: "fulfilled", value: "b" },
    ]);
  });

  /*
   * Load-bearing: the chunked lookup endpoint returns partial results when a chunk fails, and
   * portfolio distribution depends on that. A rejection must never reject the batch.
   */
  it("does not reject when one promise rejects", async () => {
    const boom = new Error("boom");
    const results = await allSettled([
      Promise.resolve("ok"),
      Promise.reject(boom),
      Promise.resolve("also ok"),
    ]);

    expect(results).toEqual([
      { status: "fulfilled", value: "ok" },
      { status: "rejected", reason: boom },
      { status: "fulfilled", value: "also ok" },
    ]);
  });

  it("reports every rejection when all fail", async () => {
    const results = await allSettled([Promise.reject("x"), Promise.reject("y")]);

    expect(results.every(r => r.status === "rejected")).toBe(true);
  });

  it("preserves input order regardless of settle timing", async () => {
    const slow = new Promise(resolve => setTimeout(() => resolve("slow"), 10));
    const fast = Promise.resolve("fast");

    const results = await allSettled([slow, fast]);

    expect(results.map(r => (r.status === "fulfilled" ? r.value : r.reason))).toEqual([
      "slow",
      "fast",
    ]);
  });
});

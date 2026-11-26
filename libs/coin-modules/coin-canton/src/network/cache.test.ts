import type { CantonCoinConfig } from "../config";
import { createMockCoinConfigValue } from "../test/fixtures";
import { makeConfigurableLRUCache } from "./cache";

const configWithTtl = (ttl: number): CantonCoinConfig =>
  createMockCoinConfigValue({ calTokensCacheTtlMs: ttl });

const makeCache = () => {
  const fetch = jest.fn(async (_config: CantonCoinConfig, key: string) => `${key}-value`);
  const cached = makeConfigurableLRUCache(
    fetch,
    (_config: CantonCoinConfig, key: string) => key,
    config => config.calTokensCacheTtlMs ?? 60_000,
  );
  return { fetch, cached };
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("makeConfigurableLRUCache", () => {
  it("caches within the configured TTL", async () => {
    const { fetch, cached } = makeCache();

    await cached(configWithTtl(60_000), "a");
    await cached(configWithTtl(60_000), "a");

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  // lru-cache reads the clock directly, so a real short TTL is used instead of fake timers.
  it("reads again once the configured TTL has passed", async () => {
    const { fetch, cached } = makeCache();

    await cached(configWithTtl(1), "a");
    await sleep(5);
    await cached(configWithTtl(1), "a");

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("keeps the entries of another TTL", async () => {
    const { fetch, cached } = makeCache();

    await cached(configWithTtl(60_000), "a");
    await cached(configWithTtl(120_000), "b");
    await cached(configWithTtl(60_000), "a");

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("reads again when the TTL switches back, not the entry of the earlier TTL", async () => {
    const { fetch, cached } = makeCache();
    fetch.mockResolvedValueOnce("old").mockResolvedValueOnce("new").mockResolvedValueOnce("newest");

    await cached(configWithTtl(60_000), "a");
    await cached(configWithTtl(120_000), "a");

    await expect(cached(configWithTtl(60_000), "a")).resolves.toBe("newest");
  });

  it("clears the key", async () => {
    const { fetch, cached } = makeCache();
    await cached(configWithTtl(60_000), "a");

    cached.clear("a");
    await cached(configWithTtl(60_000), "a");

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("drops the oldest TTL's cache beyond four TTLs", async () => {
    const { fetch, cached } = makeCache();
    for (const ttl of [10_000, 20_000, 30_000, 40_000, 50_000]) {
      await cached(configWithTtl(ttl), String(ttl));
    }

    await cached(configWithTtl(50_000), "50000");
    await cached(configWithTtl(20_000), "20000");
    await cached(configWithTtl(10_000), "10000");

    expect(fetch).toHaveBeenCalledTimes(6);
  });

  it("keeps a TTL in use when a fifth one arrives", async () => {
    const { fetch, cached } = makeCache();
    for (const ttl of [10_000, 20_000, 30_000, 40_000]) {
      await cached(configWithTtl(ttl), String(ttl));
    }
    await cached(configWithTtl(10_000), "10000");

    await cached(configWithTtl(50_000), "50000");
    await cached(configWithTtl(10_000), "10000");

    expect(fetch).toHaveBeenCalledTimes(5);
  });

  it("drops every entry on reset", async () => {
    const { fetch, cached } = makeCache();
    await cached(configWithTtl(60_000), "a");

    cached.reset();
    await cached(configWithTtl(60_000), "a");

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

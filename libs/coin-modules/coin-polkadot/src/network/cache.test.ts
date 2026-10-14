import { makeConfigurableLRUCache } from "./cache";

const buildCache = (ttlMsOf: (id: string) => number) => {
  const fetcher = jest.fn(async (id: string) => `fetched-${id}`);
  const cache = makeConfigurableLRUCache(fetcher, id => id, ttlMsOf);
  return { fetcher, cache };
};

describe("makeConfigurableLRUCache", () => {
  it("reuses the cached value while the ttl is unchanged", async () => {
    const { fetcher, cache } = buildCache(() => 1000);

    await cache("a");
    await cache("a");

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("serves hydrated values whatever the ttl resolved from the config", async () => {
    const { fetcher, cache } = buildCache(() => 4242);
    cache.hydrate("a", "hydrated");

    const value = await cache("a");

    expect(value).toEqual("hydrated");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("serves values hydrated before the first call", async () => {
    const { cache } = buildCache(() => 1000);
    cache.hydrate("a", "early");

    expect(await cache("a")).toEqual("early");
  });

  it("keeps hydrated values when the resolved ttl changes", async () => {
    let ttlMs = 1000;
    const { fetcher, cache } = buildCache(() => ttlMs);
    cache.hydrate("a", "hydrated");
    await cache("a");

    ttlMs = 2000;

    expect(await cache("a")).toEqual("hydrated");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("drops cached fetches when the resolved ttl changes", async () => {
    let ttlMs = 1000;
    const { fetcher, cache } = buildCache(() => ttlMs);
    await cache("b");

    ttlMs = 2000;
    await cache("b");

    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

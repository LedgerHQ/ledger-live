import network from "@ledgerhq/live-network";

import { __resetSpotPriceCacheForTests, fetchSpotPrices } from "./fetchSpotPrices";

jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedNetwork = network as jest.MockedFunction<typeof network>;

function networkOk(data: Record<string, number> | null): Awaited<ReturnType<typeof network>> {
  return { data } as unknown as Awaited<ReturnType<typeof network>>;
}

describe("fetchSpotPrices", () => {
  beforeEach(() => {
    mockedNetwork.mockReset();
    __resetSpotPriceCacheForTests();
    jest.useRealTimers();
  });

  it("returns the Ledger countervalues payload keyed by currency id", async () => {
    mockedNetwork.mockResolvedValueOnce(networkOk({ ethereum: 3200, bitcoin: 65000 }));

    const result = await fetchSpotPrices({
      currencyIds: ["ethereum", "bitcoin"],
      counterValue: "usd",
    });

    expect(result).toEqual({ ethereum: 3200, bitcoin: 65000 });
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
    const [call] = mockedNetwork.mock.calls;
    expect(call[0]).toMatchObject({ method: "GET" });
    expect(call[0].url).toContain("/v3/spot/simple");
    expect(call[0].url).toContain("froms=ethereum%2Cbitcoin");
    expect(call[0].url).toContain("to=usd");
  });

  it("dedupes + strips undefined/empty currency ids and lowercases the counter value", async () => {
    mockedNetwork.mockResolvedValueOnce(networkOk({ ethereum: 3200 }));

    await fetchSpotPrices({
      currencyIds: ["ethereum", "ethereum", undefined, ""],
      counterValue: "USD",
    });

    const [call] = mockedNetwork.mock.calls;
    expect(call[0].url).toContain("froms=ethereum");
    expect(call[0].url).not.toContain("froms=ethereum%2Cethereum");
    expect(call[0].url).toContain("to=usd");
  });

  it("short-circuits to {} when no currency ids are provided", async () => {
    const result = await fetchSpotPrices({
      currencyIds: [undefined, ""],
      counterValue: "usd",
    });

    expect(result).toEqual({});
    expect(mockedNetwork).not.toHaveBeenCalled();
  });

  it("swallows network failures and returns {}", async () => {
    mockedNetwork.mockRejectedValueOnce(new Error("boom"));

    const result = await fetchSpotPrices({
      currencyIds: ["ethereum"],
      counterValue: "usd",
    });

    expect(result).toEqual({});
  });

  it("returns {} when the payload is not a record", async () => {
    mockedNetwork.mockResolvedValueOnce(networkOk(null));

    const result = await fetchSpotPrices({
      currencyIds: ["ethereum"],
      counterValue: "usd",
    });

    expect(result).toEqual({});
  });

  it("serves subsequent calls within TTL entirely from cache", async () => {
    mockedNetwork.mockResolvedValueOnce(networkOk({ ethereum: 3200, bitcoin: 65000 }));

    const first = await fetchSpotPrices({
      currencyIds: ["ethereum", "bitcoin"],
      counterValue: "usd",
    });
    const second = await fetchSpotPrices({
      currencyIds: ["ethereum", "bitcoin"],
      counterValue: "usd",
    });

    expect(first).toEqual({ ethereum: 3200, bitcoin: 65000 });
    expect(second).toEqual({ ethereum: 3200, bitcoin: 65000 });
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });

  it("only fetches the missing subset on partial cache hits", async () => {
    mockedNetwork.mockResolvedValueOnce(networkOk({ ethereum: 3200 }));

    await fetchSpotPrices({
      currencyIds: ["ethereum"],
      counterValue: "usd",
    });

    mockedNetwork.mockResolvedValueOnce(networkOk({ bitcoin: 65000 }));

    const merged = await fetchSpotPrices({
      currencyIds: ["ethereum", "bitcoin"],
      counterValue: "usd",
    });

    expect(merged).toEqual({ ethereum: 3200, bitcoin: 65000 });
    expect(mockedNetwork).toHaveBeenCalledTimes(2);
    const [, secondCall] = mockedNetwork.mock.calls;
    expect(secondCall[0].url).toContain("froms=bitcoin");
    expect(secondCall[0].url).not.toContain("ethereum");
  });

  it("re-fetches entries once the TTL expires", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-01T00:00:00Z"));

    mockedNetwork.mockResolvedValueOnce(networkOk({ ethereum: 3200 }));
    await fetchSpotPrices({
      currencyIds: ["ethereum"],
      counterValue: "usd",
    });

    // 31s later — past the 30s TTL → cache miss → new fetch.
    jest.setSystemTime(new Date("2026-01-01T00:00:31Z"));
    mockedNetwork.mockResolvedValueOnce(networkOk({ ethereum: 3300 }));

    const refreshed = await fetchSpotPrices({
      currencyIds: ["ethereum"],
      counterValue: "usd",
    });

    expect(refreshed).toEqual({ ethereum: 3300 });
    expect(mockedNetwork).toHaveBeenCalledTimes(2);
  });

  it("keeps usd and eur cache entries isolated", async () => {
    mockedNetwork.mockResolvedValueOnce(networkOk({ ethereum: 3200 }));
    await fetchSpotPrices({
      currencyIds: ["ethereum"],
      counterValue: "usd",
    });

    mockedNetwork.mockResolvedValueOnce(networkOk({ ethereum: 2900 }));
    const eur = await fetchSpotPrices({
      currencyIds: ["ethereum"],
      counterValue: "eur",
    });

    expect(eur).toEqual({ ethereum: 2900 });
    expect(mockedNetwork).toHaveBeenCalledTimes(2);
    const [, eurCall] = mockedNetwork.mock.calls;
    expect(eurCall[0].url).toContain("to=eur");
  });

  it("evicts expired entries on read so the cache stays bounded", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-01T00:00:00Z"));

    mockedNetwork.mockResolvedValueOnce(networkOk({ ethereum: 3200 }));
    await fetchSpotPrices({
      currencyIds: ["ethereum"],
      counterValue: "usd",
    });

    jest.setSystemTime(new Date("2026-01-01T00:00:31Z"));
    mockedNetwork.mockRejectedValueOnce(new Error("boom"));
    const after = await fetchSpotPrices({
      currencyIds: ["ethereum"],
      counterValue: "usd",
    });
    expect(after).toEqual({});

    // A second post-eviction read should not see the stale cache entry
    // resurface — even when the network call fails again the result stays
    // empty because the expired hit was deleted, not just bypassed.
    mockedNetwork.mockRejectedValueOnce(new Error("boom"));
    const again = await fetchSpotPrices({
      currencyIds: ["ethereum"],
      counterValue: "usd",
    });
    expect(again).toEqual({});
  });

  it("returns cache hits even when the fetch for missing ids fails", async () => {
    mockedNetwork.mockResolvedValueOnce(networkOk({ ethereum: 3200 }));
    await fetchSpotPrices({
      currencyIds: ["ethereum"],
      counterValue: "usd",
    });

    mockedNetwork.mockRejectedValueOnce(new Error("boom"));

    const result = await fetchSpotPrices({
      currencyIds: ["ethereum", "bitcoin"],
      counterValue: "usd",
    });

    expect(result).toEqual({ ethereum: 3200 });
  });
});

import { collectAllByCategory } from "./collectAllByCategory";
import { AssetCategory, type GetAssetsByCategoryParams } from "../types";
import type { RawApiResponse } from "../schema";

/*
 * `@shared/env` is mocked because the Domain Test CI job installs only ./domain/** and ./shared/**,
 * which leaves the underlying @ledgerhq/live-env unresolvable.
 */
jest.mock("@shared/env", () => ({
  getEnv: jest.fn((name: string) =>
    name === "DADA_API_STAGING"
      ? "https://dada.api.ledger-test.com/v1"
      : "https://dada.api.ledger.com/v1",
  ),
}));

const queryArg: GetAssetsByCategoryParams = {
  category: AssetCategory.Stocks,
  product: "llm",
  version: "1.0.0",
};

const rawWith = (tickers: string[]): RawApiResponse => ({
  cryptoAssets: Object.fromEntries(
    tickers.map(t => [t, { id: t, ticker: t.toUpperCase(), name: t, assetsIds: {} }]),
  ),
  networks: {},
  cryptoOrTokenCurrencies: {},
  interestRates: {},
  markets: {},
  currenciesOrder: { key: "marketCap", order: "desc", metaCurrencyIds: [] },
});

const tickersOf = (data: RawApiResponse) => Object.values(data.cryptoAssets).map(a => a.ticker);

function page(body: RawApiResponse, nextCursor?: string): Response {
  const headers = new Headers();
  if (nextCursor) headers.set("x-ledger-next", nextCursor);
  return new Response(JSON.stringify(body), { status: 200, headers });
}

describe("collectAllByCategory", () => {
  let fetchSpy: jest.SpyInstance;

  const urls = () => fetchSpy.mock.calls.map(c => new URL(c[0] as string));

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("returns the projection of a single page", async () => {
    fetchSpy.mockResolvedValueOnce(page(rawWith(["aaplx"])));

    const result = await collectAllByCategory(queryArg, tickersOf);

    expect(result).toEqual({ data: ["AAPLX"] });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("sends the category, product, version and a fixed page size", async () => {
    fetchSpy.mockResolvedValueOnce(page(rawWith([])));

    await collectAllByCategory(queryArg, tickersOf);

    const url = urls()[0];
    expect(url.pathname).toBe("/v1/assets");
    expect(url.searchParams.get("categories")).toBe("stocks");
    expect(url.searchParams.get("product")).toBe("llm");
    expect(url.searchParams.get("minVersion")).toBe("1.0.0");
    expect(url.searchParams.get("pageSize")).toBe("100");
  });

  it("does not send a cursor on the first request", async () => {
    fetchSpy.mockResolvedValueOnce(page(rawWith([])));

    await collectAllByCategory(queryArg, tickersOf);

    expect(urls()[0].searchParams.has("cursor")).toBe(false);
  });

  it("walks every page and concatenates the projections in order", async () => {
    fetchSpy
      .mockResolvedValueOnce(page(rawWith(["aaplx"]), "cursor-2"))
      .mockResolvedValueOnce(page(rawWith(["teslax"]), "cursor-3"))
      .mockResolvedValueOnce(page(rawWith(["nvdax"])));

    const result = await collectAllByCategory(queryArg, tickersOf);

    expect(result).toEqual({ data: ["AAPLX", "TESLAX", "NVDAX"] });
    expect(urls().map(u => u.searchParams.get("cursor"))).toEqual([null, "cursor-2", "cursor-3"]);
  });

  it("stops when the next-cursor header is absent", async () => {
    fetchSpy
      .mockResolvedValueOnce(page(rawWith(["aaplx"]), "cursor-2"))
      .mockResolvedValueOnce(page(rawWith(["teslax"])));

    await collectAllByCategory(queryArg, tickersOf);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("targets staging when asked", async () => {
    fetchSpy.mockResolvedValueOnce(page(rawWith([])));

    await collectAllByCategory({ ...queryArg, isStaging: true }, tickersOf);

    expect(urls()[0].hostname).toBe("dada.api.ledger-test.com");
  });

  it("returns the http status as an error and stops walking", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response("nope", { status: 500, statusText: "Internal Server Error" }),
    );

    const result = await collectAllByCategory(queryArg, tickersOf);

    expect(result.error).toEqual({
      status: 500,
      data: "Failed to fetch assets by category: Internal Server Error",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("discards pages already collected when a later page fails", async () => {
    fetchSpy
      .mockResolvedValueOnce(page(rawWith(["aaplx"]), "cursor-2"))
      .mockResolvedValueOnce(new Response("nope", { status: 502, statusText: "Bad Gateway" }));

    const result = await collectAllByCategory(queryArg, tickersOf);

    expect(result.data).toBeUndefined();
    expect(result.error).toMatchObject({ status: 502 });
  });

  it("maps a thrown network failure to a FETCH_ERROR", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("offline"));

    const result = await collectAllByCategory(queryArg, tickersOf);

    expect(result.error).toEqual({ status: "FETCH_ERROR", error: "offline" });
  });

  it("maps a non-Error rejection to a FETCH_ERROR", async () => {
    fetchSpy.mockRejectedValueOnce("just a string");

    const result = await collectAllByCategory(queryArg, tickersOf);

    expect(result.error).toEqual({ status: "FETCH_ERROR", error: "Unknown error" });
  });
});

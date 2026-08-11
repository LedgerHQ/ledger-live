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

/** A page as the base query returns it: parsed body plus the raw response for header access. */
function page(body: RawApiResponse, nextCursor?: string) {
  const headers = new Headers();
  if (nextCursor) headers.set("x-ledger-next", nextCursor);
  return { data: body, meta: { response: { headers } } };
}

describe("collectAllByCategory", () => {
  let baseQuery: jest.Mock;

  /** The request descriptors handed to the base query, one per page walked. */
  const requests = () =>
    baseQuery.mock.calls.map(c => c[0] as { url: string; params: Record<string, unknown> });

  beforeEach(() => {
    baseQuery = jest.fn();
  });

  it("returns the projection of a single page", async () => {
    baseQuery.mockResolvedValueOnce(page(rawWith(["aaplx"])));

    const result = await collectAllByCategory(queryArg, baseQuery, tickersOf);

    expect(result).toEqual({ data: ["AAPLX"] });
    expect(baseQuery).toHaveBeenCalledTimes(1);
  });

  it("sends the category, product, version and a fixed page size", async () => {
    baseQuery.mockResolvedValueOnce(page(rawWith([])));

    await collectAllByCategory(queryArg, baseQuery, tickersOf);

    const { url, params } = requests()[0];
    expect(url).toBe("https://dada.api.ledger.com/v1/assets");
    expect(params).toMatchObject({
      categories: "stocks",
      product: "llm",
      minVersion: "1.0.0",
      pageSize: 100,
    });
  });

  it("does not send a cursor on the first request", async () => {
    baseQuery.mockResolvedValueOnce(page(rawWith([])));

    await collectAllByCategory(queryArg, baseQuery, tickersOf);

    expect(requests()[0].params).not.toHaveProperty("cursor");
  });

  it("walks every page and concatenates the projections in order", async () => {
    baseQuery
      .mockResolvedValueOnce(page(rawWith(["aaplx"]), "cursor-2"))
      .mockResolvedValueOnce(page(rawWith(["teslax"]), "cursor-3"))
      .mockResolvedValueOnce(page(rawWith(["nvdax"])));

    const result = await collectAllByCategory(queryArg, baseQuery, tickersOf);

    expect(result).toEqual({ data: ["AAPLX", "TESLAX", "NVDAX"] });
    expect(requests().map(r => r.params.cursor)).toEqual([undefined, "cursor-2", "cursor-3"]);
  });

  it("stops when the next-cursor header is absent", async () => {
    baseQuery
      .mockResolvedValueOnce(page(rawWith(["aaplx"]), "cursor-2"))
      .mockResolvedValueOnce(page(rawWith(["teslax"])));

    await collectAllByCategory(queryArg, baseQuery, tickersOf);

    expect(baseQuery).toHaveBeenCalledTimes(2);
  });

  it("targets staging when asked", async () => {
    baseQuery.mockResolvedValueOnce(page(rawWith([])));

    await collectAllByCategory({ ...queryArg, isStaging: true }, baseQuery, tickersOf);

    expect(requests()[0].url).toBe("https://dada.api.ledger-test.com/v1/assets");
  });

  /*
   * The base query owns error shaping now, so its result is returned verbatim rather than being
   * re-wrapped as a FETCH_ERROR — an HTTP failure keeps its numeric status.
   */
  it("returns the base query's error and stops walking", async () => {
    baseQuery.mockResolvedValueOnce({ error: { status: 500, data: "Internal Server Error" } });

    const result = await collectAllByCategory(queryArg, baseQuery, tickersOf);

    expect(result.error).toEqual({ status: 500, data: "Internal Server Error" });
    expect(baseQuery).toHaveBeenCalledTimes(1);
  });

  it("discards pages already collected when a later page fails", async () => {
    baseQuery
      .mockResolvedValueOnce(page(rawWith(["aaplx"]), "cursor-2"))
      .mockResolvedValueOnce({ error: { status: 502, data: "Bad Gateway" } });

    const result = await collectAllByCategory(queryArg, baseQuery, tickersOf);

    expect(result.data).toBeUndefined();
    expect(result.error).toMatchObject({ status: 502 });
  });

  it("passes a network failure through as the base query reported it", async () => {
    baseQuery.mockResolvedValueOnce({ error: { status: "FETCH_ERROR", error: "offline" } });

    const result = await collectAllByCategory(queryArg, baseQuery, tickersOf);

    expect(result.error).toEqual({ status: "FETCH_ERROR", error: "offline" });
  });

  it("rejects an untrusted base url before issuing any request", async () => {
    const { getEnv } = jest.requireMock("@shared/env");
    getEnv.mockReturnValueOnce("https://evil.example.com/v1");

    const result = await collectAllByCategory(queryArg, baseQuery, tickersOf);

    expect(result.error).toMatchObject({ status: "CUSTOM_ERROR" });
    expect(result.error).toMatchObject({ error: expect.stringContaining("evil.example.com") });
    expect(baseQuery).not.toHaveBeenCalled();
  });
});

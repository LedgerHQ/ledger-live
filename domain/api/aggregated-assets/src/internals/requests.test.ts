import { fetchAssetsPage, resolveBaseUrl } from "./requests";
import type { GetAssetsDataParams } from "../types";
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

const params = (overrides: Partial<GetAssetsDataParams> = {}): GetAssetsDataParams => ({
  product: "llm",
  version: "1.0.0",
  ...overrides,
});

const emptyRaw: RawApiResponse = {
  cryptoAssets: {},
  networks: {},
  cryptoOrTokenCurrencies: {},
  interestRates: {},
  markets: {},
  currenciesOrder: { key: "marketCap", order: "desc", metaCurrencyIds: [] },
};

describe("resolveBaseUrl", () => {
  it("uses the prod url by default", () => {
    expect(resolveBaseUrl({})).toBe("https://dada.api.ledger.com/v1");
  });

  it("uses the prod url when isStaging is false", () => {
    expect(resolveBaseUrl({ isStaging: false })).toBe("https://dada.api.ledger.com/v1");
  });

  it("uses the staging url when isStaging is true", () => {
    expect(resolveBaseUrl({ isStaging: true })).toBe("https://dada.api.ledger-test.com/v1");
  });
});

describe("fetchAssetsPage", () => {
  let baseQuery: jest.Mock;

  const request = () =>
    baseQuery.mock.calls[0][0] as { url: string; params: Record<string, unknown> };

  beforeEach(() => {
    baseQuery = jest.fn().mockResolvedValue({ data: emptyRaw });
  });

  it("targets the /assets path on the resolved base url", async () => {
    await fetchAssetsPage(baseQuery, params());

    expect(request().url).toBe("https://dada.api.ledger.com/v1/assets");
  });

  it("passes the query params to the base query rather than building a url", async () => {
    await fetchAssetsPage(baseQuery, params({ currencyIds: ["bitcoin", "ethereum"] }));

    expect(request().params).toMatchObject({
      currencyIds: ["bitcoin", "ethereum"],
      product: "llm",
      minVersion: "1.0.0",
      pageSize: 100,
    });
  });

  it("omits absent params instead of sending them undefined", async () => {
    await fetchAssetsPage(baseQuery, params());

    expect(request().params).not.toHaveProperty("search");
  });

  it("returns the response with currencies converted", async () => {
    const result = await fetchAssetsPage(baseQuery, params());

    expect(result.cryptoOrTokenCurrencies).toEqual({});
    expect(result.currenciesOrder).toEqual(emptyRaw.currenciesOrder);
  });

  /*
   * Rethrows the base query's own error object so the chunked endpoint can return it verbatim,
   * which is how an HTTP failure keeps its numeric status instead of collapsing to FETCH_ERROR.
   */
  it("rethrows the base query's error when the request fails", async () => {
    baseQuery.mockResolvedValue({ error: { status: 503, data: "Service Unavailable" } });

    await expect(fetchAssetsPage(baseQuery, params())).rejects.toEqual({
      status: 503,
      data: "Service Unavailable",
    });
  });

  it("refuses an untrusted base url before issuing any request", async () => {
    const { getEnv } = jest.requireMock("@shared/env");
    getEnv.mockReturnValueOnce("https://evil.example.com/v1");

    await expect(fetchAssetsPage(baseQuery, params())).rejects.toThrow(
      "Blocked request to untrusted host: evil.example.com",
    );
    expect(baseQuery).not.toHaveBeenCalled();
  });
});

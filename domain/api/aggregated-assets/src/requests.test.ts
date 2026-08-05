import { fetchAssetsPage, resolveBaseUrl } from "./requests";
import type { GetAssetsDataParams } from "./types";
import type { RawApiResponse } from "./schema";

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
  const baseUrl = "https://dada.api.ledger.com/v1";
  let fetchSpy: jest.SpyInstance;

  const respondWith = (body: unknown, init?: ResponseInit) => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify(body), { status: 200, ...init }));
  };

  const requestedUrl = () => new URL(fetchSpy.mock.calls[0][0] as string);

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("targets the /assets path on the given base url", async () => {
    respondWith(emptyRaw);

    await fetchAssetsPage(baseUrl, params());

    expect(requestedUrl().pathname).toBe("/v1/assets");
  });

  it("serialises the query params onto the url", async () => {
    respondWith(emptyRaw);

    await fetchAssetsPage(baseUrl, params({ currencyIds: ["bitcoin", "ethereum"] }));

    const url = requestedUrl();
    expect(url.searchParams.get("currencyIds")).toBe("bitcoin,ethereum");
    expect(url.searchParams.get("product")).toBe("llm");
    expect(url.searchParams.get("minVersion")).toBe("1.0.0");
    expect(url.searchParams.get("pageSize")).toBe("100");
  });

  it("omits undefined params rather than sending the string 'undefined'", async () => {
    respondWith(emptyRaw);

    await fetchAssetsPage(baseUrl, params());

    expect(requestedUrl().searchParams.has("search")).toBe(false);
  });

  it("returns the response with currencies converted", async () => {
    respondWith(emptyRaw);

    const result = await fetchAssetsPage(baseUrl, params());

    expect(result.cryptoOrTokenCurrencies).toEqual({});
    expect(result.currenciesOrder).toEqual(emptyRaw.currenciesOrder);
  });

  it("throws with the status when the response is not ok", async () => {
    fetchSpy.mockResolvedValue(
      new Response("nope", { status: 503, statusText: "Service Unavailable" }),
    );

    await expect(fetchAssetsPage(baseUrl, params())).rejects.toThrow(
      "DADA fetch failed: 503 Service Unavailable",
    );
  });

  /*
   * This endpoint builds its own url instead of going through `baseQuery`, so the host guard is
   * the only thing standing between a mis-resolved base url and a request to another host.
   */
  it("refuses to fetch from an untrusted host", async () => {
    await expect(fetchAssetsPage("https://evil.example.com", params())).rejects.toThrow(
      "Blocked request to untrusted host: evil.example.com",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

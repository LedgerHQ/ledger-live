import { fetchAllAssetsByCategory, buildAssetsQueryParams } from "../api";
import { AssetCategory } from "../types";
import type { RawApiResponse } from "../../entities";
import { getEnv } from "@ledgerhq/live-env";

jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn().mockReturnValue("https://dada.api.ledger.com/v1"),
}));

const getEnvMock = jest.mocked(getEnv);

function makePage(tickers: string[]): RawApiResponse {
  const cryptoAssets: RawApiResponse["cryptoAssets"] = {};
  for (const ticker of tickers) {
    cryptoAssets[ticker.toLowerCase()] = {
      id: ticker.toLowerCase(),
      ticker,
      name: ticker,
      assetsIds: {},
    };
  }
  return {
    cryptoAssets,
    networks: {},
    cryptoOrTokenCurrencies: {},
    interestRates: {},
    markets: {},
    currenciesOrder: { key: "marketCap", order: "desc", metaCurrencyIds: [] },
  };
}

function okResponse(body: RawApiResponse, nextCursor?: string): Response {
  const headers = new Headers();
  if (nextCursor) headers.set("x-ledger-next", nextCursor);
  return new Response(JSON.stringify(body), { status: 200, headers });
}

function errorResponse(status: number, statusText: string): Response {
  return new Response(null, { status, statusText });
}

function mockFetchPages(pages: { tickers: string[]; nextCursor?: string }[]): jest.SpyInstance {
  const spy = jest.spyOn(globalThis, "fetch");
  for (const page of pages) {
    spy.mockResolvedValueOnce(okResponse(makePage(page.tickers), page.nextCursor));
  }
  return spy;
}

const defaultArgs = {
  category: AssetCategory.Stablecoins,
  product: "lld" as const,
  version: "1.0.0",
};

const baseQueryArg = { product: "lld" as const, version: "1.0.0" };

describe("buildAssetsQueryParams", () => {
  it.each([
    {
      scenario: "standard IDs unchanged",
      input: ["ethereum/erc20/usdc", "ton/jetton/some_address", "bitcoin"],
      expected: ["ethereum/erc20/usdc", "ton/jetton/some_address", "bitcoin"],
    },
    {
      scenario: "Stellar lowercased",
      input: ["stellar/asset/USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"],
      expected: ["stellar/asset/usdc:ga5zsejyb37jrc5avcia5mop4rhtm335x2kgx3ihojapp5re34k4kzvn"],
    },
    {
      scenario: "MultiversX renamed to elrond",
      input: ["multiversx/esdt/USDC-c76f1f"],
      expected: ["elrond/esdt/USDC-c76f1f"],
    },
    {
      scenario: "mixed array transformed independently",
      input: [
        "ethereum/erc20/usdc",
        "stellar/asset/USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        "multiversx/esdt/USDC-c76f1f",
        "bitcoin",
      ],
      expected: [
        "ethereum/erc20/usdc",
        "stellar/asset/usdc:ga5zsejyb37jrc5avcia5mop4rhtm335x2kgx3ihojapp5re34k4kzvn",
        "elrond/esdt/USDC-c76f1f",
        "bitcoin",
      ],
    },
  ])("should transform currencyIds: $scenario", ({ input, expected }) => {
    const params = buildAssetsQueryParams({ ...baseQueryArg, currencyIds: input });
    expect(params.currencyIds).toEqual(expected);
  });

  it("should omit currencyIds when empty or not provided", () => {
    expect(
      buildAssetsQueryParams({ ...baseQueryArg, currencyIds: [] }).currencyIds,
    ).toBeUndefined();
    expect(buildAssetsQueryParams(baseQueryArg).currencyIds).toBeUndefined();
  });
});

describe("fetchAllAssetsByCategory", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should aggregate tickers from 3 pages using x-ledger-next cursor", async () => {
    const spy = mockFetchPages([
      { tickers: ["USDT", "USDC"], nextCursor: "cursor-2" },
      { tickers: ["DAI", "BUSD"], nextCursor: "cursor-3" },
      { tickers: ["TUSD", "FRAX"] },
    ]);

    const result = await fetchAllAssetsByCategory(defaultArgs);

    expect(result).toEqual({ data: ["USDT", "USDC", "DAI", "BUSD", "TUSD", "FRAX"] });
    expect(spy).toHaveBeenCalledTimes(3);

    expect(new URL(String(spy.mock.calls[0][0])).searchParams.has("cursor")).toBe(false);
    expect(new URL(String(spy.mock.calls[1][0])).searchParams.get("cursor")).toBe("cursor-2");
    expect(new URL(String(spy.mock.calls[2][0])).searchParams.get("cursor")).toBe("cursor-3");
  });

  it("should return error and stop when a page fails", async () => {
    const spy = jest.spyOn(globalThis, "fetch");
    spy.mockResolvedValueOnce(okResponse(makePage(["USDT"]), "cursor-2"));
    spy.mockResolvedValueOnce(errorResponse(502, "Bad Gateway"));

    const result = await fetchAllAssetsByCategory(defaultArgs);

    expect(result).toEqual({
      error: { status: 502, data: "Failed to fetch assets by category: Bad Gateway" },
    });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("should return FETCH_ERROR on network failure", async () => {
    jest.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network failure"));

    const result = await fetchAllAssetsByCategory(defaultArgs);

    expect(result).toEqual({
      error: { status: "FETCH_ERROR", error: "Network failure" },
    });
  });

  it("should block requests to untrusted hosts", async () => {
    getEnvMock.mockImplementation(() => "https://evil.example.com/v1");
    const spy = jest.spyOn(globalThis, "fetch");

    const result = await fetchAllAssetsByCategory(defaultArgs);

    expect(result).toEqual({
      error: {
        status: "FETCH_ERROR",
        error: "Blocked request to untrusted host: evil.example.com",
      },
    });
    expect(spy).not.toHaveBeenCalled();
  });
});

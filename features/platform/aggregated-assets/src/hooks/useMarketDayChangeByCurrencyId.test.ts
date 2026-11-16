/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { useGetChunkedAssetsDataQuery } from "@domain/api-aggregated-assets";
import { useMarketDayChangeByCurrencyId } from "./useMarketDayChangeByCurrencyId";

jest.mock("@domain/api-aggregated-assets", () => ({
  ...jest.requireActual("@domain/api-aggregated-assets"),
  useGetChunkedAssetsDataQuery: jest.fn(),
}));

const mockUseGetChunkedAssetsDataQuery = jest.mocked(useGetChunkedAssetsDataQuery);

const baseParams = { product: "lld" as const, version: "1.0.0" };

function mockData(data: unknown) {
  mockUseGetChunkedAssetsDataQuery.mockReturnValue({ data } as unknown as ReturnType<
    typeof useGetChunkedAssetsDataQuery
  >);
}

describe("useMarketDayChangeByCurrencyId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockData(undefined);
  });

  it("looks up exactly the given currencies, deduplicated and sorted", () => {
    renderHook(() =>
      useMarketDayChangeByCurrencyId({
        ...baseParams,
        currencyIds: ["ethereum", "bitcoin", "ethereum"],
        pollingInterval: 60_000,
        skipPollingIfUnfocused: true,
      }),
    );

    expect(mockUseGetChunkedAssetsDataQuery).toHaveBeenCalledWith(
      { ...baseParams, currencyIds: ["bitcoin", "ethereum"] },
      expect.objectContaining({
        skip: false,
        pollingInterval: 60_000,
        skipPollingIfUnfocused: true,
      }),
    );
  });

  it("refetches cached currencies when the screen is mounted again", () => {
    renderHook(() => useMarketDayChangeByCurrencyId({ ...baseParams, currencyIds: ["bitcoin"] }));

    expect(mockUseGetChunkedAssetsDataQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ refetchOnMountOrArgChange: true }),
    );
  });

  it("skips the lookup when there is no currency", () => {
    renderHook(() => useMarketDayChangeByCurrencyId({ ...baseParams, currencyIds: [] }));

    expect(mockUseGetChunkedAssetsDataQuery).toHaveBeenCalledWith(
      { ...baseParams, currencyIds: [] },
      expect.objectContaining({ skip: true }),
    );
  });

  it("maps a meta-currency market onto the held ledger currency id", () => {
    mockData({
      markets: { "urn:crypto:meta-currency:applex": { priceChangePercentage24h: 2 } },
      cryptoAssets: {
        "urn:crypto:meta-currency:applex": { assetsIds: { solana: "solana/spl/applex" } },
      },
    });

    const { result } = renderHook(() =>
      useMarketDayChangeByCurrencyId({ ...baseParams, currencyIds: ["solana/spl/applex"] }),
    );

    expect(result.current.get("solana/spl/applex")).toBe(2);
  });
});

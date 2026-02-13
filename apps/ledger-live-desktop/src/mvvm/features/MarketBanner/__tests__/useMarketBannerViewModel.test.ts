import { renderHook } from "tests/testSetup";
import { useMarketBannerViewModel } from "../hooks/useMarketBannerViewModel";
import { useMarketPerformers } from "@ledgerhq/live-common/market/hooks/useMarketPerformers";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { MOCK_MARKET_PERFORMERS } from "@ledgerhq/live-common/market/utils/fixtures";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";

jest.mock("@ledgerhq/live-common/market/hooks/useMarketPerformers");
jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog");
jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index");

const mockedUseMarketPerformers = jest.mocked(useMarketPerformers);

function mockPerformersQuery(
  overrides: Partial<{
    data: MarketItemPerformer[];
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
  }>,
) {
  mockedUseMarketPerformers.mockReturnValue({
    data: undefined,
    isLoading: false,
    isFetching: false,
    isError: false,
    ...overrides,
  } as ReturnType<typeof useMarketPerformers>);
}

describe("useMarketBannerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    jest.mocked(useRampCatalog).mockReturnValue({
      isCurrencyAvailable: () => true,
    } as unknown as ReturnType<typeof useRampCatalog>);

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    jest.mocked(useFetchCurrencyAll).mockReturnValue({
      data: ["bitcoin", "ethereum", "solana"],
    } as unknown as ReturnType<typeof useFetchCurrencyAll>);
  });

  describe("isLoading", () => {
    it("should be true during the initial load (no cached data)", () => {
      mockPerformersQuery({ isLoading: true, isFetching: true });

      const { result } = renderHook(() => useMarketBannerViewModel());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toEqual([]);
    });

    it("should be true when fetching without any cached data", () => {
      mockPerformersQuery({ isFetching: true });

      const { result } = renderHook(() => useMarketBannerViewModel());

      expect(result.current.isLoading).toBe(true);
    });

    it("should be false during a background refetch when data already exists", () => {
      mockPerformersQuery({ data: MOCK_MARKET_PERFORMERS, isFetching: true });

      const { result } = renderHook(() => useMarketBannerViewModel());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data.length).toBeGreaterThan(0);
    });

    it("should be false when data is loaded and the query is idle", () => {
      mockPerformersQuery({ data: MOCK_MARKET_PERFORMERS });

      const { result } = renderHook(() => useMarketBannerViewModel());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data.length).toBeGreaterThan(0);
    });
  });

  describe("isError", () => {
    it("should be true when the query errors and is not refetching", () => {
      mockPerformersQuery({ isError: true });

      const { result } = renderHook(() => useMarketBannerViewModel());

      expect(result.current.isError).toBe(true);
    });

    it("should be suppressed while a refetch is in progress", () => {
      mockPerformersQuery({ isError: true, isFetching: true });

      const { result } = renderHook(() => useMarketBannerViewModel());

      expect(result.current.isError).toBe(false);
    });
  });
});

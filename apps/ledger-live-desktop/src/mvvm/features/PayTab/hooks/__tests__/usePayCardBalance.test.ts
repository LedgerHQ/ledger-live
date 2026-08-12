import { renderHook } from "tests/testSetup";
import {
  createMockCategorizedAssets,
  STABLECOIN_ASSET,
} from "@ledgerhq/asset-aggregation/mocks/categorizedAssets.mock";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { usePayCardBalance } from "../usePayCardBalance";

const mockUseCategorizedAssetsFromPortfolio = jest.fn();

jest.mock("LLD/hooks/useCategorizedAssets", () => ({
  useCategorizedAssetsFromPortfolio: (...args: unknown[]) =>
    mockUseCategorizedAssetsFromPortfolio(...args),
}));

const initialState = { settings: { ...AFTER_ONBOARDING_STATE, counterValue: "USD" } };

function mockPortfolioResult(overrides: Record<string, unknown> = {}) {
  mockUseCategorizedAssetsFromPortfolio.mockReturnValue({
    categorizedAssets: createMockCategorizedAssets(),
    isLoadingStablecoinTickers: false,
    isStablecoinTickersError: false,
    stablecoinTickers: [],
    isLoadingStocks: false,
    isStocksError: false,
    ...overrides,
  });
}

describe("usePayCardBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPortfolioResult();
  });

  it("should sum the stablecoin countervalues when filter is all", () => {
    mockPortfolioResult({
      categorizedAssets: {
        cryptos: [],
        stocks: [],
        stablecoins: [
          { ...STABLECOIN_ASSET, value: 1000 },
          { ...STABLECOIN_ASSET, value: 250.5 },
        ],
      },
    });

    const { result } = renderHook(() => usePayCardBalance(), { initialState });

    expect(result.current.stableBalance).toBe(1250.5);
    expect(result.current.status).toBe("ready");
  });

  it("should sum only the matching stablecoin when filter is a currencyId", () => {
    const usdt = {
      ...STABLECOIN_ASSET,
      currency: { ...STABLECOIN_ASSET.currency, id: "ethereum/erc20/usdt" },
      value: 250.5,
    };

    mockPortfolioResult({
      categorizedAssets: {
        cryptos: [],
        stocks: [],
        stablecoins: [{ ...STABLECOIN_ASSET, value: 1000 }, usdt],
      },
    });

    const { result } = renderHook(() => usePayCardBalance(), {
      initialState: {
        ...initialState,
        payCard: { balanceFilter: "ethereum/erc20/usdc" },
      },
    });

    expect(result.current.stableBalance).toBe(1000);
    expect(result.current.filter).toBe("ethereum/erc20/usdc");
  });

  it("should report loading while stablecoin tickers load", () => {
    mockPortfolioResult({ isLoadingStablecoinTickers: true });

    const { result } = renderHook(() => usePayCardBalance(), { initialState });

    expect(result.current.status).toBe("loading");
  });

  it("should report error when the stablecoin tickers fail", () => {
    mockPortfolioResult({ isStablecoinTickersError: true });

    const { result } = renderHook(() => usePayCardBalance(), { initialState });

    expect(result.current.status).toBe("error");
  });

  it("should default the filter to all", () => {
    const { result } = renderHook(() => usePayCardBalance(), { initialState });

    expect(result.current.filter).toBe("all");
  });

  it("should format a countervalue in the counter currency", () => {
    const { result } = renderHook(() => usePayCardBalance(), { initialState });

    const formatted = result.current.formatCountervalue(1000);

    expect(formatted).toBeDefined();
  });
});

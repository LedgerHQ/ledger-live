import { act, renderHook } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { AssetsDistribution, DistributionItem } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { track } from "~/analytics";
import { useDistribution } from "~/actions/general";
import { State } from "~/reducers/types";
import {
  mockBitcoinCurrency,
  mockCardanoCurrency,
  mockEthereumCurrency,
  usdcToken,
} from "../../../../../__integrations__/shared";
import { useAllocationsViewModel } from "../useAllocationsViewModel";

jest.mock("~/actions/general", () => ({
  useDistribution: jest.fn(),
}));

const mockUseDistribution = jest.mocked(useDistribution);

function distributionRow(
  currency: CryptoCurrency | TokenCurrency,
  distribution: number,
  amount: number,
): DistributionItem {
  return {
    currency,
    distribution,
    amount,
    accounts: [],
  };
}

function mockAssetsDistribution(list: DistributionItem[]): AssetsDistribution {
  return {
    isAvailable: true,
    showFirst: list.length,
    sum: list.reduce((acc, row) => acc + (row.countervalue ?? row.amount), 0),
    list,
  };
}

describe("useAllocationsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call track and onPress when goToAnalyticsAllocations runs", () => {
    mockUseDistribution.mockReturnValue(
      mockAssetsDistribution([distributionRow(mockBitcoinCurrency, 1, 1)]),
    );

    const onPress = jest.fn();
    const { result } = renderHook(() => useAllocationsViewModel("Analytics", onPress));

    act(() => {
      result.current.goToAnalyticsAllocations();
    });

    expect(track).toHaveBeenCalledWith("analytics_clicked", {
      analytics: "Allocations",
      page: "Analytics",
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should return the same list reference when every entry passes the filter and there are at most four rows", () => {
    const list = [
      distributionRow(mockBitcoinCurrency, 0.5, 1),
      distributionRow(mockEthereumCurrency, 0.5, 1),
    ];
    mockUseDistribution.mockReturnValue(mockAssetsDistribution(list));

    const { result } = renderHook(() => useAllocationsViewModel("Analytics", jest.fn()));

    expect(result.current.distributionListFormatted).toBe(list);
  });

  it("should aggregate tail assets into an others row when more than four currencies are in the distribution", () => {
    const polkadot = getCryptoCurrencyById("polkadot");
    const litecoin = getCryptoCurrencyById("litecoin");
    const list = [
      distributionRow(mockBitcoinCurrency, 0.1, 1),
      distributionRow(mockEthereumCurrency, 0.1, 1),
      distributionRow(mockCardanoCurrency, 0.1, 1),
      distributionRow(polkadot, 0.1, 1),
      distributionRow(litecoin, 0.1, 1),
    ];
    mockUseDistribution.mockReturnValue(mockAssetsDistribution(list));

    const { result } = renderHook(() => useAllocationsViewModel("Analytics", jest.fn()));

    const formatted = result.current.distributionListFormatted;
    expect(formatted).toHaveLength(4);
    expect(formatted[3]?.currency.id).toBe("others");
    expect(formatted[3]?.distribution).toBeCloseTo(0.2, 5);
    expect(formatted[3]?.amount).toBe(2);
  });

  it("should chunk allocation rows into pairs for the caption columns", () => {
    const list = [
      distributionRow(mockBitcoinCurrency, 0.25, 1),
      distributionRow(mockEthereumCurrency, 0.25, 1),
      distributionRow(mockCardanoCurrency, 0.5, 1),
    ];
    mockUseDistribution.mockReturnValue(mockAssetsDistribution(list));

    const { result } = renderHook(() => useAllocationsViewModel("Analytics", jest.fn()));

    expect(result.current.allocationColumns).toHaveLength(2);
    expect(result.current.allocationColumns[0]).toHaveLength(2);
    expect(result.current.allocationColumns[1]).toHaveLength(1);
  });

  it("should omit blacklisted tokens from the formatted list", () => {
    const list = [
      distributionRow(mockBitcoinCurrency, 0.5, 1),
      distributionRow(mockEthereumCurrency, 0.25, 1),
      distributionRow(usdcToken, 0.25, 1),
    ];
    mockUseDistribution.mockReturnValue(mockAssetsDistribution(list));

    const { result } = renderHook(() => useAllocationsViewModel("Analytics", jest.fn()), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          blacklistedTokenIds: [usdcToken.id],
        },
      }),
    });

    const formatted = result.current.distributionListFormatted;
    expect(formatted.some(r => r.currency.id === usdcToken.id)).toBe(false);
    expect(formatted.some(r => r.currency.id === mockBitcoinCurrency.id)).toBe(true);
    expect(formatted.some(r => r.currency.id === mockEthereumCurrency.id)).toBe(true);
  });
});

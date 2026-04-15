/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useAssetDistribution } from "../useAssetDistribution";
import type { Account, AssetsDistribution } from "@ledgerhq/types-live";
import type { CryptoCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";

const mockCvState = {} as CounterValuesState;
jest.mock("@ledgerhq/live-countervalues-react", () => ({
  useCountervaluesState: () => mockCvState,
}));

const mockBuildAssetDistribution = jest.fn<AssetsDistribution, unknown[]>();
jest.mock("@ledgerhq/asset-aggregation/assetDistribution/index", () => ({
  buildAssetDistribution: (...args: unknown[]) => mockBuildAssetDistribution(...args),
}));

const mockUseChunkedAssetsData = jest.fn();
jest.mock("../../dada-client/hooks/useChunkedAssetsData", () => ({
  useChunkedAssetsData: (...args: unknown[]) => mockUseChunkedAssetsData(...args),
}));

const makeCryptoCurrency = (id: string, ticker: string) =>
  ({ type: "CryptoCurrency", id, ticker }) as unknown as CryptoCurrency;

const makeFiatCurrency = (id: string, ticker: string) =>
  ({ type: "FiatCurrency", id, ticker }) as unknown as Currency;

const makeAccount = (id: string, currency: CryptoCurrency) =>
  ({
    type: "Account",
    id,
    currency,
    balance: { toNumber: () => 100, isGreaterThan: () => true },
    subAccounts: [],
  }) as unknown as Account;

const btc = makeCryptoCurrency("bitcoin", "BTC");
const eth = makeCryptoCurrency("ethereum", "ETH");
const usd = makeFiatCurrency("usd", "USD");

const accounts = [makeAccount("acc-btc", btc), makeAccount("acc-eth", eth)];
const baseOpts = { accounts, to: usd, product: "lld" as const, version: "1.0.0" };

const assetResult: AssetsDistribution = {
  isAvailable: true,
  list: [
    {
      currency: btc,
      distribution: 0.7,
      accounts: [],
      amount: 100,
      countervalue: 7000,
      metaCurrencyId: "bitcoin",
      slug: "bitcoin",
    },
  ],
  showFirst: 1,
  sum: 10000,
};

describe("useAssetDistribution", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChunkedAssetsData.mockReturnValue({
      data: undefined,
      isLoading: false,
      isSuccess: false,
    });
  });

  it("returns loading state while chunked data is pending", () => {
    mockUseChunkedAssetsData.mockReturnValue({
      data: undefined,
      isLoading: true,
      isSuccess: false,
    });

    const { result } = renderHook(() => useAssetDistribution(baseOpts));

    expect(result.current.distribution).toMatchObject({ isAvailable: false, list: [] });
    expect(result.current.isLoading).toBe(true);
    expect(mockUseChunkedAssetsData).toHaveBeenCalledWith(
      expect.objectContaining({ product: "lld", version: "1.0.0", skip: false }),
    );
  });

  it("returns built distribution once chunked data resolves", () => {
    const assetsData = {
      cryptoAssets: { bitcoin: { id: "bitcoin", assetsIds: { bitcoin: "bitcoin" } } },
      markets: { bitcoin: { id: "bitcoin" } },
    };
    mockUseChunkedAssetsData.mockReturnValue({
      data: assetsData,
      isLoading: false,
      isSuccess: true,
    });
    mockBuildAssetDistribution.mockReturnValue(assetResult);

    const { result } = renderHook(() => useAssetDistribution(baseOpts));

    expect(result.current.distribution).toMatchObject({ isAvailable: true });
    expect(result.current.distribution.list[0].metaCurrencyId).toBe("bitcoin");
    expect(result.current.isLoading).toBe(false);
    expect(mockBuildAssetDistribution).toHaveBeenCalledWith(
      accounts,
      mockCvState,
      usd,
      assetsData,
      expect.objectContaining({ showEmptyAccounts: false, hideEmptyTokenAccount: false }),
    );
  });

  it("skips fetch when skip is true", () => {
    renderHook(() => useAssetDistribution({ ...baseOpts, skip: true }));

    expect(mockUseChunkedAssetsData).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
  });

  it("skips fetch when no accounts", () => {
    renderHook(() => useAssetDistribution({ ...baseOpts, accounts: [] }));

    expect(mockUseChunkedAssetsData).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
  });
});

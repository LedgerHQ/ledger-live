import { renderHook } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  useMarketDayChangeByCurrencyId,
  useStockAssetIds,
} from "@features/platform-aggregated-assets";
import { useAllCurrencyTrends } from "@features/platform-assets-table";
import { useMarketDayChange } from "LLD/hooks/useMarketDayChange";
import { useAssetsSectionViewModel } from "./useAssetsSectionViewModel";

jest.mock("LLD/hooks/useMarketDayChange", () => ({
  useMarketDayChange: jest.fn(),
}));

jest.mock("@features/platform-aggregated-assets", () => ({
  ...jest.requireActual("@features/platform-aggregated-assets"),
  useStockAssetIds: jest.fn(),
  useMarketDayChangeByCurrencyId: jest.fn(),
}));

jest.mock("@features/platform-assets-table", () => ({
  ...jest.requireActual("@features/platform-assets-table"),
  useAllCurrencyTrends: jest.fn(() => new Map()),
  useAssetsTable: jest.fn(() => ({})),
}));

const mockedUseMarketDayChange = jest.mocked(useMarketDayChange);
const mockedUseStockAssetIds = jest.mocked(useStockAssetIds);
const mockedUseMarketDayChangeByCurrencyId = jest.mocked(useMarketDayChangeByCurrencyId);
const mockedUseAllCurrencyTrends = jest.mocked(useAllCurrencyTrends);

describe("useAssetsSectionViewModel", () => {
  const account = genAccount("account-detail-trend", {
    currency: getCryptoCurrencyById("ethereum"),
    subAccountsCount: 0,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAllCurrencyTrends.mockReturnValue(new Map());
    mockedUseMarketDayChange.mockReturnValue({ byLedgerId: new Map(), byMarketId: new Map() });
    mockedUseStockAssetIds.mockReturnValue({ ids: new Set(), isLoading: false, isError: false });
    mockedUseMarketDayChangeByCurrencyId.mockReturnValue(new Map());
  });

  it("should use the 24h market change of the account currency", () => {
    const marketDayChange = new Map([["ethereum", 3.5]]);
    mockedUseMarketDayChange.mockReturnValue({
      byLedgerId: marketDayChange,
      byMarketId: new Map(),
    });

    renderHook(() => useAssetsSectionViewModel(account));

    expect(mockedUseAllCurrencyTrends).toHaveBeenCalledWith(
      [expect.objectContaining({ currency: account.currency })],
      "day",
      marketDayChange,
      "market",
    );
  });

  it("should keep the stock day change for tokenized stock rows", () => {
    const stockDayChange = new Map([["ethereum", 1.2]]);
    mockedUseStockAssetIds.mockReturnValue({
      ids: new Set(["ethereum"]),
      isLoading: false,
      isError: false,
    });
    mockedUseMarketDayChangeByCurrencyId.mockReturnValue(stockDayChange);

    renderHook(() => useAssetsSectionViewModel(account));

    expect(mockedUseMarketDayChangeByCurrencyId).toHaveBeenCalledWith(
      expect.objectContaining({ currencyIds: ["ethereum"] }),
    );
    expect(mockedUseAllCurrencyTrends).toHaveBeenCalledWith(
      [expect.objectContaining({ currency: account.currency })],
      "day",
      stockDayChange,
    );
  });
});

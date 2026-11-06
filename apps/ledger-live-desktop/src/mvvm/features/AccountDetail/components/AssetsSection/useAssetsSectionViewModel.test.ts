import { renderHook } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { useMarketDayChangeByCurrencyId } from "@features/platform-aggregated-assets";
import { useAllCurrencyTrends } from "@features/platform-assets-table";
import { useAssetsSectionViewModel } from "./useAssetsSectionViewModel";

jest.mock("@features/platform-aggregated-assets", () => ({
  ...jest.requireActual("@features/platform-aggregated-assets"),
  useMarketDayChangeByCurrencyId: jest.fn(),
}));

jest.mock("@features/platform-assets-table", () => ({
  ...jest.requireActual("@features/platform-assets-table"),
  useAllCurrencyTrends: jest.fn(() => new Map()),
  useAssetsTable: jest.fn(() => ({})),
}));

const mockedUseMarketDayChange = jest.mocked(useMarketDayChangeByCurrencyId);
const mockedUseAllCurrencyTrends = jest.mocked(useAllCurrencyTrends);

describe("useAssetsSectionViewModel", () => {
  const account = genAccount("account-detail-trend", {
    currency: getCryptoCurrencyById("ethereum"),
    subAccountsCount: 0,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAllCurrencyTrends.mockReturnValue(new Map());
    mockedUseMarketDayChange.mockReturnValue(new Map());
  });

  it("should look up the market of every asset of the account", () => {
    renderHook(() => useAssetsSectionViewModel(account));

    expect(mockedUseMarketDayChange).toHaveBeenCalledWith(
      expect.objectContaining({ currencyIds: ["ethereum"] }),
    );
  });

  it("should use the 24h market change of the account currency", () => {
    const marketDayChange = new Map([["ethereum", 3.5]]);
    mockedUseMarketDayChange.mockReturnValue(marketDayChange);

    renderHook(() => useAssetsSectionViewModel(account));

    expect(mockedUseAllCurrencyTrends).toHaveBeenCalledWith(
      expect.any(Array),
      "day",
      marketDayChange,
    );
  });
});

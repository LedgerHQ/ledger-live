import { renderHook } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { useAllCurrencyTrends } from "@features/platform-assets-table";
import { useMarketDayChange } from "LLD/hooks/useMarketDayChange";
import { useAssetsSectionViewModel } from "./useAssetsSectionViewModel";

jest.mock("LLD/hooks/useMarketDayChange", () => ({
  useMarketDayChange: jest.fn(),
}));

jest.mock("@features/platform-assets-table", () => ({
  ...jest.requireActual("@features/platform-assets-table"),
  useAllCurrencyTrends: jest.fn(() => new Map()),
  useAssetsTable: jest.fn(() => ({})),
}));

const mockedUseMarketDayChange = jest.mocked(useMarketDayChange);
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
  });

  it("should use the 24h market change of the account currency", () => {
    const marketDayChange = new Map([["ethereum", 3.5]]);
    mockedUseMarketDayChange.mockReturnValue({
      byLedgerId: marketDayChange,
      byMarketId: new Map(),
    });

    renderHook(() => useAssetsSectionViewModel(account));

    expect(mockedUseAllCurrencyTrends).toHaveBeenCalledWith(
      expect.any(Array),
      "day",
      marketDayChange,
      "market",
    );
  });
});

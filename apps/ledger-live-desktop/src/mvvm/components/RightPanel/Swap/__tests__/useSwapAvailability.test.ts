import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { renderHook } from "tests/testSetup";
import { getAccountUrl } from "~/renderer/utils";
import { useSwapAvailability } from "../useSwapAvailability";
import { useAssetRouteLedgerIds } from "LLD/features/AssetDetail/hooks/useAssetRouteLedgerIds";
import { useTradeAvailability } from "@ledgerhq/asset-detail";

jest.mock("LLD/features/AssetDetail/hooks/useAssetRouteLedgerIds");

const mockSwapCurrencies: { ids: string[]; isResolved: boolean } = { ids: [], isResolved: true };
const mockDeactivatedIds: { current: Set<string> } = { current: new Set() };

jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/exchange/swap/hooks/index"),
  useFetchCurrencyAll: () => ({
    data: mockSwapCurrencies.ids,
    isResolved: mockSwapCurrencies.isResolved,
  }),
}));
jest.mock("@features/platform-currencies", () => ({
  ...jest.requireActual("@features/platform-currencies"),
  useFeatureFlaggedCurrencies: () => ({ deactivatedCurrencyIds: mockDeactivatedIds.current }),
}));
jest.mock("@ledgerhq/asset-detail", () => ({
  ...jest.requireActual("@ledgerhq/asset-detail"),
  useTradeAvailability: jest.fn(),
}));

const mockLedgerIds = (ledgerIds: string[], isLoading = false) =>
  jest.mocked(useAssetRouteLedgerIds).mockReturnValue({ ledgerIds, isLoading });

const mockSwap = (availableOnSwap: boolean, isResolved = true) =>
  jest.mocked(useTradeAvailability).mockReturnValue({
    availableOnBuy: true,
    availableOnSell: true,
    availableOnSwap,
    isCurrencySupported: availableOnSwap,
    isResolved,
  });

describe("useSwapAvailability", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLedgerIds(["bitcoin"]);
    mockSwap(true);
  });

  it("does not gate non-asset right panel pages", () => {
    mockLedgerIds([]);
    mockSwap(false);

    expect(renderHook(() => useSwapAvailability("/")).result.current).toBe(true);
    expect(renderHook(() => useSwapAvailability("/analytics")).result.current).toBe(true);
  });

  it("allows the panel when swap is available for the asset", () => {
    mockSwap(true);

    const { result } = renderHook(() => useSwapAvailability("/asset/bitcoin"));

    expect(result.current).toBe(true);
  });

  it("hides the panel when swap is unavailable for the asset", () => {
    mockSwap(false);

    const { result } = renderHook(() => useSwapAvailability("/asset/bitcoin"));

    expect(result.current).toBe(false);
  });

  it("allows the panel while the asset market data is still loading", () => {
    mockLedgerIds(["bitcoin"], true);
    mockSwap(false);

    const { result } = renderHook(() => useSwapAvailability("/asset/bitcoin"));

    expect(result.current).toBe(true);
  });

  it("allows the panel while swap availability is unresolved", () => {
    mockSwap(false, false);

    const { result } = renderHook(() => useSwapAvailability("/asset/bitcoin"));

    expect(result.current).toBe(true);
  });

  it("hides the panel for an unsupported asset with no ledger ids", () => {
    mockLedgerIds([]);
    mockSwap(false);

    const { result } = renderHook(() => useSwapAvailability("/asset/bitcoin"));

    expect(result.current).toBe(false);
  });

  describe("account detail routes", () => {
    const btcAccount = genAccount("swap-availability-btc", {
      currency: getCryptoCurrencyById("bitcoin"),
    });
    const renderOnAccount = (accountId: string) =>
      renderHook(() => useSwapAvailability(getAccountUrl(accountId)), {
        initialState: { accounts: [btcAccount] },
      });

    beforeEach(() => {
      mockLedgerIds([]);
      mockSwap(false);
      mockSwapCurrencies.isResolved = true;
      mockDeactivatedIds.current = new Set();
    });

    it("shows the panel when swap supports an asset of the account", () => {
      mockSwapCurrencies.ids = ["bitcoin"];

      expect(renderOnAccount(btcAccount.id).result.current).toBe(true);
    });

    it("hides the panel when swap supports no asset of the account", () => {
      mockSwapCurrencies.ids = [];

      expect(renderOnAccount(btcAccount.id).result.current).toBe(false);
    });

    it("keeps the panel while the swap catalog is not resolved, from the first render", () => {
      mockSwapCurrencies.ids = [];
      mockSwapCurrencies.isResolved = false;

      expect(renderOnAccount(btcAccount.id).result.current).toBe(true);
    });

    it("hides the panel once the resolved catalog has no asset of the account", () => {
      mockSwapCurrencies.ids = ["ethereum"];
      mockSwapCurrencies.isResolved = true;

      expect(renderOnAccount(btcAccount.id).result.current).toBe(false);
    });

    it("hides the panel for a deactivated currency, even before the catalog resolves", () => {
      mockSwapCurrencies.ids = [];
      mockSwapCurrencies.isResolved = false;
      mockDeactivatedIds.current = new Set(["bitcoin"]);

      expect(renderOnAccount(btcAccount.id).result.current).toBe(false);
    });

    it("does not gate an unknown account", () => {
      expect(renderOnAccount("unknown").result.current).toBe(true);
    });
  });
});

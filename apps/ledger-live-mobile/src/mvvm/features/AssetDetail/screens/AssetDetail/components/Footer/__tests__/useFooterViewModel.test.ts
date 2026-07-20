import { renderHook, act } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { useTradeAvailability, type TradeAvailability } from "@ledgerhq/asset-detail";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { track } from "~/analytics";
import { useFooterViewModel } from "../useFooterViewModel";

let mockAccounts: Account[] = [];

jest.mock("~/reducers/accounts", () => ({
  ...jest.requireActual("~/reducers/accounts"),
  flattenAccountsSelector: () => mockAccounts,
  shallowAccountsSelector: () => mockAccounts,
}));

const mockHandleOpenBuySell = jest.fn();
const mockHandleOpenSwap = jest.fn();
const mockGetCanStakeCurrency = jest.fn().mockReturnValue(true);
const mockHandleOpenStakeDrawer = jest.fn();
const mockUseOpenStakeDrawer = jest
  .fn()
  .mockReturnValue({ handleOpenStakeDrawer: mockHandleOpenStakeDrawer });

jest.mock("@ledgerhq/asset-detail", () => ({
  ...jest.requireActual("@ledgerhq/asset-detail"),
  useTradeAvailability: jest.fn(),
}));

jest.mock("LLM/features/Buy", () => ({
  useOpenBuySell: () => ({ handleOpenBuySell: mockHandleOpenBuySell }),
}));

jest.mock("LLM/features/Swap", () => ({
  useOpenSwap: () => ({ handleOpenSwap: mockHandleOpenSwap }),
}));

jest.mock("LLM/hooks/useStake/useStake", () => ({
  useStake: () => ({ getCanStakeCurrency: mockGetCanStakeCurrency }),
}));

jest.mock("LLM/features/Stake", () => ({
  useOpenStakeDrawer: (props: unknown) => mockUseOpenStakeDrawer(props),
}));

const mockedUseTradeAvailability = jest.mocked(useTradeAvailability);
const setAvailability = (overrides: Partial<TradeAvailability> = {}) =>
  mockedUseTradeAvailability.mockReturnValue({
    availableOnBuy: true,
    availableOnSell: true,
    availableOnSwap: true,
    isCurrencySupported: true,
    isResolved: true,
    ...overrides,
  });

const bitcoin = getCryptoCurrencyById("bitcoin");

function buildAccount(currencyId: string, balance = 0) {
  const currency = getCryptoCurrencyById(currencyId);
  const account = genAccount(currencyId, { currency, operationsSize: 0 });
  account.balance = new BigNumber(balance);
  account.spendableBalance = new BigNumber(balance);
  return account;
}

describe("useFooterViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAvailability();
    mockAccounts = [];
    mockGetCanStakeCurrency.mockReturnValue(true);
  });

  describe("isBuyAvailable", () => {
    it("returns true when the asset is supported and buyable", () => {
      setAvailability({ availableOnBuy: true });
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.isBuyAvailable).toBe(true);
    });

    it("returns false when the asset is not buyable", () => {
      setAvailability({ availableOnBuy: false });
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.isBuyAvailable).toBe(false);
    });

    it("returns false when the currency is not supported, even if buyable", () => {
      setAvailability({ availableOnBuy: true, isCurrencySupported: false });
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.isBuyAvailable).toBe(false);
    });

    it("returns false when currency is undefined", () => {
      const { result } = renderHook(() => useFooterViewModel(undefined));

      expect(result.current.isBuyAvailable).toBe(false);
    });

    it("follows buy availability when the user already has an account for the asset", () => {
      mockAccounts = [buildAccount("bitcoin")];
      setAvailability({ availableOnBuy: true });
      const { result: buyableResult } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      setAvailability({ availableOnBuy: false });
      const { result: notBuyableResult } = renderHook(() =>
        useFooterViewModel(bitcoin, ["bitcoin"]),
      );

      expect(buyableResult.current.isBuyAvailable).toBe(true);
      expect(notBuyableResult.current.isBuyAvailable).toBe(false);
    });
  });

  describe("isSellAvailable", () => {
    it("returns true when the asset is supported, sellable, and the currency has funds", () => {
      setAvailability({ availableOnSell: true });
      mockAccounts = [buildAccount("bitcoin", 1000)];
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.isSellAvailable).toBe(true);
    });

    it("returns false when the asset is not sellable", () => {
      setAvailability({ availableOnSell: false });
      mockAccounts = [buildAccount("bitcoin", 1000)];
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.isSellAvailable).toBe(false);
    });

    it("returns false when the currency has no accounts", () => {
      setAvailability({ availableOnSell: true });
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.isSellAvailable).toBe(false);
    });

    it("returns false when all currency accounts have zero balance", () => {
      setAvailability({ availableOnSell: true });
      mockAccounts = [buildAccount("bitcoin")];
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.isSellAvailable).toBe(false);
    });

    it("returns false when the currency is not supported, even if sellable", () => {
      setAvailability({ availableOnSell: true, isCurrencySupported: false });
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.isSellAvailable).toBe(false);
    });

    it("returns false when currency is undefined", () => {
      const { result } = renderHook(() => useFooterViewModel(undefined));

      expect(result.current.isSellAvailable).toBe(false);
    });
  });

  describe("isEarnAvailable", () => {
    it("returns true when the asset is supported and canStake is true", () => {
      mockGetCanStakeCurrency.mockReturnValue(true);
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.isEarnAvailable).toBe(true);
    });

    it("returns false when canStake is false", () => {
      mockGetCanStakeCurrency.mockReturnValue(false);
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.isEarnAvailable).toBe(false);
    });

    it("returns false when the currency is not supported even if canStake is true", () => {
      setAvailability({ isCurrencySupported: false });
      mockGetCanStakeCurrency.mockReturnValue(true);
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.isEarnAvailable).toBe(false);
    });

    it("returns false when currency is undefined", () => {
      const { result } = renderHook(() => useFooterViewModel(undefined));

      expect(result.current.isEarnAvailable).toBe(false);
    });
  });

  describe("isMoreButtonVisible", () => {
    it("is true when only sell is available", () => {
      setAvailability({ availableOnSell: true });
      mockGetCanStakeCurrency.mockReturnValue(false);
      mockAccounts = [buildAccount("bitcoin", 1000)];
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.isMoreButtonVisible).toBe(true);
    });

    it("is true when only earn is available", () => {
      setAvailability({ availableOnSell: false });
      mockGetCanStakeCurrency.mockReturnValue(true);
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.isMoreButtonVisible).toBe(true);
    });

    it("is true when both sell and earn are available", () => {
      setAvailability({ availableOnSell: true });
      mockGetCanStakeCurrency.mockReturnValue(true);
      mockAccounts = [buildAccount("bitcoin", 1000)];
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.isMoreButtonVisible).toBe(true);
    });

    it("is false when neither sell nor earn is available", () => {
      setAvailability({ availableOnSell: false });
      mockGetCanStakeCurrency.mockReturnValue(false);
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.isMoreButtonVisible).toBe(false);
    });
  });

  describe("secondaryButton", () => {
    it("is null when the currency is not supported", () => {
      setAvailability({ isCurrencySupported: false });
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.secondaryButton).toBeNull();
    });

    it("is swap when the asset has no accounts and swap is available", () => {
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.secondaryButton).toBe("swap");
    });

    it("is null when swap is unavailable", () => {
      setAvailability({ availableOnSwap: false });
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.secondaryButton).toBeNull();
    });

    it("is swap when only accounts outside ledgerIds exist", () => {
      mockAccounts = [buildAccount("ethereum", 1000)];
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.secondaryButton).toBe("swap");
    });

    it("is swap when any network account in ledgerIds exists for a multi-network asset", () => {
      mockAccounts = [buildAccount("optimism")];
      const { result } = renderHook(() =>
        useFooterViewModel(bitcoin, ["ethereum", "optimism", "base"]),
      );

      expect(result.current.secondaryButton).toBe("swap");
    });
  });

  describe("press handlers", () => {
    it("onBuyPress fires tracking and opens buy flow", () => {
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      act(() => result.current.onBuyPress());

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "buy",
        currency: "bitcoin",
        page: "Asset Detail",
      });
      expect(mockHandleOpenBuySell).toHaveBeenCalledWith("buy");
    });

    it("onSellPress fires tracking and opens sell flow", () => {
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      act(() => result.current.onSellPress());

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "sell",
        currency: "bitcoin",
        page: "Asset Detail",
      });
      expect(mockHandleOpenBuySell).toHaveBeenCalledWith("sell");
    });

    it("onSwapPress fires tracking and opens swap flow", () => {
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      act(() => result.current.onSwapPress());

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "swap",
        currency: "bitcoin",
        page: "Asset Detail",
      });
      expect(mockHandleOpenSwap).toHaveBeenCalled();
    });

    it.each(["onBuyPress", "onSwapPress"] as const)(
      "%s does nothing when currency is undefined",
      handler => {
        const { result } = renderHook(() => useFooterViewModel(undefined));

        act(() => result.current[handler]());

        expect(track).not.toHaveBeenCalled();
      },
    );

    it("onEarnPress fires tracking and calls handleOpenStakeDrawer", () => {
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      act(() => result.current.onEarnPress());

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "earn",
        currency: "bitcoin",
        page: "Asset Detail",
      });
      expect(mockHandleOpenStakeDrawer).toHaveBeenCalled();
    });

    it("onMorePress fires tracking and opens the more-options sheet", () => {
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      act(() => result.current.onMorePress());

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "more",
        currency: "bitcoin",
        page: "Asset Detail",
      });
      expect(result.current.isMoreOptionsRequestingToBeOpened).toBe(true);
    });

    it("onMoreOptionsClose closes the more-options sheet", () => {
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      act(() => result.current.onMorePress());
      act(() => result.current.onMoreOptionsClose());

      expect(result.current.isMoreOptionsRequestingToBeOpened).toBe(false);
    });

    it.each(["onSellPress", "onMorePress"] as const)(
      "%s does nothing when currency is undefined",
      handler => {
        const { result } = renderHook(() => useFooterViewModel(undefined));

        act(() => result.current[handler]());

        expect(track).not.toHaveBeenCalled();
      },
    );

    it.each(["onEarnPress"] as const)("%s does nothing when currency is undefined", handler => {
      const { result } = renderHook(() => useFooterViewModel(undefined));

      act(() => result.current[handler]());

      expect(track).not.toHaveBeenCalled();
    });
  });
});

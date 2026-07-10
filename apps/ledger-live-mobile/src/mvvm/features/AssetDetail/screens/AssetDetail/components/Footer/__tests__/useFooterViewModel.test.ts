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
}));

const mockHandleOpenBuySell = jest.fn();
const mockHandleOpenSwap = jest.fn();

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

const mockedUseTradeAvailability = jest.mocked(useTradeAvailability);
const setAvailability = (overrides: Partial<TradeAvailability> = {}) =>
  mockedUseTradeAvailability.mockReturnValue({
    availableOnBuy: true,
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
  });
});

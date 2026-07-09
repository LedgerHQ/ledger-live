import { renderHook, act } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { useTradeAvailability, type TradeAvailability } from "@ledgerhq/asset-detail";
import { track } from "~/analytics";
import { useFooterViewModel } from "../useFooterViewModel";

let mockAccounts: { currency: { id: string }; balance: { gt: () => boolean } }[] = [];

jest.mock("~/reducers/accounts", () => ({
  ...jest.requireActual("~/reducers/accounts"),
  shallowAccountsSelector: () => mockAccounts,
}));

const mockHandleOpenBuySell = jest.fn();
const mockHandleOpenSwap = jest.fn();
const mockHandleOpenReceiveDrawer = jest.fn();
const mockUseOpenReceiveDrawer = jest.fn();

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

jest.mock("LLM/features/Receive", () => ({
  useOpenReceiveDrawer: (params: unknown) => {
    mockUseOpenReceiveDrawer(params);
    return { handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer };
  },
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
  });

  describe("secondaryButton", () => {
    it("is null when the currency is not supported", () => {
      setAvailability({ isCurrencySupported: false });
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.secondaryButton).toBeNull();
    });

    it("is receive when the asset has no accounts with funds", () => {
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.secondaryButton).toBe("receive");
    });

    it("is swap when an account matching ledgerIds has funds and swap is available", () => {
      mockAccounts = [{ currency: { id: "bitcoin" }, balance: { gt: () => true } }];
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.secondaryButton).toBe("swap");
    });

    it("is receive when only accounts outside ledgerIds have funds", () => {
      mockAccounts = [{ currency: { id: "ethereum" }, balance: { gt: () => true } }];
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      expect(result.current.secondaryButton).toBe("receive");
    });

    it("is swap when any network account in ledgerIds has funds for a multi-network asset", () => {
      mockAccounts = [{ currency: { id: "optimism" }, balance: { gt: () => true } }];
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

    it("onReceivePress fires tracking and opens receive flow", () => {
      const { result } = renderHook(() => useFooterViewModel(bitcoin, ["bitcoin"]));

      act(() => result.current.onReceivePress());

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "receive",
        currency: "bitcoin",
        page: "Asset Detail",
      });
      expect(mockHandleOpenReceiveDrawer).toHaveBeenCalled();
    });

    it("forwards the multi-network ledgerIds list to useOpenReceiveDrawer", () => {
      const ledgerIds = ["ethereum", "optimism", "arbitrum", "base"];
      renderHook(() => useFooterViewModel(bitcoin, ledgerIds));

      expect(mockUseOpenReceiveDrawer).toHaveBeenCalledWith(
        expect.objectContaining({ currency: bitcoin, currencyIds: ledgerIds }),
      );
    });

    it.each(["onBuyPress", "onSwapPress", "onReceivePress"] as const)(
      "%s does nothing when currency is undefined",
      handler => {
        const { result } = renderHook(() => useFooterViewModel(undefined));

        act(() => result.current[handler]());

        expect(track).not.toHaveBeenCalled();
      },
    );
  });
});

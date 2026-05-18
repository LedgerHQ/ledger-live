import { renderHook, act } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { track } from "~/analytics";
import { useFooterViewModel } from "../useFooterViewModel";

const mockHandleOpenBuySell = jest.fn();
const mockHandleOpenSwap = jest.fn();
const mockHandleOpenReceiveDrawer = jest.fn();
const mockIsCurrencyAvailable = jest.fn();
const mockIsAcceptedCurrency = jest.fn().mockReturnValue(true);

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog", () => ({
  useRampCatalog: () => ({ isCurrencyAvailable: mockIsCurrencyAvailable }),
}));

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency", () => ({
  useAcceptedCurrency: () => mockIsAcceptedCurrency,
}));

jest.mock("LLM/features/Buy", () => ({
  useOpenBuySell: () => ({ handleOpenBuySell: mockHandleOpenBuySell }),
}));

jest.mock("LLM/features/Swap", () => ({
  useOpenSwap: () => ({ handleOpenSwap: mockHandleOpenSwap }),
}));

jest.mock("LLM/features/Receive", () => ({
  useOpenReceiveDrawer: () => ({ handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer }),
}));

const bitcoin = getCryptoCurrencyById("bitcoin");

describe("useFooterViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isBuyAvailable", () => {
    it("returns true when the ramp catalog supports the currency", () => {
      mockIsCurrencyAvailable.mockReturnValue(true);
      const { result } = renderHook(() => useFooterViewModel(bitcoin));

      expect(result.current.isBuyAvailable).toBe(true);
      expect(mockIsCurrencyAvailable).toHaveBeenCalledWith("bitcoin", "onRamp");
    });

    it("returns false when the ramp catalog does not support the currency", () => {
      mockIsCurrencyAvailable.mockReturnValue(false);
      const { result } = renderHook(() => useFooterViewModel(bitcoin));

      expect(result.current.isBuyAvailable).toBe(false);
    });

    it("returns false when currency is undefined", () => {
      const { result } = renderHook(() => useFooterViewModel(undefined));

      expect(result.current.isBuyAvailable).toBe(false);
    });
  });

  describe("press handlers", () => {
    it("onBuyPress fires tracking and opens buy flow", () => {
      mockIsCurrencyAvailable.mockReturnValue(true);
      const { result } = renderHook(() => useFooterViewModel(bitcoin));

      act(() => result.current.onBuyPress());

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "buy",
        currency: "bitcoin",
        page: "Asset Detail",
      });
      expect(mockHandleOpenBuySell).toHaveBeenCalledWith("buy");
    });

    it("onSwapPress fires tracking and opens swap flow", () => {
      const { result } = renderHook(() => useFooterViewModel(bitcoin));

      act(() => result.current.onSwapPress());

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "swap",
        currency: "bitcoin",
        page: "Asset Detail",
      });
      expect(mockHandleOpenSwap).toHaveBeenCalled();
    });

    it("onReceivePress fires tracking and opens receive flow", () => {
      const { result } = renderHook(() => useFooterViewModel(bitcoin));

      act(() => result.current.onReceivePress());

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "receive",
        currency: "bitcoin",
        page: "Asset Detail",
      });
      expect(mockHandleOpenReceiveDrawer).toHaveBeenCalled();
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

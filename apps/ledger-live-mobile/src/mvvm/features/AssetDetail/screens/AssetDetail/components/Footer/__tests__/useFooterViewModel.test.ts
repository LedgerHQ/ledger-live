import { renderHook, act } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { track } from "~/analytics";
import { useFooterViewModel } from "../useFooterViewModel";

const mockHandleOpenBuySell = jest.fn();
const mockIsCurrencyAvailable = jest.fn();

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog", () => ({
  useRampCatalog: () => ({ isCurrencyAvailable: mockIsCurrencyAvailable }),
}));

jest.mock("LLM/features/Buy", () => ({
  useOpenBuySell: () => ({ handleOpenBuySell: mockHandleOpenBuySell }),
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

  describe("onBuyPress", () => {
    it("fires tracking event and opens buy flow", () => {
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

    it("does nothing when currency is undefined", () => {
      const { result } = renderHook(() => useFooterViewModel(undefined));

      act(() => result.current.onBuyPress());

      expect(track).not.toHaveBeenCalled();
      expect(mockHandleOpenBuySell).not.toHaveBeenCalled();
    });
  });
});

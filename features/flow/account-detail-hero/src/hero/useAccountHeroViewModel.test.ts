import { act, renderHook } from "@testing-library/react";
import type { AccountHeroAvailability, AccountHeroPort } from "./types";
import { useAccountHeroViewModel } from "./useAccountHeroViewModel";

const availability = (
  overrides: Partial<AccountHeroAvailability> = {},
): AccountHeroAvailability => ({
  isCurrencySupported: true,
  isBuyAvailable: true,
  isSellAvailable: true,
  isSwapAvailable: true,
  isEarnAvailable: true,
  isSendSupported: true,
  isReceiveSupported: true,
  ...overrides,
});

function renderViewModel(overrides: Partial<AccountHeroPort> = {}) {
  const onAction = jest.fn();
  const port: AccountHeroPort = {
    platform: "mobile",
    balance: {
      countervalue: 100,
      formatter: () => ({
        integerPart: "100",
        decimalPart: "00",
        currencyText: "$",
        decimalSeparator: ".",
        currencyPosition: "start",
      }),
      discreet: false,
      isLoading: false,
    },
    availability: availability(),
    hasFunds: true,
    hasActivity: true,
    onAction,
    ...overrides,
  };
  const { result } = renderHook(() => useAccountHeroViewModel(port));
  return { result, onAction };
}

const tileIds = (tiles: readonly { id: string }[]) => tiles.map(({ id }) => id);

describe("useAccountHeroViewModel", () => {
  describe("mobile", () => {
    it("lays out Transfer · Swap · More with Buy, Sell and Earn in More", () => {
      const { result } = renderViewModel();

      expect(tileIds(result.current.tiles)).toEqual(["transfer", "swap", "more"]);
      expect(result.current.moreActions.map(({ id }) => id)).toEqual(["buy", "sell", "earn"]);
    });

    it("keeps only Transfer, Swap and Buy without funds", () => {
      const { result } = renderViewModel({ hasFunds: false });

      expect(tileIds(result.current.tiles)).toEqual(["transfer", "swap", "buy"]);
      expect(result.current.moreActions).toEqual([]);
    });

    it("promotes Buy and Sell to tiles when Swap is unavailable", () => {
      const { result } = renderViewModel({
        availability: availability({ isSwapAvailable: false, isEarnAvailable: false }),
      });

      expect(tileIds(result.current.tiles)).toEqual(["transfer", "buy", "sell"]);
    });

    it("shows Receive instead of Transfer when the currency can't send", () => {
      const { result } = renderViewModel({
        availability: availability({ isSendSupported: false }),
      });

      expect(result.current.tiles[0]?.id).toBe("receive");
    });

    it("drops the Receive tile when the account can neither send nor receive", () => {
      const { result } = renderViewModel({
        availability: availability({ isSendSupported: false, isReceiveSupported: false }),
      });

      expect(tileIds(result.current.tiles)).toEqual(["swap", "more"]);
    });

    it("keeps only Transfer when the currency is not supported", () => {
      const { result } = renderViewModel({
        availability: availability({ isCurrencySupported: false }),
      });

      expect(tileIds(result.current.tiles)).toEqual(["transfer"]);
    });
  });

  describe("desktop", () => {
    it("resolves Receive, Send, Buy, Sell, Earn with Send, Sell and Earn inactive without funds", () => {
      const { result } = renderViewModel({ platform: "desktop", hasFunds: false });

      expect(result.current.actions).toEqual([
        { id: "receive", state: "active" },
        { id: "send", state: "inactive" },
        { id: "buy", state: "active" },
        { id: "sell", state: "inactive" },
        { id: "earn", state: "inactive" },
      ]);
      expect(result.current.showSwapConsole).toBe(true);
    });

    it("leaves Send out when the currency can't send, even with funds", () => {
      const { result } = renderViewModel({
        platform: "desktop",
        availability: availability({ isSendSupported: false }),
      });

      expect(tileIds(result.current.actions)).toEqual(["receive", "buy", "sell", "earn"]);
    });

    it("leaves Receive out when the account can't receive", () => {
      const { result } = renderViewModel({
        platform: "desktop",
        availability: availability({ isReceiveSupported: false }),
      });

      expect(tileIds(result.current.actions)).toEqual(["send", "buy", "sell", "earn"]);
    });
  });

  describe("interactions", () => {
    it("forwards a tile press to the port", () => {
      const { result, onAction } = renderViewModel();

      act(() => result.current.onTilePress("swap"));

      expect(onAction).toHaveBeenCalledWith("swap");
    });

    it("opens the More sheet instead of calling the port", () => {
      const { result, onAction } = renderViewModel();

      act(() => result.current.onTilePress("more"));

      expect(result.current.isMoreSheetOpen).toBe(true);
      expect(onAction).not.toHaveBeenCalled();
    });

    it("closes the More sheet and forwards the picked action", () => {
      const { result, onAction } = renderViewModel();

      act(() => result.current.onTilePress("more"));
      act(() => result.current.onMoreActionPress("earn"));

      expect(result.current.isMoreSheetOpen).toBe(false);
      expect(onAction).toHaveBeenCalledWith("earn");
    });

    it("closes the More sheet without an action", () => {
      const { result, onAction } = renderViewModel();

      act(() => result.current.onTilePress("more"));
      act(() => result.current.onCloseMoreSheet());

      expect(result.current.isMoreSheetOpen).toBe(false);
      expect(onAction).not.toHaveBeenCalled();
    });
  });
});

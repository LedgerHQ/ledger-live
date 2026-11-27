import { act, renderHook } from "@testing-library/react";
import type { PredictionsTypedData } from "@features/platform-predictions";
import {
  ORDER_DETAILS,
  ORDER_TYPED_DATA,
  SALE_DETAILS,
  SALE_TYPED_DATA,
} from "./__tests__/orderDetails";
import { MIN_LOADING_DISPLAY_MS } from "./pendingResultStore.internals";
import { PredictionsOrderPlayerClosed, usePredictionsOrderHooks } from "./predictionsOrderStore";
import {
  closePredictionsOrder,
  markPredictionsOrderPresented,
  ORDER_REPORT_TIMEOUT_MS,
  retryPredictionsOrder,
  usePredictionsOrder,
} from "./predictionsOrderStore.internals";

function startShownOrder(typedData: PredictionsTypedData = ORDER_TYPED_DATA) {
  const order = renderHook(() => usePredictionsOrder());
  const player = renderHook(() => usePredictionsOrderHooks());
  let walletOrderId = "";
  act(() => {
    walletOrderId = player.result.current.startOrder(typedData, ORDER_DETAILS.display);
    markPredictionsOrderPresented();
  });
  return { order, player, walletOrderId };
}

describe("usePredictionsOrderHooks", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => closePredictionsOrder());
    jest.useRealTimers();
  });

  it("opens nothing for an order signed once its player is gone", () => {
    const order = renderHook(() => usePredictionsOrder());
    const player = renderHook(() => usePredictionsOrderHooks());
    const { startOrder } = player.result.current;
    player.unmount();

    expect(() => act(() => startOrder(ORDER_TYPED_DATA, ORDER_DETAILS.display))).toThrow(
      PredictionsOrderPlayerClosed,
    );
    expect(order.result.current.isOpen).toBe(false);
  });

  it("keeps a sale's shares from its signed amount", () => {
    const order = renderHook(() => usePredictionsOrder());
    const player = renderHook(() => usePredictionsOrderHooks());

    act(() => {
      player.result.current.startOrder(SALE_TYPED_DATA, SALE_DETAILS.display);
    });

    expect(order.result.current.shownOrder?.context).toEqual(SALE_DETAILS);
  });

  it("owns only the order its player started last", () => {
    const { player, walletOrderId } = startShownOrder();
    const otherPlayer = renderHook(() => usePredictionsOrderHooks());

    expect(player.result.current.ownsOrder(Number(walletOrderId))).toBe(true);
    expect(otherPlayer.result.current.ownsOrder(Number(walletOrderId))).toBe(false);
  });

  it("places the order, then shows the reported status once the loading has been on screen long enough", () => {
    const { order, player, walletOrderId } = startShownOrder();
    expect(order.result.current).toMatchObject({
      isOpen: true,
      shownOrder: { context: ORDER_DETAILS, result: null },
    });

    act(() => {
      void player.result.current["order.report"](walletOrderId, {
        status: "filled",
        shares: 3.7,
        price: 0.54,
      });
      jest.advanceTimersByTime(MIN_LOADING_DISPLAY_MS);
    });

    expect(order.result.current.shownOrder?.result).toEqual({
      status: "filled",
      shares: 3.7,
      price: 0.54,
    });
  });

  it("shows a sale reported with what it paid out", () => {
    const { order, player, walletOrderId } = startShownOrder(SALE_TYPED_DATA);

    act(() => {
      void player.result.current["order.report"](walletOrderId, {
        status: "filled",
        shares: 16.12,
        received: 4.3,
      });
      jest.advanceTimersByTime(MIN_LOADING_DISPLAY_MS);
    });

    expect(order.result.current.shownOrder?.result).toEqual({
      status: "filled",
      shares: 16.12,
      received: 4.3,
    });
  });

  it.each([
    ["sale", SALE_TYPED_DATA, { status: "filled", shares: 16.12, price: 0.27 }],
    ["buy", ORDER_TYPED_DATA, { status: "filled", shares: 3.7, received: 2 }],
  ] as const)(
    "refuses a %s reported with the other side's amount, and keeps placing",
    async (_side, typedData, report) => {
      const { order, player, walletOrderId } = startShownOrder(typedData);

      await expect(
        player.result.current["order.report"](walletOrderId, report),
      ).rejects.toMatchObject({ name: "ZodError" });
      act(() => jest.advanceTimersByTime(MIN_LOADING_DISPLAY_MS));

      expect(order.result.current.shownOrder?.result).toBeNull();
    },
  );

  it.each([
    ["close", closePredictionsOrder],
    ["retry", retryPredictionsOrder],
  ] as const)("answers %s once the user picks it, and closes", async (action, pick) => {
    const { order, player, walletOrderId } = startShownOrder();
    const report = player.result.current["order.report"](walletOrderId, { status: "not-filled" });

    act(() => pick());

    await expect(report).resolves.toBe(action);
    expect(order.result.current.isOpen).toBe(false);
  });

  it("answers close right away when the player placed no order", async () => {
    const player = renderHook(() => usePredictionsOrderHooks());

    await expect(
      player.result.current["order.report"]("1", { status: "unconfirmed" }),
    ).resolves.toBe("close");
  });

  it("answers close to an order replaced by a new one", async () => {
    const { player, walletOrderId } = startShownOrder();
    const report = player.result.current["order.report"](walletOrderId, { status: "not-filled" });

    act(() => player.result.current.startOrder(ORDER_TYPED_DATA, ORDER_DETAILS.display));

    await expect(report).resolves.toBe("close");
  });

  it("answers close to a late report of a timed out order without touching the newer one", async () => {
    const { order, player, walletOrderId: timedOutId } = startShownOrder();
    act(() => {
      jest.advanceTimersByTime(ORDER_REPORT_TIMEOUT_MS);
      jest.advanceTimersByTime(1);
    });
    let newerId = "";
    act(() => {
      newerId = player.result.current.startOrder(ORDER_TYPED_DATA, ORDER_DETAILS.display);
      markPredictionsOrderPresented();
    });

    await expect(
      player.result.current["order.report"](timedOutId, { status: "filled" }),
    ).resolves.toBe("close");
    act(() => {
      void player.result.current["order.report"](newerId, { status: "not-filled" });
      jest.advanceTimersByTime(MIN_LOADING_DISPLAY_MS);
    });

    expect(order.result.current.shownOrder?.result).toEqual({ status: "not-filled" });
  });

  it("answers close to an order id this player didn't start", async () => {
    const { order, player, walletOrderId } = startShownOrder();

    await expect(
      player.result.current["order.report"](`${walletOrderId}0`, { status: "filled" }),
    ).resolves.toBe("close");
    expect(order.result.current.shownOrder?.result).toBeNull();
  });

  it("closes the order it placed when the player unmounts, answering close", async () => {
    const { order, player, walletOrderId } = startShownOrder();
    const report = player.result.current["order.report"](walletOrderId, { status: "not-filled" });

    act(() => player.unmount());

    await expect(report).resolves.toBe("close");
    expect(order.result.current.isOpen).toBe(false);
  });

  it("shows the order as unconfirmed when the live app never reports, then answers close right away", async () => {
    const { order, player, walletOrderId } = startShownOrder();

    act(() => jest.advanceTimersByTime(ORDER_REPORT_TIMEOUT_MS - 1));
    expect(order.result.current.shownOrder?.result).toBeNull();
    act(() => {
      jest.advanceTimersByTime(1);
      // The timeout schedules the status with a 0 ms timer, which fake timers run 1 ms later.
      jest.advanceTimersByTime(1);
    });
    expect(order.result.current.shownOrder?.result).toEqual({ status: "unconfirmed" });

    await expect(
      player.result.current["order.report"](walletOrderId, { status: "filled" }),
    ).resolves.toBe("close");
    expect(order.result.current).toMatchObject({
      isOpen: true,
      shownOrder: { result: { status: "unconfirmed" } },
    });
  });

  it("shows the reported status, not the timeout's, when the live app reports in time", () => {
    const { order, player, walletOrderId } = startShownOrder();

    act(() => {
      jest.advanceTimersByTime(ORDER_REPORT_TIMEOUT_MS - MIN_LOADING_DISPLAY_MS);
      void player.result.current["order.report"](walletOrderId, { status: "not-filled" });
      jest.advanceTimersByTime(MIN_LOADING_DISPLAY_MS);
    });

    expect(order.result.current.shownOrder?.result).toEqual({ status: "not-filled" });
  });
});

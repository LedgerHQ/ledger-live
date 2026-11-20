import { act, renderHook } from "@testing-library/react";
import { MIN_RESULT_DISPLAY_MS } from "./pendingResultStore.internals";
import { usePredictionsOrderHooks } from "./predictionsOrderStore";
import {
  closePredictionsOrder,
  markPredictionsOrderPresented,
  ORDER_REPORT_TIMEOUT_MS,
  retryPredictionsOrder,
  usePredictionsOrder,
} from "./predictionsOrderStore.internals";

function startShownOrder() {
  const order = renderHook(() => usePredictionsOrder());
  const player = renderHook(() => usePredictionsOrderHooks());
  let orderId = "";
  act(() => {
    orderId = player.result.current.startOrder();
    markPredictionsOrderPresented();
  });
  return { order, player, orderId };
}

describe("usePredictionsOrderHooks", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => closePredictionsOrder());
    jest.useRealTimers();
  });

  it("places the order, then shows the reported outcome once the loading has been on screen long enough", () => {
    const { order, player, orderId } = startShownOrder();
    expect(order.result.current).toMatchObject({ isOpen: true, shownOrder: { outcome: null } });

    act(() => {
      void player.result.current["order.report"](orderId, {
        outcome: "filled",
        shares: 3.7,
        price: 0.54,
      });
      jest.advanceTimersByTime(MIN_RESULT_DISPLAY_MS);
    });

    expect(order.result.current.shownOrder?.outcome).toEqual({
      outcome: "filled",
      shares: 3.7,
      price: 0.54,
    });
  });

  it.each([
    ["close", closePredictionsOrder],
    ["retry", retryPredictionsOrder],
  ] as const)("answers %s once the user picks it, and closes", async (action, pick) => {
    const { order, player, orderId } = startShownOrder();
    const report = player.result.current["order.report"](orderId, { outcome: "not-filled" });

    act(() => pick());

    await expect(report).resolves.toBe(action);
    expect(order.result.current.isOpen).toBe(false);
  });

  it("answers close right away when the player placed no order", async () => {
    const player = renderHook(() => usePredictionsOrderHooks());

    await expect(
      player.result.current["order.report"]("1", { outcome: "unconfirmed" }),
    ).resolves.toBe("close");
  });

  it("answers close to an order replaced by a new one", async () => {
    const { player, orderId } = startShownOrder();
    const report = player.result.current["order.report"](orderId, { outcome: "not-filled" });

    act(() => player.result.current.startOrder());

    await expect(report).resolves.toBe("close");
  });

  it("answers close to a late report of a timed out order without touching the newer one", async () => {
    const { order, player, orderId: timedOutId } = startShownOrder();
    act(() => {
      jest.advanceTimersByTime(ORDER_REPORT_TIMEOUT_MS);
      jest.advanceTimersByTime(1);
    });
    let newerId = "";
    act(() => {
      newerId = player.result.current.startOrder();
      markPredictionsOrderPresented();
    });

    await expect(
      player.result.current["order.report"](timedOutId, { outcome: "filled" }),
    ).resolves.toBe("close");
    act(() => {
      void player.result.current["order.report"](newerId, { outcome: "not-filled" });
      jest.advanceTimersByTime(MIN_RESULT_DISPLAY_MS);
    });

    expect(order.result.current.shownOrder?.outcome).toEqual({ outcome: "not-filled" });
  });

  it("answers close to an order id this player didn't start", async () => {
    const { order, player, orderId } = startShownOrder();

    await expect(
      player.result.current["order.report"](`${orderId}0`, { outcome: "filled" }),
    ).resolves.toBe("close");
    expect(order.result.current.shownOrder?.outcome).toBeNull();
  });

  it("closes the order it placed when the player unmounts, answering close", async () => {
    const { order, player, orderId } = startShownOrder();
    const report = player.result.current["order.report"](orderId, { outcome: "not-filled" });

    act(() => player.unmount());

    await expect(report).resolves.toBe("close");
    expect(order.result.current.isOpen).toBe(false);
  });

  it("shows the order as unconfirmed when the live app never reports, then answers close right away", async () => {
    const { order, player, orderId } = startShownOrder();

    act(() => jest.advanceTimersByTime(ORDER_REPORT_TIMEOUT_MS - 1));
    expect(order.result.current.shownOrder?.outcome).toBeNull();
    act(() => {
      jest.advanceTimersByTime(1);
      // The timeout schedules the outcome with a 0 ms timer, which fake timers run 1 ms later.
      jest.advanceTimersByTime(1);
    });
    expect(order.result.current.shownOrder?.outcome).toEqual({ outcome: "unconfirmed" });

    await expect(
      player.result.current["order.report"](orderId, { outcome: "filled" }),
    ).resolves.toBe("close");
    expect(order.result.current).toMatchObject({
      isOpen: true,
      shownOrder: { outcome: { outcome: "unconfirmed" } },
    });
  });

  it("shows the reported outcome, not the timeout's, when the live app reports in time", () => {
    const { order, player, orderId } = startShownOrder();

    act(() => {
      jest.advanceTimersByTime(ORDER_REPORT_TIMEOUT_MS - MIN_RESULT_DISPLAY_MS);
      void player.result.current["order.report"](orderId, { outcome: "not-filled" });
      jest.advanceTimersByTime(MIN_RESULT_DISPLAY_MS);
    });

    expect(order.result.current.shownOrder?.outcome).toEqual({ outcome: "not-filled" });
  });
});

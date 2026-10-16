/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { log } from "@ledgerhq/logs";
import type { SponsoredCoinApi } from "../../../bridge/generic-coin-framework/sponsored";
import {
  PENDING_RENT_EXPIRY_MARGIN_MS,
  PENDING_RENT_RECHECK_INTERVAL_MS,
  getPendingRent,
  recordPendingRent,
  resetPendingRentsForTests,
} from "./pendingRents";
import { usePendingRentDelivery } from "./usePendingRentDelivery";

jest.mock("@ledgerhq/logs", () => ({ log: jest.fn() }));

const RENT = {
  mainAccountId: "acc-1",
  orderId: "order-1",
  payerAddress: "TPayer",
  paymentTxId: "tx-1",
  receiverAddress: "TPayer",
  energyNeeded: 64_285n,
};
const PAYMENT_WINDOW_MS = 360_000;
// recordPendingRent keeps a rent past its payment's expiry by this margin.
const RENT_WINDOW_MS = PAYMENT_WINDOW_MS + PENDING_RENT_EXPIRY_MARGIN_MS;

const recordRent = (overrides = {}) =>
  recordPendingRent({ ...RENT, ...overrides }, Date.now() + PAYMENT_WINDOW_MS);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const makeSeam = (isEnergyDelivered = false) => ({
  isEnergyDelivered: jest.fn().mockResolvedValue(isEnergyDelivered),
  awaitEnergyDelivery: jest.fn().mockReturnValue(new Promise<void>(() => {})),
});
type StubSeam = ReturnType<typeof makeSeam>;

type Props = { mainAccountId: string | null; seam: StubSeam | null; idle: boolean };
const renderDelivery = (initial: Partial<Props> = {}) =>
  renderHook(
    ({ mainAccountId, seam, idle }: Props) =>
      usePendingRentDelivery({
        mainAccountId,
        seam: seam as unknown as SponsoredCoinApi | null,
        idle,
      }),
    { initialProps: { mainAccountId: "acc-1", seam: null, idle: true, ...initial } },
  );

const settle = () =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });
const advance = (ms: number) =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
const signalOf = (seam: StubSeam, call = 0): AbortSignal =>
  seam.awaitEnergyDelivery.mock.calls[call][2].signal;

describe("usePendingRentDelivery", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    resetPendingRentsForTests();
  });
  afterEach(() => jest.useRealTimers());

  it("is quiet when no rent is pending", async () => {
    const seam = makeSeam();
    const { result } = renderDelivery({ seam });
    await settle();

    expect(result.current).toEqual({ rentArriving: false, deliveredAt: null });
    expect(seam.isEnergyDelivered).not.toHaveBeenCalled();
  });

  it("clears a rent already delivered on the first read", async () => {
    recordRent();
    const seam = makeSeam(true);
    const { result } = renderDelivery({ seam });
    await settle();

    expect(result.current).toEqual({ rentArriving: false, deliveredAt: Date.now() });
    expect(getPendingRent("acc-1")).toBeNull();
    expect(seam.isEnergyDelivered).toHaveBeenCalledTimes(1);
    expect(seam.isEnergyDelivered).toHaveBeenCalledWith({
      receiverAddress: "TPayer",
      energyNeeded: 64_285n,
    });
    expect(seam.awaitEnergyDelivery).not.toHaveBeenCalled();
  });

  it("holds a rent still being submitted without reading the chain, and reads once it is sent", async () => {
    recordRent({ submitting: true });
    // Energy from elsewhere is already on-chain.
    const seam = makeSeam(true);
    const { result } = renderDelivery({ seam });
    await settle();

    expect(result.current).toEqual({ rentArriving: true, deliveredAt: null });
    expect(seam.isEnergyDelivered).not.toHaveBeenCalled();
    expect(seam.awaitEnergyDelivery).not.toHaveBeenCalled();
    expect(getPendingRent("acc-1")).not.toBeNull();

    act(() => recordRent());
    await settle();

    expect(seam.isEnergyDelivered).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual({ rentArriving: false, deliveredAt: Date.now() });
    expect(getPendingRent("acc-1")).toBeNull();
  });

  it("holds while the energy is on its way, then clears once it lands", async () => {
    recordRent();
    const delivery = deferred<void>();
    const seam = makeSeam();
    seam.awaitEnergyDelivery.mockReturnValue(delivery.promise);
    const { result } = renderDelivery({ seam });
    await settle();

    expect(result.current.rentArriving).toBe(true);
    expect(seam.awaitEnergyDelivery).toHaveBeenCalledWith(
      { orderId: "order-1", payerAddress: "TPayer" },
      { receiverAddress: "TPayer", energyNeeded: 64_285n },
      { timeoutMs: RENT_WINDOW_MS, paymentTxId: "tx-1", signal: expect.any(AbortSignal) },
    );

    await act(async () => delivery.resolve());

    expect(result.current).toEqual({ rentArriving: false, deliveredAt: Date.now() });
    expect(getPendingRent("acc-1")).toBeNull();
  });

  it("stays on hold after a failed wait, until the rent's window ends", async () => {
    recordRent();
    const seam = makeSeam();
    seam.awaitEnergyDelivery.mockRejectedValue(new Error("timeout"));
    const { result } = renderDelivery({ seam });
    await settle();

    expect(result.current).toEqual({ rentArriving: true, deliveredAt: null });
    expect(getPendingRent("acc-1")).not.toBeNull();

    await advance(RENT_WINDOW_MS - 1);
    expect(result.current.rentArriving).toBe(true);
    await advance(1);
    expect(result.current).toEqual({ rentArriving: false, deliveredAt: null });
  });

  describe("after the wait ends early", () => {
    const makeFailedSeam = () => {
      const seam = makeSeam();
      seam.awaitEnergyDelivery.mockRejectedValue(new Error("Energy rent order failed"));
      return seam;
    };

    it("keeps reading the chain, and clears once the energy lands", async () => {
      recordRent();
      const seam = makeFailedSeam();
      seam.isEnergyDelivered
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValue(true);
      const { result } = renderDelivery({ seam });
      await settle();

      await advance(2 * PENDING_RENT_RECHECK_INTERVAL_MS);
      expect(seam.isEnergyDelivered).toHaveBeenCalledTimes(3);
      expect(result.current).toEqual({ rentArriving: true, deliveredAt: null });

      await advance(PENDING_RENT_RECHECK_INTERVAL_MS);
      expect(result.current).toEqual({ rentArriving: false, deliveredAt: Date.now() });
      expect(getPendingRent("acc-1")).toBeNull();
    });

    it("reads up to the rent's window end, then stops", async () => {
      recordRent();
      const windowEnd = Date.now() + RENT_WINDOW_MS;
      const readAt: number[] = [];
      const seam = makeFailedSeam();
      seam.isEnergyDelivered.mockImplementation(async () => {
        readAt.push(Date.now());
        return false;
      });
      // Off the recheck cadence, so only the cap puts a read at the window's end.
      await advance(5_000);
      const { result } = renderDelivery({ seam });
      await settle();

      await advance(RENT_WINDOW_MS);
      expect(result.current).toEqual({ rentArriving: false, deliveredAt: null });
      expect(readAt.at(-1)).toBe(windowEnd);

      const reads = readAt.length;
      await advance(RENT_WINDOW_MS);
      expect(readAt).toHaveLength(reads);
    });

    it("stops reading the chain on unmount", async () => {
      recordRent();
      const seam = makeFailedSeam();
      const { unmount } = renderDelivery({ seam });
      await settle();
      await advance(PENDING_RENT_RECHECK_INTERVAL_MS);
      expect(seam.isEnergyDelivered).toHaveBeenCalledTimes(2);

      unmount();
      await advance(RENT_WINDOW_MS);

      expect(seam.isEnergyDelivered).toHaveBeenCalledTimes(2);
    });

    it.each([true, false])(
      "stops reading the chain, and drops a read in flight returning %s, when the flow starts again",
      async delivered => {
        recordRent();
        const read = deferred<boolean>();
        const seam = makeFailedSeam();
        seam.isEnergyDelivered.mockResolvedValueOnce(false).mockReturnValueOnce(read.promise);
        const { result, rerender } = renderDelivery({ seam });
        await settle();
        await advance(PENDING_RENT_RECHECK_INTERVAL_MS);
        expect(seam.isEnergyDelivered).toHaveBeenCalledTimes(2);

        rerender({ mainAccountId: "acc-1", seam, idle: false });
        await act(async () => read.resolve(delivered));
        await advance(3 * PENDING_RENT_RECHECK_INTERVAL_MS);

        expect(seam.isEnergyDelivered).toHaveBeenCalledTimes(2);
        expect(result.current).toEqual({ rentArriving: false, deliveredAt: null });
        expect(getPendingRent("acc-1")).not.toBeNull();
      },
    );

    it("does not start reading the chain when the wait rejects on unmount", async () => {
      recordRent();
      const seam = makeSeam();
      // Like coin-tron, the wait rejects once its signal aborts.
      seam.awaitEnergyDelivery.mockImplementation(
        (_ref, _target, { signal }: { signal: AbortSignal }) =>
          new Promise<void>((_, reject) =>
            signal.addEventListener("abort", () => reject(new Error("aborted"))),
          ),
      );
      const { unmount } = renderDelivery({ seam });
      await settle();

      unmount();
      await advance(3 * PENDING_RENT_RECHECK_INTERVAL_MS);

      expect(seam.isEnergyDelivered).toHaveBeenCalledTimes(1);
    });

    it("logs a read that throws, and the next one can still clear the rent", async () => {
      recordRent();
      const nodeDown = new Error("node down");
      const seam = makeFailedSeam();
      seam.isEnergyDelivered
        .mockResolvedValueOnce(false)
        .mockRejectedValueOnce(nodeDown)
        .mockResolvedValue(true);
      const { result } = renderDelivery({ seam });
      await settle();

      await advance(PENDING_RENT_RECHECK_INTERVAL_MS);
      expect(log).toHaveBeenCalledWith("sponsored-send", expect.any(String), { error: nodeDown });
      expect(result.current.rentArriving).toBe(true);

      await advance(PENDING_RENT_RECHECK_INTERVAL_MS);
      expect(result.current).toEqual({ rentArriving: false, deliveredAt: Date.now() });
      expect(getPendingRent("acc-1")).toBeNull();
    });
  });

  it("holds until the newer rent's window, not the replaced one's", async () => {
    recordRent();
    const { result } = renderDelivery();
    await advance(100_000);
    act(() => recordRent({ paymentTxId: "tx-2" }));

    await advance(RENT_WINDOW_MS - 100_000);
    expect(result.current.rentArriving).toBe(true);
    await advance(100_000);
    expect(result.current.rentArriving).toBe(false);
  });

  it("re-arms when the timer fires before the clock reaches the expiry", async () => {
    recordRent();
    const { result } = renderDelivery();
    await settle();

    // The clock steps back; timers keep their relative schedule.
    jest.setSystemTime(Date.now() - 50_000);
    await advance(RENT_WINDOW_MS);
    expect(result.current.rentArriving).toBe(true);

    await advance(50_000);
    expect(result.current.rentArriving).toBe(false);
  });

  it("hands over to the delivery wait when the energy check throws", async () => {
    recordRent();
    const seam = makeSeam();
    seam.isEnergyDelivered.mockRejectedValue(new Error("node down"));
    const { result } = renderDelivery({ seam });
    await settle();

    expect(result.current.rentArriving).toBe(true);
    expect(seam.awaitEnergyDelivery).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith("sponsored-send", expect.any(String), expect.anything());
  });

  it("ignores a rent on another account", async () => {
    recordRent();
    const seam = makeSeam();
    const { result } = renderDelivery({ seam, mainAccountId: "acc-2" });
    await settle();

    expect(result.current.rentArriving).toBe(false);
    expect(seam.isEnergyDelivered).not.toHaveBeenCalled();
  });

  it("holds without a seam until the rent's window ends", async () => {
    recordRent();
    const { result } = renderDelivery({ seam: null });
    await settle();
    expect(result.current.rentArriving).toBe(true);

    await advance(RENT_WINDOW_MS);
    expect(result.current.rentArriving).toBe(false);
  });

  it("leaves the flow's own polling alone, and re-reads once idle again", async () => {
    recordRent();
    const seam = makeSeam();
    const { result, rerender } = renderDelivery({ seam, idle: false });
    await settle();

    expect(result.current.rentArriving).toBe(false);
    expect(seam.isEnergyDelivered).not.toHaveBeenCalled();

    rerender({ mainAccountId: "acc-1", seam, idle: true });
    await settle();

    expect(result.current.rentArriving).toBe(true);
    expect(seam.isEnergyDelivered).toHaveBeenCalledTimes(1);
  });

  it("stops waiting when the flow starts again", async () => {
    recordRent();
    const seam = makeSeam();
    const { result, rerender } = renderDelivery({ seam });
    await settle();
    const signal = signalOf(seam);

    rerender({ mainAccountId: "acc-1", seam, idle: false });

    expect(signal.aborted).toBe(true);
    expect(result.current.rentArriving).toBe(false);
  });

  it("aborts the wait on unmount", async () => {
    recordRent();
    const seam = makeSeam();
    const { unmount } = renderDelivery({ seam });
    await settle();
    const signal = signalOf(seam);

    unmount();

    expect(signal.aborted).toBe(true);
  });

  it("moves the wait to the new account", async () => {
    recordRent();
    const seam = makeSeam();
    const { result, rerender } = renderDelivery({ seam });
    await settle();
    const signal = signalOf(seam);

    rerender({ mainAccountId: "acc-2", seam, idle: true });
    await settle();

    expect(signal.aborted).toBe(true);
    expect(result.current.rentArriving).toBe(false);
  });

  describe("a rent recorded after the first read", () => {
    it("holds, then follows the normal delivery path", async () => {
      const delivery = deferred<void>();
      const seam = makeSeam();
      seam.awaitEnergyDelivery.mockReturnValue(delivery.promise);
      const { result } = renderDelivery({ seam });
      await settle();
      expect(result.current.rentArriving).toBe(false);

      act(() => recordRent());
      await settle();

      expect(result.current.rentArriving).toBe(true);
      expect(seam.awaitEnergyDelivery).toHaveBeenCalledTimes(1);

      await act(async () => delivery.resolve());

      expect(result.current).toEqual({ rentArriving: false, deliveredAt: Date.now() });
      expect(getPendingRent("acc-1")).toBeNull();
    });

    it("drops the previous delivery time while the new rent arrives", async () => {
      recordRent();
      const seam = makeSeam(true);
      const { result } = renderDelivery({ seam });
      await settle();
      expect(result.current.deliveredAt).toEqual(expect.any(Number));

      seam.isEnergyDelivered.mockResolvedValue(false);
      act(() => recordRent({ paymentTxId: "tx-2" }));
      await settle();

      expect(result.current).toEqual({ rentArriving: true, deliveredAt: null });
    });

    it("ignores one recorded for another account", async () => {
      const seam = makeSeam();
      const { result } = renderDelivery({ seam });
      await settle();

      act(() => recordRent({ mainAccountId: "acc-2" }));
      await settle();

      expect(result.current.rentArriving).toBe(false);
      expect(seam.isEnergyDelivered).not.toHaveBeenCalled();
    });

    it("leaves the flow's own polling alone while not idle", async () => {
      const seam = makeSeam();
      const { result, rerender } = renderDelivery({ seam, idle: false });
      await settle();

      act(() => recordRent());
      await settle();

      expect(result.current.rentArriving).toBe(false);
      expect(seam.isEnergyDelivered).not.toHaveBeenCalled();

      rerender({ mainAccountId: "acc-1", seam, idle: true });
      await settle();

      expect(result.current.rentArriving).toBe(true);
    });

    it("hands over to a newer rent recorded while it waits", async () => {
      recordRent();
      const seam = makeSeam();
      const { result } = renderDelivery({ seam });
      await settle();
      const firstSignal = signalOf(seam);

      act(() => recordRent({ paymentTxId: "tx-2" }));
      await settle();

      expect(firstSignal.aborted).toBe(true);
      expect(seam.awaitEnergyDelivery).toHaveBeenCalledTimes(2);
      expect(seam.awaitEnergyDelivery.mock.calls[1][2].paymentTxId).toBe("tx-2");
      expect(result.current.rentArriving).toBe(true);
    });
  });

  it("ignores a delivery that lands after its wait was superseded", async () => {
    recordRent();
    const delivery = deferred<void>();
    const seam = makeSeam();
    seam.awaitEnergyDelivery.mockReturnValue(delivery.promise);
    const { result, rerender } = renderDelivery({ seam });
    await settle();

    rerender({ mainAccountId: "acc-2", seam, idle: true });
    await act(async () => delivery.resolve());
    rerender({ mainAccountId: "acc-1", seam, idle: false });

    expect(result.current.deliveredAt).toBeNull();
    expect(getPendingRent("acc-1")).not.toBeNull();
  });

  it("restarts the check against a new seam", async () => {
    recordRent();
    const first = makeSeam();
    const second = makeSeam();
    const { result, rerender } = renderDelivery({ seam: first });
    await settle();
    const signal = signalOf(first);

    rerender({ mainAccountId: "acc-1", seam: second, idle: true });
    await settle();

    expect(signal.aborted).toBe(true);
    expect(second.isEnergyDelivered).toHaveBeenCalledTimes(1);
    expect(result.current.rentArriving).toBe(true);
  });

  it("drops a delivery time that belongs to another account", async () => {
    recordRent();
    const seam = makeSeam(true);
    const { result, rerender } = renderDelivery({ seam });
    await settle();
    expect(result.current.deliveredAt).not.toBeNull();

    rerender({ mainAccountId: "acc-2", seam, idle: true });

    expect(result.current.deliveredAt).toBeNull();
  });
});

import { lastValueFrom, toArray } from "rxjs";
import type { DeviceConnectionResult, DeviceExtractedContext } from "@ledgerhq/device-intent";

const broadcastTransaction = jest.fn();
const getTransaction = jest.fn();
// `jest.fn(() => ({...}))` infers a zero-arg signature, which conflicts
// with the variadic forwarder below. Default the mock to `jest.fn()`
// (variadic `any`) and pin the return value here so callers still see
// the same `{ broadcastTransaction, getTransaction }` stub.
const getNodeApi = jest.fn();
getNodeApi.mockReturnValue({ broadcastTransaction, getTransaction });

jest.mock("@ledgerhq/coin-evm/network/node/index", () => ({
  getNodeApi: (...args: unknown[]) => getNodeApi(...args),
}));

import { broadcastEvmJob } from "./job";
import type { BroadcastEvmIntentInput, BroadcastEvmJobState } from "./types";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 100;
const FAKE_CONNECTION = {} as DeviceConnectionResult;
const FAKE_CONTEXT = {} as DeviceExtractedContext;

const BASE_INPUT: BroadcastEvmIntentInput = {
  signedTxHex: "0xsigned",
  currencyId: "ethereum",
};

function collect(input: BroadcastEvmIntentInput = BASE_INPUT): Promise<BroadcastEvmJobState[]> {
  return lastValueFrom(
    broadcastEvmJob({
      deviceConnectionResult: FAKE_CONNECTION,
      deviceExtractedContext: FAKE_CONTEXT,
      input,
    }).pipe(toArray()),
  );
}

beforeEach(() => {
  jest.useFakeTimers();
  broadcastTransaction.mockReset();
  getTransaction.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("broadcastEvmJob", () => {
  it("emits broadcasting → broadcasted → waiting-receipt → confirmed on a successful receipt", async () => {
    broadcastTransaction.mockResolvedValueOnce("0xhash");
    getTransaction.mockResolvedValueOnce({ blockHeight: 1234, status: 1 });

    const collected = collect();
    await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    const states = await collected;

    expect(states[0]).toEqual({ type: "broadcasting" });
    expect(states[1]).toEqual({ type: "broadcasted", hash: "0xhash" });
    expect(states.some(s => s.type === "waiting-receipt")).toBe(true);
    expect(states[states.length - 1]).toEqual({
      type: "confirmed",
      hash: "0xhash",
      blockHeight: 1234,
    });
  });

  it("emits a terminal `failed` state when the receipt reports status === 0 (reverted)", async () => {
    broadcastTransaction.mockResolvedValueOnce("0xhash");
    getTransaction.mockResolvedValueOnce({ blockHeight: 1234, status: 0 });

    const collected = collect();
    await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    const states = await collected;
    const terminal = states[states.length - 1];
    expect(terminal.type).toBe("failed");
    if (terminal.type === "failed") {
      expect(terminal.error.message).toBe("Transaction 0xhash reverted on chain");
    }
  });

  it("tolerates transient getTransaction errors and still resolves to `confirmed`", async () => {
    broadcastTransaction.mockResolvedValueOnce("0xhash");
    getTransaction
      .mockRejectedValueOnce(new Error("transient 1"))
      .mockRejectedValueOnce(new Error("transient 2"))
      .mockResolvedValueOnce({ blockHeight: 9, status: 1 });

    const collected = collect();
    await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3);
    const states = await collected;
    expect(states[states.length - 1]).toEqual({
      type: "confirmed",
      hash: "0xhash",
      blockHeight: 9,
    });
    expect(getTransaction).toHaveBeenCalledTimes(3);
  });

  it("emits a terminal `failed` state after exceeding the polling attempt budget", async () => {
    broadcastTransaction.mockResolvedValueOnce("0xhash");
    getTransaction.mockResolvedValue({ blockHeight: undefined, status: 1 });

    const collected = collect();
    await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS * MAX_POLL_ATTEMPTS);
    const states = await collected;
    const terminal = states[states.length - 1];
    expect(terminal.type).toBe("failed");
    if (terminal.type === "failed") {
      expect(terminal.error.message).toBe("Transaction 0xhash not mined after 100 attempts");
    }
    expect(getTransaction).toHaveBeenCalledTimes(100);
  });

  it("emits a terminal `failed` state when broadcastTransaction itself throws", async () => {
    broadcastTransaction.mockRejectedValueOnce(new Error("rpc unreachable"));

    const states = await collect();
    expect(states[0]).toEqual({ type: "broadcasting" });
    const terminal = states[states.length - 1];
    expect(terminal.type).toBe("failed");
    if (terminal.type === "failed") {
      expect(terminal.error.message).toBe("rpc unreachable");
    }
    expect(getTransaction).not.toHaveBeenCalled();
  });
});

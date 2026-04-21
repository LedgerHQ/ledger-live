/**
 * Tests for the in-process ZCashNative wrapper.
 *
 * The engine itself is covered by tests/engine.test.ts. Here we only verify
 * that the wrapper:
 *   - delegates getChainTip to `getChainTipJob`,
 *   - emits rehydrated `BigNumber` amounts for each chunk coming out of
 *     `startSyncJob`,
 *   - validates args synchronously (no engine call) when invalid,
 *   - cancels the native stream on teardown via `onActiveStream` + `cancel()`.
 */

import { BigNumber } from "bignumber.js";
import { makeRawChunk } from "./helpers/fixtures";

const getChainTipJobMock = jest.fn();
const startSyncJobMock = jest.fn();
const validateStartSyncArgsMock = jest.fn();

jest.mock("../src/native-engine/engine", () => ({
  getChainTipJob: (...args: unknown[]) => getChainTipJobMock(...args),
  startSyncJob: (...args: unknown[]) => startSyncJobMock(...args),
  validateStartSyncArgs: (...args: unknown[]) => validateStartSyncArgsMock(...args),
}));

// Static import on purpose: `jest.resetModules()` would reload `bignumber.js`
// in a fresh context, which makes `instanceof BigNumber` fail with "Expected:
// BigNumber / Received: BigNumber" on cross-realm instances.
import { ZCashNative } from "../src/ZCashNative";

beforeEach(() => {
  getChainTipJobMock.mockReset();
  startSyncJobMock.mockReset();
  validateStartSyncArgsMock.mockReset().mockReturnValue(null);
});

describe("ZCashNative (in-process wrapper)", () => {
  it("getChainTip delegates to getChainTipJob with the configured grpcUrl", async () => {
    getChainTipJobMock.mockResolvedValueOnce(2_700_000);

    const height = await new ZCashNative({ grpcUrl: "grpc://node" }).getChainTip();

    expect(height).toBe(2_700_000);
    expect(getChainTipJobMock).toHaveBeenCalledWith("grpc://node");
  });

  it("syncShielded rehydrates BigNumber amounts for every engine chunk", async () => {
    const chunk = makeRawChunk();

    startSyncJobMock.mockImplementation(async (_args, onChunk) => {
      onChunk(chunk);
    });

    const native = new ZCashNative({ grpcUrl: "grpc://node" });

    const received = await new Promise<{ fee: BigNumber; amount: BigNumber }>(resolve => {
      native
        .syncShielded({ startBlockHeight: 1_000_000, viewingKey: "ufvk", maxBatchSize: 100 })
        .subscribe({
          next: r =>
            resolve({
              fee: r.transactions[0].fee,
              amount: r.transactions[0].decryptedData!.orchard_outputs[0].amount,
            }),
        });
    });

    expect(received.fee).toBeInstanceOf(BigNumber);
    expect(received.fee.toString()).toBe("5000");
    expect(received.amount).toBeInstanceOf(BigNumber);
    expect(received.amount.toString()).toBe("123456789");
  });

  // Note: `validateStartSyncArgs` message content is covered by engine.test.ts.
  // Here we only assert the wrapper short-circuits to subscriber.error and
  // never calls the engine when validation fails.
  it("syncShielded short-circuits on validation error without calling the engine", async () => {
    validateStartSyncArgsMock.mockReturnValueOnce("any validation error");

    const error = jest.fn();
    new ZCashNative({ grpcUrl: "grpc://node" })
      .syncShielded({ startBlockHeight: -1, viewingKey: "ufvk", maxBatchSize: 100 })
      .subscribe({ error });

    expect(error).toHaveBeenCalledTimes(1);
    expect(startSyncJobMock).not.toHaveBeenCalled();
  });

  it("syncShielded teardown cancels the active native stream", async () => {
    const streamCancel = jest.fn();
    startSyncJobMock.mockImplementation(async (_args, _onChunk, hooks) => {
      hooks.onActiveStream?.({ cancel: streamCancel });
      // never resolves within this test — we unsubscribe before completion
      await new Promise(() => {});
    });

    const sub = new ZCashNative({ grpcUrl: "grpc://node" })
      .syncShielded({ startBlockHeight: 0, viewingKey: "ufvk", maxBatchSize: 100 })
      .subscribe();

    // Let the async engine callback register the active stream.
    await new Promise(resolve => setImmediate(resolve));
    sub.unsubscribe();

    expect(streamCancel).toHaveBeenCalled();
  });
});

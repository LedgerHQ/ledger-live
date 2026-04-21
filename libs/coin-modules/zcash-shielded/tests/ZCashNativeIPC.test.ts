/**
 * Tests for the renderer-side ZCashNativeIPC client.
 *
 * The engine itself is covered by tests/engine.test.ts; here we verify:
 *   - getChainTip() forwards a correctly shaped GetChainTipArgs over IPC.
 *   - syncShielded() subscribes to zcash:stream, filters events by
 *     requestId, rehydrates BigNumber amounts, and posts a cancelSync on
 *     teardown.
 *   - validateSyncArgs errors propagate synchronously via subscriber.error
 *     without touching IPC.
 */

import { BigNumber } from "bignumber.js";
import type { StreamEvent } from "../src/ipc/contract";
import { ZCASH_IPC } from "../src/ipc/contract";
import { makeRawChunk } from "./helpers/fixtures";

type IpcRendererLike = {
  invoke: jest.Mock;
  on: jest.Mock;
  removeListener: jest.Mock;
};

// Persistent mock — we never swap the object, only reset its jest.fn()s
// between tests. Swapping would strand the reference cached inside
// ZCashNativeIPC's `getIpcRenderer()`. Using a stable object also lets us keep
// `jest.resetModules()` out of the mix, which avoids cross-realm
// `instanceof BigNumber` failures.
const mockIpcRenderer: IpcRendererLike = {
  invoke: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  removeListener: jest.fn(),
};

// `electron` isn't installed in this package — we register it as a virtual
// module so `require("electron")` in ZCashNativeIPC resolves to the mock.
jest.mock(
  "electron",
  () => ({
    ipcRenderer: mockIpcRenderer,
  }),
  { virtual: true },
);

// Static import on purpose — see mockIpcRenderer comment above.
import { ZCashNativeIPC } from "../src/ZCashNativeIPC";

/**
 * Captures the latest `zcash:stream` listener registered on the mock, so tests
 * can drive stream events without caring about how many times `on` was called.
 */
function getLatestStreamListener(ipc: IpcRendererLike): (event: unknown, payload: unknown) => void {
  const call = ipc.on.mock.calls.findLast(([channel]) => channel === ZCASH_IPC.stream);
  if (!call) throw new Error("no stream listener registered");
  return call[1] as (event: unknown, payload: unknown) => void;
}

function expectInvoke(ipc: IpcRendererLike, channel: string): unknown {
  const call = ipc.invoke.mock.calls.find(([c]) => c === channel);
  if (!call) throw new Error(`expected invoke on channel ${channel}`);
  return call[1];
}

beforeEach(() => {
  mockIpcRenderer.invoke.mockReset().mockResolvedValue(undefined);
  mockIpcRenderer.on.mockReset();
  mockIpcRenderer.removeListener.mockReset();
});

describe("ZCashNativeIPC (renderer IPC client)", () => {
  it("getChainTip forwards the grpcUrl and returns the height", async () => {
    mockIpcRenderer.invoke.mockResolvedValueOnce(2_634_000);

    const native = new ZCashNativeIPC({ grpcUrl: "grpc://node.example", network: "mainnet" });
    const height = await native.getChainTip();

    expect(height).toBe(2_634_000);
    const payload = expectInvoke(mockIpcRenderer, ZCASH_IPC.getChainTip) as {
      requestId: string;
      grpcUrl: string;
    };
    expect(payload.grpcUrl).toBe("grpc://node.example");
    expect(payload.requestId).toMatch(/^zcash-/);
  });

  it("syncShielded rehydrates BigNumber amounts from the raw stream chunk", async () => {
    const native = new ZCashNativeIPC({ grpcUrl: "grpc://node.example" });

    const received: Array<{ fee: BigNumber; orchardAmount?: BigNumber }> = [];
    const sub = native
      .syncShielded({
        startBlockHeight: 1_000_000,
        viewingKey: "ufvk1xyz",
        maxBatchSize: 1000,
      })
      .subscribe({
        next: r =>
          received.push({
            fee: r.transactions[0]?.fee,
            orchardAmount: r.transactions[0]?.decryptedData?.orchard_outputs[0]?.amount,
          }),
      });

    const startCall = expectInvoke(mockIpcRenderer, ZCASH_IPC.startSync) as { requestId: string };
    const requestId = startCall.requestId;

    const chunk = makeRawChunk();

    const listener = getLatestStreamListener(mockIpcRenderer);
    const event: StreamEvent = { requestId, kind: "chunk", result: chunk };
    listener(null, event);

    expect(received).toHaveLength(1);
    expect(received[0].fee).toBeInstanceOf(BigNumber);
    expect(received[0].fee.toString()).toBe("5000");
    expect(received[0].orchardAmount).toBeInstanceOf(BigNumber);
    expect(received[0].orchardAmount?.toString()).toBe("123456789");

    sub.unsubscribe();
  });

  it("syncShielded ignores stream events targeted at a different requestId", async () => {
    const native = new ZCashNativeIPC({ grpcUrl: "grpc://node.example" });

    const next = jest.fn();
    const sub = native
      .syncShielded({ startBlockHeight: 0, viewingKey: "ufvk", maxBatchSize: 100 })
      .subscribe({ next });

    const listener = getLatestStreamListener(mockIpcRenderer);
    listener(null, {
      requestId: "some-other-id",
      kind: "chunk",
      result: { processedBlocks: 0, remainingBlocks: 0, transactions: [] },
    } satisfies StreamEvent);

    expect(next).not.toHaveBeenCalled();
    sub.unsubscribe();
  });

  it("syncShielded completes on a matching complete event", async () => {
    const native = new ZCashNativeIPC({ grpcUrl: "grpc://node.example" });

    const complete = jest.fn();
    native
      .syncShielded({ startBlockHeight: 0, viewingKey: "ufvk", maxBatchSize: 100 })
      .subscribe({ complete });

    const startCall = expectInvoke(mockIpcRenderer, ZCASH_IPC.startSync) as { requestId: string };
    const listener = getLatestStreamListener(mockIpcRenderer);
    listener(null, { requestId: startCall.requestId, kind: "complete" } satisfies StreamEvent);

    expect(complete).toHaveBeenCalled();
  });

  it("syncShielded surfaces error events as subscriber errors", async () => {
    const native = new ZCashNativeIPC({ grpcUrl: "grpc://node.example" });

    const error = jest.fn();
    native
      .syncShielded({ startBlockHeight: 0, viewingKey: "ufvk", maxBatchSize: 100 })
      .subscribe({ error });

    const startCall = expectInvoke(mockIpcRenderer, ZCASH_IPC.startSync) as { requestId: string };
    const listener = getLatestStreamListener(mockIpcRenderer);
    listener(null, {
      requestId: startCall.requestId,
      kind: "error",
      message: "boom",
    } satisfies StreamEvent);

    expect(error).toHaveBeenCalledTimes(1);
    const [errArg] = error.mock.calls[0];
    expect(errArg).toBeInstanceOf(Error);
    expect((errArg as Error).message).toBe("boom");
  });

  it("syncShielded posts cancelSync and removes the listener on teardown", async () => {
    const native = new ZCashNativeIPC({ grpcUrl: "grpc://node.example" });

    const sub = native
      .syncShielded({ startBlockHeight: 0, viewingKey: "ufvk", maxBatchSize: 100 })
      .subscribe();

    const startCall = expectInvoke(mockIpcRenderer, ZCASH_IPC.startSync) as { requestId: string };
    sub.unsubscribe();

    expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith(
      ZCASH_IPC.stream,
      expect.any(Function),
    );
    const cancelPayload = expectInvoke(mockIpcRenderer, ZCASH_IPC.cancelSync) as {
      requestId: string;
    };
    expect(cancelPayload.requestId).toBe(startCall.requestId);
  });

  // Note: validation message content is covered by engine.test.ts
  // (`validateStartSyncArgs`). Here we only assert the wrapper short-circuits
  // to subscriber.error and never invokes the startSync IPC when validation
  // fails — that's the IPC-client-specific contract.
  it("syncShielded short-circuits on validation error without invoking IPC", async () => {
    const native = new ZCashNativeIPC({ grpcUrl: "grpc://node.example" });

    const error = jest.fn();
    native
      .syncShielded({ startBlockHeight: -1, viewingKey: "ufvk", maxBatchSize: 100 })
      .subscribe({ error });

    expect(error).toHaveBeenCalledTimes(1);
    expect(mockIpcRenderer.invoke).not.toHaveBeenCalledWith(ZCASH_IPC.startSync, expect.anything());
  });
});

/**
 * @jest-environment jsdom
 */
import { act, waitFor } from "@testing-library/react";
import { selectIsKeyRingMember } from "@domain/entity-key-ring";
import { selectKeyRingSession, type KeyRingStream } from "@features/platform-key-ring";
import { fakeKeyRingClient } from "@features/platform-key-ring/testing";
import type { LedgerSyncDestroyOptions } from "../types";
import { listenToAnalytics, stopAnalytics } from "../__tests__/analytics";
import { deferred, fakeStream } from "../__tests__/fixtures";
import { renderLedgerSyncHook } from "../__tests__/harness";
import { useDestroyLedgerSync } from "./useDestroyLedgerSync";

const RESET = "trustchain/keyRingReset";
const WALLET_SYNC_CLEARED = "walletSync/walletSyncUpdate";

function renderDestroy(
  options: Partial<LedgerSyncDestroyOptions> = {},
  stream: KeyRingStream | null = fakeStream(),
) {
  const sequence: string[] = [];
  listenToAnalytics(sequence);
  const client = fakeKeyRingClient({
    openStream: () => stream,
    destroy: jest.fn(async () => {
      sequence.push("client.destroy");
      return { treeDestroyed: true };
    }),
  });
  const cloudSync = {
    destroy: jest.fn(async () => {
      sequence.push("cloudSync.destroy");
    }),
  };
  const rendered = renderLedgerSyncHook(
    () => useDestroyLedgerSync({ client, cloudSync, ...options }),
    { sequence },
  );
  sequence.length = 0;
  return { ...rendered, client, cloudSync, sequence };
}

afterEach(stopAnalytics);

describe("useDestroyLedgerSync", () => {
  it("should delete the Cloud Sync data, then leave the key tree, then reset", async () => {
    const { result, client, cloudSync, sequence, store } = renderDestroy();
    const session = selectKeyRingSession(store.getState());

    await act(() => result.current.destroy());

    expect(cloudSync.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ ref: fakeStream().ref }),
    );
    expect(client.destroy).toHaveBeenCalledWith(session);
    expect(sequence).toEqual([
      "cloudSync.destroy",
      "client.destroy",
      RESET,
      "track",
      WALLET_SYNC_CLEARED,
    ]);
    expect(selectIsKeyRingMember(store.getState())).toBe(false);
    expect(store.getState().walletSync.walletSyncState).toEqual({ data: null, version: 0 });
  });

  it("should run the desktop callback before the reset", async () => {
    const sequenceRef: { current: string[] } = { current: [] };
    const onBeforeReset = jest.fn(() => {
      sequenceRef.current.push("onBeforeReset");
    });
    const { result, sequence } = renderDestroy({ onBeforeReset });
    sequenceRef.current = sequence;

    await act(() => result.current.destroy());

    expect(sequence.slice(2)).toEqual(["onBeforeReset", RESET, "track", WALLET_SYNC_CLEARED]);
  });

  it("should run the mobile callback after the wallet sync state is cleared", async () => {
    const sequenceRef: { current: string[] } = { current: [] };
    const onAfterReset = jest.fn(() => {
      sequenceRef.current.push("onAfterReset");
    });
    const { result, sequence } = renderDestroy({ onAfterReset });
    sequenceRef.current = sequence;

    await act(() => result.current.destroy());

    expect(sequence.slice(2)).toEqual([RESET, "track", WALLET_SYNC_CLEARED, "onAfterReset"]);
  });

  it("should still reset when the instance has no key tree stream, without calling the backends", async () => {
    const { result, client, cloudSync, sequence } = renderDestroy({}, null);

    await act(() => result.current.destroy());

    expect(cloudSync.destroy).not.toHaveBeenCalled();
    expect(client.destroy).not.toHaveBeenCalled();
    expect(sequence).toEqual([RESET, "track", WALLET_SYNC_CLEARED]);
  });

  it("should reject, keep the key ring and call onError when the deletion fails", async () => {
    const onError = jest.fn();
    const onBeforeReset = jest.fn();
    const failure = new Error("Cloud Sync down");
    const { result, cloudSync, sequence, store } = renderDestroy({ onError, onBeforeReset });
    cloudSync.destroy.mockRejectedValueOnce(failure);

    await act(() => expect(result.current.destroy()).rejects.toBe(failure));

    await waitFor(() => expect(result.current.error).toBe(failure));
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onBeforeReset).not.toHaveBeenCalled();
    expect(sequence).not.toContain(RESET);
    expect(selectIsKeyRingMember(store.getState())).toBe(true);
  });

  it("should report the deletion as pending while it runs", async () => {
    const deletion = deferred<void>();
    const { result, cloudSync } = renderDestroy();
    cloudSync.destroy.mockReturnValueOnce(deletion.promise);

    let destroyed: Promise<void> = Promise.resolve();
    act(() => {
      destroyed = result.current.destroy();
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));

    await act(async () => {
      deletion.resolve();
      await destroyed;
    });
    expect(result.current.isPending).toBe(false);
  });
});

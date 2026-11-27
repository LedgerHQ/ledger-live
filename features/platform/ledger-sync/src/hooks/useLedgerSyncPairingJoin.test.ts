/**
 * @jest-environment jsdom
 */
import { act, waitFor } from "@testing-library/react";
import { selectKeyRingTreeId } from "@domain/entity-key-ring";
import { mockKeyRingState } from "@domain/entity-key-ring/slice.mock";
import {
  KeyRingError,
  selectKeyRingSession,
  type KeyRingJoinPairingOptions,
  type KeyRingSession,
  type KeyRingTreeUpdate,
} from "@features/platform-key-ring";
import { fakeKeyRingClient } from "@features/platform-key-ring/testing";
import type { LedgerSyncPairingJoinOptions } from "../types";
import { flushAnalytics, listenToAnalytics, stopAnalytics } from "../__tests__/analytics";
import { newTreeUpdate } from "../__tests__/fixtures";
import { renderLedgerSyncHook } from "../__tests__/harness";
import { useLedgerSyncPairingJoin } from "./useLedgerSyncPairingJoin";

type JoinPairing = (
  session: KeyRingSession,
  options: KeyRingJoinPairingOptions,
) => Promise<KeyRingTreeUpdate | null>;

function renderJoin(
  joinPairing: jest.Mock<ReturnType<JoinPairing>, Parameters<JoinPairing>>,
  options: Partial<LedgerSyncPairingJoinOptions> = {},
  trustchain = mockKeyRingState({ trustchain: null }),
) {
  const vendor = listenToAnalytics();
  const onJoined = jest.fn();
  const onFailure = jest.fn(() => false);
  const rendered = renderLedgerSyncHook(
    () =>
      useLedgerSyncPairingJoin({
        client: fakeKeyRingClient({ joinPairing }),
        memberName: "Mobile",
        getActivatedEventProperties: () => ({ flow: "Ledger Sync" }),
        onJoined,
        onFailure,
        ...options,
      }),
    { trustchain },
  );
  return { ...rendered, onJoined, onFailure, vendor };
}

afterEach(stopAnalytics);

describe("useLedgerSyncPairingJoin", () => {
  it("should ask for the digits, send them, store the key tree and track the activation", async () => {
    const joinPairing = jest.fn<ReturnType<JoinPairing>, Parameters<JoinPairing>>(
      (_session, options) =>
        new Promise(resolve => {
          options.onRequestPairingCode({ digits: 3, connected: true }, digits => {
            expect(digits).toBe("123");
            resolve(newTreeUpdate("joined-root"));
          });
        }),
    );
    const { result, store, onJoined, vendor } = renderJoin(joinPairing);
    const session = selectKeyRingSession(store.getState());

    let joined: Promise<true | undefined> = Promise.resolve(undefined);
    act(() => {
      joined = result.current.start("https://pairing.test/qr", session);
    });
    await waitFor(() => expect(result.current.digitsCount).toBe(3));
    act(() => {
      result.current.setInput("123");
    });
    expect(result.current.input).toBe("123");

    let sent = false;
    await act(async () => {
      sent = result.current.sendDigits("123");
      await joined;
    });

    await expect(joined).resolves.toBe(true);
    expect(sent).toBe(true);
    expect(joinPairing).toHaveBeenCalledWith(
      session,
      expect.objectContaining({
        memberName: "Mobile",
        scannedUrl: "https://pairing.test/qr",
      }),
    );
    expect(selectKeyRingTreeId(store.getState())).toBe("joined-root");
    expect(onJoined).toHaveBeenCalledTimes(1);
    expect(result.current.digitsCount).toBeNull();
    expect(result.current.input).toBeNull();
    await flushAnalytics();
    expect(vendor).toHaveBeenCalledWith("ledgersync_activated", { flow: "Ledger Sync" });
  });

  it("should not track the activation when the instance was already a member", async () => {
    const joinPairing = jest.fn().mockResolvedValue(newTreeUpdate());
    const { result, store, onJoined, vendor } = renderJoin(joinPairing, {}, mockKeyRingState());

    await act(() => result.current.start("url", selectKeyRingSession(store.getState())));

    expect(onJoined).toHaveBeenCalledTimes(1);
    await flushAnalytics();
    expect(vendor).not.toHaveBeenCalled();
  });

  it("should resolve undefined when the app handles the failure", async () => {
    const error = new KeyRingError("pairing-invalid-qr-code");
    const joinPairing = jest.fn().mockRejectedValue(error);
    const onFailure = jest.fn(() => true);
    const { result, store, onJoined } = renderJoin(joinPairing, { onFailure });

    let outcome: true | undefined = true;
    await act(async () => {
      outcome = await result.current.start("url", selectKeyRingSession(store.getState()));
    });

    expect(outcome).toBeUndefined();
    expect(onFailure).toHaveBeenCalledWith(error);
    expect(onJoined).not.toHaveBeenCalled();
  });

  it("should throw again a failure the app does not handle", async () => {
    const error = new Error("boom");
    const joinPairing = jest.fn().mockRejectedValue(error);
    const { result, store } = renderJoin(joinPairing);

    await act(() =>
      expect(result.current.start("url", selectKeyRingSession(store.getState()))).rejects.toBe(
        error,
      ),
    );
  });

  it("should send nothing before the pairing asks for digits", () => {
    const { result } = renderJoin(jest.fn());
    expect(result.current.sendDigits("123")).toBe(true);
  });
});

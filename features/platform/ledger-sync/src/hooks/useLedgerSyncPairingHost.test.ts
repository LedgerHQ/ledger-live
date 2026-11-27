/**
 * @jest-environment jsdom
 */
import { act, waitFor } from "@testing-library/react";
import { selectKeyRingTreeId } from "@domain/entity-key-ring";
import { mockKeyRingState } from "@domain/entity-key-ring/slice.mock";
import {
  KeyRingError,
  KeyRingPairingClosedError,
  commitKeyRingTree,
  selectKeyRingSession,
  type KeyRingHostPairingOptions,
  type KeyRingSession,
  type KeyRingTreeUpdate,
} from "@features/platform-key-ring";
import { fakeKeyRingClient } from "@features/platform-key-ring/testing";
import { LedgerSyncQueryKey } from "../logic/queryKeys";
import type { LedgerSyncPairingHostOptions } from "../types";
import { flushAnalytics, listenToAnalytics, stopAnalytics } from "../__tests__/analytics";
import { newTreeUpdate } from "../__tests__/fixtures";
import { renderLedgerSyncHook } from "../__tests__/harness";
import { useLedgerSyncPairingHost } from "./useLedgerSyncPairingHost";

type HostPairing = (
  session: KeyRingSession,
  options: KeyRingHostPairingOptions,
) => Promise<KeyRingTreeUpdate | null>;

const NOT_MEMBER = mockKeyRingState({ trustchain: null });

function renderHost(
  hostPairing: jest.Mock<ReturnType<HostPairing>, Parameters<HostPairing>>,
  options: Partial<LedgerSyncPairingHostOptions> = {},
  trustchain = mockKeyRingState(),
) {
  const sequence: string[] = [];
  const vendor = listenToAnalytics(sequence);
  const callbacks = {
    onDisplayDigits: jest.fn((digits: string) => {
      sequence.push(`digits:${digits}`);
    }),
    onPaired: jest.fn(() => {
      sequence.push("onPaired");
    }),
    onDigitsCleared: jest.fn(() => {
      sequence.push("onDigitsCleared");
    }),
    onFailure: jest.fn(),
  };
  const rendered = renderLedgerSyncHook(
    () =>
      useLedgerSyncPairingHost({
        client: fakeKeyRingClient({ hostPairing }),
        memberName: "Desktop",
        startBinding: "session",
        notifyPaired: "before-members-refresh",
        getActivatedEventProperties: () => ({ flow: "Ledger Sync" }),
        ...callbacks,
        ...options,
      }),
    { trustchain, sequence },
  );
  rendered.queryClient.setQueryData([LedgerSyncQueryKey.members, null], []);
  rendered.queryClient.getQueryCache().subscribe(event => {
    if (event.type === "updated" && event.action.type === "invalidate") {
      sequence.push("members-invalidated");
    }
  });
  sequence.length = 0;
  return { ...rendered, ...callbacks, sequence, vendor };
}

function pairingThat(
  run: (options: KeyRingHostPairingOptions) => Promise<KeyRingTreeUpdate | null>,
) {
  return jest.fn<ReturnType<HostPairing>, Parameters<HostPairing>>((_session, options) =>
    run(options),
  );
}

afterEach(stopAnalytics);

describe("useLedgerSyncPairingHost", () => {
  it("should show the QR code URL and pass the digits to the app", async () => {
    const hostPairing = pairingThat(options => {
      options.onDisplayQRCode("https://pairing.test/qr");
      options.onDisplayDigits("123");
      return new Promise(() => undefined);
    });
    const { result, onDisplayDigits } = renderHost(hostPairing);

    act(() => result.current.start());

    await waitFor(() => expect(result.current.url).toBe("https://pairing.test/qr"));
    expect(onDisplayDigits).toHaveBeenCalledWith("123");
    expect(result.current.isLoading).toBe(true);
    expect(hostPairing.mock.calls[0][1].memberName).toBe("Desktop");
  });

  it("should not start without a member key", () => {
    const hostPairing = pairingThat(() => new Promise(() => undefined));
    const { result } = renderHost(hostPairing, {}, mockKeyRingState({ memberCredentials: null }));

    act(() => result.current.start());

    expect(hostPairing).not.toHaveBeenCalled();
  });

  it.each([
    ["before-members-refresh", ["onPaired", "members-invalidated", "onDigitsCleared"]],
    ["after-members-refresh", ["members-invalidated", "onPaired", "onDigitsCleared"]],
  ] as const)(
    "should store the key tree, then notify the app %s",
    async (notifyPaired, expected) => {
      const hostPairing = pairingThat(async options => {
        options.onDisplayQRCode("https://pairing.test/qr");
        return newTreeUpdate("paired-root");
      });
      const { result, sequence, store } = renderHost(hostPairing, { notifyPaired });

      act(() => result.current.start());

      await waitFor(() => expect(sequence).toContain("onDigitsCleared"));
      expect(sequence).toEqual(["trustchain/keyRingTreeSet", ...expected]);
      expect(selectKeyRingTreeId(store.getState())).toBe("paired-root");
      expect(result.current.url).toBeNull();
    },
  );

  it("should track the activation when the instance joins its first key tree", async () => {
    const hostPairing = pairingThat(async () => newTreeUpdate());
    const { result, onDigitsCleared, vendor } = renderHost(hostPairing, {}, NOT_MEMBER);

    act(() => result.current.start());

    await waitFor(() => expect(onDigitsCleared).toHaveBeenCalled());
    await flushAnalytics();
    expect(vendor).toHaveBeenCalledWith("ledgersync_activated", { flow: "Ledger Sync" });
  });

  it("should not track the activation when the instance was already a member", async () => {
    const hostPairing = pairingThat(async () => newTreeUpdate());
    const { result, onDigitsCleared, vendor } = renderHost(hostPairing);

    act(() => result.current.start());

    await waitFor(() => expect(onDigitsCleared).toHaveBeenCalled());
    await flushAnalytics();
    expect(vendor).not.toHaveBeenCalled();
  });

  it("should notify the app without storing anything when the pairing ends without a key tree", async () => {
    const hostPairing = pairingThat(async () => null);
    const { result, sequence, onPaired } = renderHost(hostPairing, {}, NOT_MEMBER);

    act(() => result.current.start());

    await waitFor(() => expect(onPaired).toHaveBeenCalled());
    expect(sequence).not.toContain("trustchain/keyRingTreeSet");
    expect(sequence).not.toContain("track");
  });

  it("should show a new QR code when the channel closed after 30 seconds", async () => {
    const hostPairing = pairingThat(() => new Promise(() => undefined));
    hostPairing.mockImplementationOnce(() =>
      Promise.reject(new KeyRingPairingClosedError("closed", { elapsedMs: 30_000 })),
    );
    const { result, onFailure } = renderHost(hostPairing);

    act(() => result.current.start());

    await waitFor(() => expect(hostPairing).toHaveBeenCalledTimes(2));
    expect(onFailure).not.toHaveBeenCalled();
  });

  it("should neither restart nor report a channel closed before 30 seconds", async () => {
    const hostPairing = pairingThat(() =>
      Promise.reject(new KeyRingPairingClosedError("closed", { elapsedMs: 29_999 })),
    );
    const { result, onFailure } = renderHost(hostPairing);

    act(() => result.current.start());

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(hostPairing).toHaveBeenCalledTimes(1);
    expect(onFailure).not.toHaveBeenCalled();
  });

  it("should report any other failure with its category and a restart", async () => {
    const error = new KeyRingError("pairing-protocol");
    const hostPairing = pairingThat(() => new Promise(() => undefined));
    hostPairing.mockImplementationOnce(() => Promise.reject(error));
    const { result, onFailure } = renderHost(hostPairing);

    act(() => result.current.start());

    await waitFor(() => expect(onFailure).toHaveBeenCalledTimes(1));
    const [failure] = onFailure.mock.calls[0];
    expect(failure.category).toBe("pairing-protocol");
    expect(failure.error).toBe(error);

    act(() => failure.restart());
    await waitFor(() => expect(hostPairing).toHaveBeenCalledTimes(2));
  });

  it("should report an error that is not a key ring error without a category", async () => {
    const error = new Error("boom");
    const hostPairing = pairingThat(() => Promise.reject(error));
    const { result, onFailure } = renderHost(hostPairing);

    act(() => result.current.start());

    await waitFor(() => expect(onFailure).toHaveBeenCalled());
    expect(onFailure.mock.calls[0][0]).toEqual(
      expect.objectContaining({ category: undefined, error }),
    );
  });

  it("should change start with the key tree and pair the captured session with the session binding", async () => {
    const hostPairing = pairingThat(() => new Promise(() => undefined));
    const { result, store } = renderHost(hostPairing, { startBinding: "session" });
    const firstStart = result.current.start;
    const firstSession = selectKeyRingSession(store.getState());

    act(() => {
      store.dispatch(commitKeyRingTree(newTreeUpdate("rotated-root")));
    });
    expect(result.current.start).not.toBe(firstStart);

    act(() => firstStart());
    await waitFor(() => expect(hostPairing).toHaveBeenCalled());
    expect(hostPairing.mock.calls[0][0]).toBe(firstSession);
  });

  it("should keep start across key tree changes and pair the latest session with the member key binding", async () => {
    const hostPairing = pairingThat(() => new Promise(() => undefined));
    const { result, store } = renderHost(hostPairing, { startBinding: "member-key" });
    const firstStart = result.current.start;

    act(() => {
      store.dispatch(commitKeyRingTree(newTreeUpdate("rotated-root")));
    });
    expect(result.current.start).toBe(firstStart);

    act(() => firstStart());
    await waitFor(() => expect(hostPairing).toHaveBeenCalled());
    expect(hostPairing.mock.calls[0][0]).toBe(selectKeyRingSession(store.getState()));
  });
});

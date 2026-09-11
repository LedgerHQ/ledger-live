import React from "react";
import { FEATURE_FLAGS_INITIAL_STATE, setRemoteFlagsReady } from "@shared/feature-flags";
import { act, render, screen } from "tests/testSetup";
import { WalletSyncProvider, useWalletSyncUserState } from "../components/WalletSyncContext";
import { useWatchWalletSync } from "../hooks/useWatchWalletSync";

jest.mock("../hooks/useWatchWalletSync", () => ({
  useWatchWalletSync: jest.fn(() => ({
    visualPending: false,
    walletSyncError: null,
    onUserRefresh: () => {},
  })),
}));

function Child({ onMount }: { onMount: () => void }) {
  React.useEffect(() => {
    onMount();
  }, [onMount]);
  return <div>child</div>;
}

function PendingProbe() {
  const { visualPending } = useWalletSyncUserState();
  return <span data-testid="pending">{String(visualPending)}</span>;
}

function renderProvider(remoteFlagsReady: boolean, onMount: () => void) {
  return render(
    <WalletSyncProvider>
      <Child onMount={onMount} />
    </WalletSyncProvider>,
    { initialState: { featureFlags: { ...FEATURE_FLAGS_INITIAL_STATE, remoteFlagsReady } } },
  );
}

describe("WalletSyncProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not watch wallet sync while the remote flags have not resolved", () => {
    renderProvider(false, jest.fn());

    // `useWatchWalletSync` builds the trustchain SDK once and keeps it for the session, so it
    // must not run while the flags still hold their compiled defaults.
    expect(useWatchWalletSync).not.toHaveBeenCalled();
    expect(screen.getByText("child")).toBeVisible();
  });

  it("should watch wallet sync once the remote flags resolve", () => {
    const { store } = renderProvider(false, jest.fn());
    expect(useWatchWalletSync).not.toHaveBeenCalled();

    act(() => {
      store.dispatch(setRemoteFlagsReady());
    });

    expect(useWatchWalletSync).toHaveBeenCalled();
  });

  it("should not remount its children when readiness flips", () => {
    const onMount = jest.fn();
    const { store } = renderProvider(false, onMount);
    expect(onMount).toHaveBeenCalledTimes(1);

    act(() => {
      store.dispatch(setRemoteFlagsReady());
    });

    // Gating by swapping the element type around `children` would tear down the whole app
    // subtree here, navigation included.
    expect(onMount).toHaveBeenCalledTimes(1);
  });

  it("should settle even when the watched state is a fresh object on every render", () => {
    // The mock returns a new object and a new callback each call, which is what an unmemoised
    // `useWatchWalletSync` would do. Lifting that object wholesale into provider state loops
    // forever, so the provider must only lift the status fields, behind an identity check.
    const { store } = renderProvider(false, jest.fn());

    act(() => {
      store.dispatch(setRemoteFlagsReady());
    });

    expect(jest.mocked(useWatchWalletSync).mock.calls.length).toBeLessThan(10);
  });

  it("should report the sync as pending until the watcher has reported", () => {
    // `useWatchWalletSync` starts at `visualPending: true`, and while it is gated off the provider
    // stands in for it. It has to stand in as pending, not idle: `useLoadingStep` reads
    // `!visualPending` as "the watch loop finished" and would send the activation flow to its
    // success screen on a sync that never ran. The idle value stays the outside-provider default.
    const { store } = render(
      <WalletSyncProvider>
        <PendingProbe />
      </WalletSyncProvider>,
      {
        initialState: {
          featureFlags: { ...FEATURE_FLAGS_INITIAL_STATE, remoteFlagsReady: false },
        },
      },
    );
    expect(screen.getByTestId("pending")).toHaveTextContent("true");

    act(() => {
      store.dispatch(setRemoteFlagsReady());
    });

    // And it yields to the watcher the moment there is a real answer.
    expect(screen.getByTestId("pending")).toHaveTextContent("false");
  });
});

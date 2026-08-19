import React from "react";
import { render, screen, act } from "tests/testSetup";

// Capture the props SideDrawer receives on every render so we can inspect the value at
// the moment the drawer closes — LiveAppDrawer resets shouldRestoreFocusOnClose back to
// true on the following render, so the final value is not the meaningful one.
type SideDrawerSnapshot = { isOpen: boolean; shouldRestoreFocusOnClose: boolean };
const mockSnapshots: SideDrawerSnapshot[] = [];
let mockLastProps: { onRequestClose?: () => void } = {};

jest.mock("~/renderer/components/SideDrawer", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SideDrawer: (props: any) => {
    mockSnapshots.push({
      isOpen: props.isOpen,
      shouldRestoreFocusOnClose: props.shouldRestoreFocusOnClose,
    });
    mockLastProps = props;
    return props.isOpen ? <div>{props.children}</div> : null;
  },
}));

// Stub the exchange-complete body: it only needs to pass isCompleteExchangeData and let
// the test flip LiveAppDrawer into its "completed" state by invoking data.onResult.
jest.mock("~/renderer/modals/Platform/Exchange/CompleteExchange/Body", () => ({
  __esModule: true,
  isCompleteExchangeData: () => true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ data }: any) => (
    <button type="button" onClick={() => data.onResult({ id: "op-1" })}>
      complete
    </button>
  ),
}));

// Avoid real account-sync side effects when onResult fires.
jest.mock("~/renderer/hooks/useSyncAccountsById", () => ({
  useSyncAccountsById: () => jest.fn(),
}));

import { LiveAppDrawer } from "~/renderer/components/LiveAppDrawer";

const openCompletedExchangeState = {
  UI: {
    informationCenter: { isOpen: false, tabId: "announcement" },
    platformAppDrawer: {
      isOpen: true,
      payload: {
        type: "EXCHANGE_COMPLETE",
        title: "swap.title",
        data: {
          exchange: { fromAccount: { type: "Account", id: "acc-1" } },
          onResult: jest.fn(),
          onCancel: jest.fn(),
        },
      },
    },
    isMemoTagBoxVisible: false,
    forceAutoFocusOnMemoField: false,
  },
};

describe("LiveAppDrawer", () => {
  beforeEach(() => {
    mockSnapshots.length = 0;
    mockLastProps = {};
  });

  it("does not restore focus on close once the exchange has completed", async () => {
    // Regression: closing the swap broadcast-success screen restored focus to the swap
    // <webview>, whose Electron guest had been torn down, crashing with
    // "Cannot read properties of null (reading 'focus')". A completed exchange must close
    // without restoring focus.
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const { user } = render(<LiveAppDrawer />, {
      initialState: openCompletedExchangeState as never,
    });

    // Before completion, focus is still restored on close (webview is alive).
    expect(mockSnapshots.at(-1)?.shouldRestoreFocusOnClose).toBe(true);

    // Broadcast success -> LiveAppDrawer marks the exchange completed.
    await user.click(screen.getByRole("button", { name: "complete" }));

    // Close via the header / backdrop / Escape path.
    act(() => {
      mockLastProps.onRequestClose?.();
    });

    // The value SideDrawer sees at the close render (isOpen -> false) must be false, so
    // its focus-trap deactivates without returning focus to the detached webview.
    const closeSnapshot = mockSnapshots.find(snapshot => !snapshot.isOpen);
    expect(closeSnapshot?.shouldRestoreFocusOnClose).toBe(false);
  });
});

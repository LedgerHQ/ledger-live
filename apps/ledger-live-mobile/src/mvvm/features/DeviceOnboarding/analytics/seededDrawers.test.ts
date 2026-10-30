import {
  getCurrentTrackingPage,
  resetTrackingPages,
  setAnalytics,
  setEnabledFn,
  trackPage,
} from "@shared/analytics";
import { act, renderHook, waitFor } from "@tests/test-renderer";
import { useSyncOfferScreenViewModel } from "../screens/SyncOffer/useSyncOfferScreenViewModel";
import { seededPages, trackSeededPage } from "./seededTracking";
import { useSeededFunnelTracking } from "./useSeededFunnelTracking";

// The real page refs and delivery: drawers break attribution through that shared state.
jest.mock("@shared/analytics", () => jest.requireActual("@shared/analytics"));

const sink = jest.fn();

beforeEach(() => {
  sink.mockReset();
  resetTrackingPages();
  setEnabledFn(() => true);
  setAnalytics({ track: sink });
});

afterAll(() => {
  setAnalytics(undefined);
  setEnabledFn(undefined);
});

/** Opens a drawer the way its TrackScreen does. */
function openDrawer(page: string, refreshSource = true) {
  trackPage({ category: page }, { updateRoutes: true, refreshSource });
}

async function expectClick(button: string, page: string, source: string) {
  await waitFor(() =>
    expect(sink).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button, page, source }),
    ),
  );
}

type FunnelState = { state: string; extra?: Record<string, unknown> };

function renderFunnel(initial: FunnelState) {
  let current = initial;
  const view = renderHook(() =>
    useSeededFunnelTracking({
      machineState: current.state,
      context: { onboardedOnEntry: true, deviceModelId: "stax", ...current.extra },
      offerSync: true,
      firmwareUpdateDone: false,
    }),
  );
  const moveTo = (next: FunnelState) => {
    current = next;
    view.rerender({});
  };
  return { ...view, moveTo };
}

describe("seeded clicks under a drawer", () => {
  it("keeps the refused page and its source when the error drawer opens", async () => {
    const { result, moveTo } = renderFunnel({ state: "checks.genuineCheck.running" });
    moveTo({
      state: "checks.genuineFailed",
      extra: { genuineFailureKind: "GENUINE_CHECK_REFUSED" },
    });
    openDrawer("Error: unknown error", false);

    act(() => result.current.trackClick("Retry genuine check"));

    expect(getCurrentTrackingPage()).toBe(seededPages.genuineCheckRefused);
    await expectClick(
      "Retry genuine check",
      seededPages.genuineCheckRefused,
      seededPages.genuineCheckStarted,
    );
  });

  it("restores the OS update page when the unsupported drawer is dismissed", async () => {
    const { result } = renderFunnel({
      state: "checks.firmwareUpdateOffered",
      extra: { availableFirmwareVersion: "1.2.0" },
    });

    act(() => result.current.trackUnsupportedUpdate(true));
    act(() => result.current.trackUnsupportedUpdateClosed());
    act(() => result.current.trackClick("close"));

    expect(getCurrentTrackingPage()).toBe(seededPages.osUpdateRequired);
    await expectClick("close", seededPages.osUpdateRequired, seededPages.genuineCheckSuccess);
  });

  it("restores Ledger Sync when the skip drawer is dismissed, but not after Yes, skip", async () => {
    trackSeededPage(seededPages.checksSuccess, "stax");
    trackSeededPage(seededPages.ledgerSync, "stax");
    const { result } = renderHook(() =>
      useSyncOfferScreenViewModel({
        onActivate: jest.fn(),
        onSkip: jest.fn(),
        onLearnMore: jest.fn(),
        onQuit: jest.fn(),
        seededDeviceType: "stax",
      }),
    );

    act(() => result.current.onOpenSkip());
    openDrawer(seededPages.skipLedgerSyncDrawer);
    act(() => result.current.skipDrawer.onClose());
    expect(getCurrentTrackingPage()).toBe(seededPages.ledgerSync);

    act(() => result.current.onActivate());
    await expectClick("Activate sync", seededPages.ledgerSync, seededPages.checksSuccess);

    act(() => result.current.onOpenSkip());
    openDrawer(seededPages.skipLedgerSyncDrawer);
    act(() => result.current.skipDrawer.onSkip());
    act(() => result.current.skipDrawer.onClose());
    expect(getCurrentTrackingPage()).toBe(seededPages.ledgerSyncRefused);
    await expectClick("Yes, skip", seededPages.ledgerSync, seededPages.checksSuccess);
  });
});

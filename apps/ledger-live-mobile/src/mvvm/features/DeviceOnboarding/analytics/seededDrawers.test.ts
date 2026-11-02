import { getCurrentTrackingPage, trackPage } from "@shared/analytics";
import { act, renderHook } from "@tests/test-renderer";
import { useSyncOfferScreenViewModel } from "../screens/SyncOffer/useSyncOfferScreenViewModel";
import { recordAnalytics } from "./recordAnalytics.testUtils";
import { seededPages, trackSeededPage } from "./seededTracking";
import { useSeededFunnelTracking } from "./useSeededFunnelTracking";

// The real page refs: a drawer changes them, and that is what these tests check.
jest.mock("@shared/analytics", () => jest.requireActual("@shared/analytics"));

const sent = recordAnalytics();

/** Opens a drawer the way its TrackScreen does. */
function openDrawer(page: string, refreshSource = true) {
  trackPage({ category: page }, { updateRoutes: true, refreshSource });
}

async function clicks() {
  return (await sent())
    .filter(([event]) => event === "button_clicked")
    .map(([, { button, page, source }]) => [button, page, source]);
}

function renderFunnel(state: string, extra: Record<string, unknown> = {}) {
  let current = { state, extra };
  const view = renderHook(() =>
    useSeededFunnelTracking({
      machineState: current.state,
      context: { onboardedOnEntry: true, deviceModelId: "stax", ...current.extra },
      offerSync: true,
      firmwareUpdateDone: false,
    }),
  );
  const moveTo = (nextState: string, nextExtra: Record<string, unknown> = {}) => {
    current = { state: nextState, extra: nextExtra };
    view.rerender({});
  };
  return { ...view, moveTo };
}

describe("seeded clicks under a drawer", () => {
  it("keeps the refused page and its source when the error drawer opens", async () => {
    const { result, moveTo } = renderFunnel("checks.genuineCheck.running");
    moveTo("checks.genuineFailed", { genuineFailureKind: "GENUINE_CHECK_REFUSED" });
    openDrawer("Error: unknown error", false);

    act(() => result.current.trackClick("Retry genuine check"));

    expect(getCurrentTrackingPage()).toBe(seededPages.genuineCheckRefused);
    expect(await clicks()).toEqual([
      ["Retry genuine check", seededPages.genuineCheckRefused, seededPages.genuineCheckStarted],
    ]);
  });

  it("restores the OS update page when the unsupported drawer is dismissed", async () => {
    const { result } = renderFunnel("checks.firmwareUpdateOffered", {
      availableFirmwareVersion: "1.2.0",
    });

    act(() => result.current.trackUnsupportedUpdate(true));
    act(() => result.current.trackUnsupportedUpdateClosed());
    act(() => result.current.trackClick("close"));

    expect(getCurrentTrackingPage()).toBe(seededPages.osUpdateRequired);
    expect(await clicks()).toEqual([
      ["close", seededPages.osUpdateRequired, seededPages.genuineCheckSuccess],
    ]);
  });

  it("tracks the skip drawer buttons on the drawer, and restores Ledger Sync on dismiss", async () => {
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

    act(() => result.current.onOpenSkip());
    openDrawer(seededPages.skipLedgerSyncDrawer);
    act(() => result.current.skipDrawer.onSkip());
    act(() => result.current.skipDrawer.onClose());

    expect(getCurrentTrackingPage()).toBe(seededPages.ledgerSyncRefused);
    expect(await clicks()).toEqual([
      ["Skip", seededPages.ledgerSync, seededPages.checksSuccess],
      ["Skip", seededPages.ledgerSync, seededPages.checksSuccess],
      ["Yes, skip", seededPages.skipLedgerSyncDrawer, seededPages.ledgerSync],
    ]);
  });
});

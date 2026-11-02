import { track, trackPage } from "@shared/analytics";
import { act, renderHook } from "@tests/test-renderer";
import { seededPages } from "../../analytics/seededTracking";
import { useSyncOfferScreenViewModel } from "./useSyncOfferScreenViewModel";

jest.mock("@shared/analytics", () => ({
  track: jest.fn(),
  trackPage: jest.fn(),
  getPreviousTrackingPage: jest.fn(() => "Page Before"),
}));

const shared = {
  sourceFlow: "onboarding",
  "onboarding type": "seeded device",
  seedConfiguration: "already_seeded",
  deviceType: "stax",
};

function renderScreen(seededDeviceType: string | null = "stax") {
  const actions = {
    onActivate: jest.fn(),
    onSkip: jest.fn(),
    onLearnMore: jest.fn(),
    onQuit: jest.fn(),
  };
  const view = renderHook(() => useSyncOfferScreenViewModel({ ...actions, seededDeviceType }));
  return { ...view, ...actions };
}

const clicks = () =>
  jest
    .mocked(track)
    .mock.calls.filter(([event]) => event === "button_clicked")
    .map(([, props]) => props);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useSyncOfferScreenViewModel", () => {
  it.each([
    ["Activate sync", "onActivate", "onActivate"],
    ["Learn more", "onLearnMore", "onLearnMore"],
    ["close", "onQuit", "onQuit"],
  ] as const)("should track %s on the offer", (button, press, action) => {
    const screen = renderScreen();

    act(() => screen.result.current[press]());

    expect(screen[action]).toHaveBeenCalledTimes(1);
    expect(clicks()).toEqual([
      { source: "Page Before", ...shared, button, page: seededPages.ledgerSync },
    ]);
  });

  it.each([
    ["Yes, skip", "onSkip", "onSkip"],
    ["Enable sync", "onActivate", "onActivate"],
  ] as const)("should track %s on the skip drawer", (button, press, action) => {
    const screen = renderScreen();

    act(() => screen.result.current.onOpenSkip());
    expect(screen.result.current.skipDrawer.isOpen).toBe(true);
    act(() => screen.result.current.skipDrawer[press]());

    expect(screen.result.current.skipDrawer.isOpen).toBe(false);
    expect(screen[action]).toHaveBeenCalledTimes(1);
    expect(clicks()).toEqual([
      expect.objectContaining({ button: "Skip", page: seededPages.ledgerSync }),
      {
        source: seededPages.ledgerSync,
        ...shared,
        button,
        page: seededPages.skipLedgerSyncDrawer,
      },
    ]);
  });

  it("should track the refused page after Yes, skip", () => {
    const { result } = renderScreen();

    act(() => result.current.onOpenSkip());
    act(() => result.current.skipDrawer.onSkip());

    expect(result.current.trackingProps).toEqual(shared);
    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({ category: seededPages.ledgerSyncRefused }),
      expect.anything(),
    );
  });

  it("should send nothing when the offer is not a seeded entry", () => {
    const { result, onQuit } = renderScreen(null);

    act(() => result.current.onQuit());
    act(() => result.current.onOpenSkip());
    act(() => result.current.skipDrawer.onSkip());

    expect(result.current.trackingProps).toBeNull();
    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(track).not.toHaveBeenCalled();
    expect(trackPage).not.toHaveBeenCalled();
  });
});

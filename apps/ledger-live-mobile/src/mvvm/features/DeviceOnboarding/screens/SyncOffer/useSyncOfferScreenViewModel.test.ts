import { DeviceModelId as DmkDeviceModelId } from "@ledgerhq/device-management-kit";
import { track, trackPage } from "@shared/analytics";
import { act, renderHook } from "@tests/test-renderer";
import { seededPages } from "@features/platform-device-onboarding-analytics";
import {
  useSyncOfferScreenViewModel,
  type SyncOfferPhase,
  type SyncOfferViewProps,
} from "./useSyncOfferScreenViewModel";

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
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

function renderScreen(
  seededDeviceType: DmkDeviceModelId | null = DmkDeviceModelId.STAX,
  phase: SyncOfferPhase = "offer",
) {
  const actions = {
    onActivate: jest.fn(),
    onSkip: jest.fn(),
    onLearnMore: jest.fn(),
    onQuit: jest.fn(),
    onContinue: jest.fn(),
  };
  const view = renderHook(() =>
    useSyncOfferScreenViewModel({ ...actions, phase, seededDeviceType }),
  );
  return { ...view, ...actions };
}

function offerOf(model: SyncOfferViewProps) {
  if (model.phase !== "offer") throw new Error(model.phase);
  return model;
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

    act(() => offerOf(screen.result.current)[press]());

    expect(screen[action]).toHaveBeenCalledTimes(1);
    expect(clicks()).toEqual([{ source: "Page Before", ...shared, button }]);
  });

  it.each([
    ["Yes, skip", "onSkip", "onSkip"],
    ["Enable sync", "onActivate", "onActivate"],
  ] as const)("should track %s on the skip drawer", (button, press, action) => {
    const screen = renderScreen();

    act(() => offerOf(screen.result.current).onOpenSkip());
    expect(offerOf(screen.result.current).skipDrawer.isOpen).toBe(true);
    act(() => offerOf(screen.result.current).skipDrawer[press]());

    expect(offerOf(screen.result.current).skipDrawer.isOpen).toBe(false);
    expect(screen[action]).toHaveBeenCalledTimes(1);
    expect(clicks()).toEqual([
      { source: "Page Before", ...shared, button: "Skip" },
      { source: "Page Before", ...shared, button },
    ]);
  });

  it("should send nothing when the offer is not a seeded entry", () => {
    const { result, onQuit } = renderScreen(null);

    act(() => offerOf(result.current).onQuit());
    act(() => offerOf(result.current).onOpenSkip());
    act(() => offerOf(result.current).skipDrawer.onSkip());

    expect(offerOf(result.current).screenTracking).toBeNull();
    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(track).not.toHaveBeenCalled();
    expect(trackPage).not.toHaveBeenCalled();
  });

  it("should track continue and close on the success screen", () => {
    const { result, onContinue, onQuit } = renderScreen(DmkDeviceModelId.STAX, "success");
    if (result.current.phase !== "success") throw new Error(result.current.phase);

    expect(result.current.screenTracking).toEqual({ category: "Ledger Sync Success", ...shared });
    act(() => {
      if (result.current.phase !== "success") return;
      result.current.onContinue();
      result.current.onQuit();
    });

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(clicks()).toEqual([
      expect.objectContaining({ button: "Continue" }),
      expect.objectContaining({ button: "close" }),
    ]);
  });

  it("should send close only when the user closes the skip drawer, not when code closes it", () => {
    const { result } = renderScreen();
    act(() => offerOf(result.current).onOpenSkip());
    jest.mocked(track).mockClear();

    act(() => offerOf(result.current).skipDrawer.onClose());
    expect(clicks()).toEqual([]);

    act(() => offerOf(result.current).skipDrawer.onClosePressed());
    expect(clicks()).toEqual([expect.objectContaining({ button: "close", ...shared })]);
  });

  it("should track close while the first sync runs", () => {
    const { result, onQuit } = renderScreen(DmkDeviceModelId.STAX, "synchronizing");

    act(() => result.current.onQuit());

    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(clicks()).toEqual([expect.objectContaining({ button: "close", ...shared })]);
  });
});

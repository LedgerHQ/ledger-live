import { track, trackPage } from "@shared/analytics";
import { act, renderHook } from "@tests/test-renderer";
import { seededPages } from "../../analytics/seededTracking";
import { useSyncOfferScreenViewModel } from "./useSyncOfferScreenViewModel";

jest.mock("@shared/analytics", () => ({
  track: jest.fn(),
  trackPage: jest.fn(),
  getPreviousTrackingPage: jest.fn(() => "Page Before"),
}));

function renderScreen(seededDeviceType: string | null = "stax") {
  const onActivate = jest.fn();
  const onSkip = jest.fn();
  const onLearnMore = jest.fn();
  const onQuit = jest.fn();
  const view = renderHook(() =>
    useSyncOfferScreenViewModel({ onActivate, onSkip, onLearnMore, onQuit, seededDeviceType }),
  );

  return { ...view, onActivate, onSkip, onLearnMore, onQuit };
}

function expectClick(button: string) {
  expect(track).toHaveBeenCalledWith(
    "button_clicked",
    expect.objectContaining({
      button,
      source: "Page Before",
      seedConfiguration: "already_seeded",
      deviceType: "stax",
    }),
  );
}

describe("useSyncOfferScreenViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should track activate sync when the primary action is pressed", () => {
    const { result, onActivate } = renderScreen();

    act(() => result.current.onActivate());

    expectClick("Activate sync");
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it("should track skip when the drawer opens", () => {
    const { result, onSkip } = renderScreen();

    act(() => result.current.onOpenSkip());

    expect(result.current.skipDrawer.isOpen).toBe(true);
    expectClick("Skip");
    expect(onSkip).not.toHaveBeenCalled();
  });

  it("should track learn more without an OpenURL event", () => {
    const { result, onLearnMore } = renderScreen();

    act(() => result.current.onLearnMore());

    expectClick("Learn more");
    expect(track).not.toHaveBeenCalledWith("OpenURL", expect.anything());
    expect(onLearnMore).toHaveBeenCalledTimes(1);
  });

  it("should track close from the offer header", () => {
    const { result, onQuit } = renderScreen();

    act(() => result.current.onQuit());

    expectClick("close");
    expect(onQuit).toHaveBeenCalledTimes(1);
  });

  it("should track the skip confirmation and the refused page", () => {
    const { result, onSkip } = renderScreen();

    act(() => result.current.onOpenSkip());
    act(() => result.current.skipDrawer.onSkip());

    expectClick("Yes, skip");
    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({ category: seededPages.ledgerSyncRefused }),
      expect.anything(),
    );
    expect(result.current.skipDrawer.isOpen).toBe(false);
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("should track enable sync from the skip drawer", () => {
    const { result, onActivate, onSkip } = renderScreen();

    act(() => result.current.onOpenSkip());
    act(() => result.current.skipDrawer.onActivate());

    expectClick("Enable sync");
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onSkip).not.toHaveBeenCalled();
  });

  it("should omit seeded tracking when the offer is not a seeded entry", () => {
    const { result, onQuit } = renderScreen(null);

    expect(result.current.trackingProps).toBeNull();
    act(() => result.current.onQuit());
    act(() => result.current.onOpenSkip());
    act(() => result.current.skipDrawer.onSkip());

    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(track).not.toHaveBeenCalled();
    expect(trackPage).not.toHaveBeenCalled();
  });

  it("should pass the seeded props to the offer and skip drawer pages", () => {
    const { result } = renderScreen();

    expect(result.current.trackingProps).toEqual({
      sourceFlow: "onboarding",
      "onboarding type": "seeded device",
      seedConfiguration: "already_seeded",
      deviceType: "stax",
    });
  });
});

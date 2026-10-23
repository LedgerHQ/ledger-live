import {
  getCurrentTrackingPage,
  getPreviousTrackingPage,
  restoreTrackingPages,
  track,
  trackPage,
} from "@shared/analytics";
import { act, renderHook } from "@tests/test-renderer";
import { resetSeededOnboardingAnalytics, seededPages } from "../../analytics/seededTracking";
import { useSyncOfferScreenViewModel } from "./useSyncOfferScreenViewModel";

jest.mock("@shared/analytics", () => ({
  track: jest.fn(),
  trackPage: jest.fn(),
  getCurrentTrackingPage: jest.fn(() => "Ledger Sync"),
  getPreviousTrackingPage: jest.fn(() => "Page Before"),
  restoreTrackingPages: jest.fn(),
}));

let currentPage = "Ledger Sync";
let previousPage = "Page Before";

function renderScreen(analytics?: boolean) {
  const onActivate = jest.fn();
  const onSkip = jest.fn();
  const onLearnMore = jest.fn();
  const onQuit = jest.fn();
  const view = renderHook(() =>
    useSyncOfferScreenViewModel({ onActivate, onSkip, onLearnMore, onQuit, analytics }),
  );

  return { ...view, onActivate, onSkip, onLearnMore, onQuit };
}

describe("useSyncOfferScreenViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSeededOnboardingAnalytics();
    currentPage = "Ledger Sync";
    previousPage = "Page Before";
    jest.mocked(getCurrentTrackingPage).mockImplementation(() => currentPage);
    jest.mocked(getPreviousTrackingPage).mockImplementation(() => previousPage);
    jest.mocked(restoreTrackingPages).mockImplementation((current?: string, previous?: string) => {
      currentPage = current ?? "";
      previousPage = previous ?? "";
    });
  });

  it("should track activate sync when the primary action is pressed", () => {
    const { result, onActivate } = renderScreen();

    act(() => result.current.onActivate());

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "Activate sync",
        page: seededPages.ledgerSync,
        seedConfiguration: "already_seeded",
      }),
      expect.anything(),
    );
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it("should track skip when the drawer opens", () => {
    const { result, onSkip } = renderScreen();

    act(() => result.current.onOpenSkip());

    expect(result.current.skipDrawer.isOpen).toBe(true);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "Skip", page: seededPages.ledgerSync }),
      expect.anything(),
    );
    expect(onSkip).not.toHaveBeenCalled();
  });

  it("should track learn more without an OpenURL event", () => {
    const { result, onLearnMore } = renderScreen();

    act(() => result.current.onLearnMore());

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "Learn more" }),
      expect.anything(),
    );
    expect(track).not.toHaveBeenCalledWith("OpenURL", expect.anything());
    expect(onLearnMore).toHaveBeenCalledTimes(1);
  });

  it("should track close from the offer header", () => {
    const { result, onQuit } = renderScreen();

    act(() => result.current.onQuit());

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "close", page: seededPages.ledgerSync }),
      expect.anything(),
    );
    expect(onQuit).toHaveBeenCalledTimes(1);
  });

  it("should track the skip confirmation and the refused page", () => {
    const { result, onSkip } = renderScreen();

    act(() => {
      result.current.onOpenSkip();
      result.current.skipDrawer.onSkip();
    });

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "Yes, skip", page: seededPages.skipDrawer }),
      expect.anything(),
    );
    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({ category: seededPages.ledgerSyncRefused }),
      expect.anything(),
    );
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("should track enable sync from the skip drawer", () => {
    const { result, onActivate, onSkip } = renderScreen();

    act(() => {
      result.current.onOpenSkip();
      result.current.skipDrawer.onActivate();
    });

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "Enable sync", page: seededPages.skipDrawer }),
      expect.anything(),
    );
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onSkip).not.toHaveBeenCalled();
  });

  it("should restore the offer page when the skip drawer is dismissed", () => {
    const { result, onQuit } = renderScreen();

    act(() => result.current.onOpenSkip());
    currentPage = seededPages.skipDrawer;
    previousPage = seededPages.ledgerSync;
    act(() => result.current.skipDrawer.onClose());
    act(() => result.current.skipDrawer.onClose());
    act(() => result.current.onQuit());

    expect(restoreTrackingPages).toHaveBeenCalledTimes(1);
    expect(restoreTrackingPages).toHaveBeenCalledWith(seededPages.ledgerSync, "Page Before");
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "close",
        page: seededPages.ledgerSync,
        source: "Page Before",
      }),
      expect.anything(),
    );
    expect(onQuit).toHaveBeenCalledTimes(1);
  });

  it("should keep the drawer page when skip or enable sync closes it", () => {
    const { result, onSkip, onActivate } = renderScreen();

    act(() => {
      result.current.onOpenSkip();
      result.current.skipDrawer.onSkip();
      result.current.skipDrawer.onClose();
    });

    expect(restoreTrackingPages).not.toHaveBeenCalled();
    expect(onSkip).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.onOpenSkip();
      result.current.skipDrawer.onActivate();
      result.current.skipDrawer.onClose();
    });

    expect(restoreTrackingPages).not.toHaveBeenCalled();
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it("should omit seeded tracking when the offer is not a seeded entry", () => {
    const { result, onQuit } = renderScreen(false);

    expect(result.current.trackingProps).toEqual({});
    act(() => {
      result.current.onQuit();
      result.current.onOpenSkip();
      result.current.skipDrawer.onSkip();
    });

    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(track).not.toHaveBeenCalled();
    expect(trackPage).not.toHaveBeenCalled();
  });

  it("should pass the shared seeded props to the skip drawer", () => {
    const { result } = renderScreen();

    expect(result.current.trackingProps).toEqual(
      expect.objectContaining({
        platform: "lwm",
        sourceFlow: "onboarding",
        seedConfiguration: "already_seeded",
      }),
    );
  });
});

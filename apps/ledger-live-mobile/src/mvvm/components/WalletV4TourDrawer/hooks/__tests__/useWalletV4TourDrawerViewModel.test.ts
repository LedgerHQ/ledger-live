import { act, renderHook } from "@tests/test-renderer";
import { track } from "~/analytics";
import { useWalletV4TourDrawerViewModel } from "../useWalletV4TourDrawerViewModel";

const PAGE = "Q3 Wallet V4 Tour";

describe("useWalletV4TourDrawerViewModel analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should omit variant from swipe and close events when it is not provided", () => {
    const { result } = renderHook(() =>
      useWalletV4TourDrawerViewModel({
        isTourEnabled: true,
        hasSeenTour: false,
        markTourAsSeen: jest.fn(),
        page: PAGE,
      }),
    );

    act(() => {
      result.current.onSlideChange(1);
    });
    act(() => {
      result.current.closeDrawer();
    });

    expect(track).toHaveBeenCalledWith("product_tour_card", { page: PAGE, card: 2 });
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Close",
      page: PAGE,
      card: 2,
    });
  });

  it("should include variant on swipe and close events when it is provided", () => {
    const { result } = renderHook(() =>
      useWalletV4TourDrawerViewModel({
        isTourEnabled: true,
        hasSeenTour: false,
        markTourAsSeen: jest.fn(),
        page: PAGE,
        variant: "q3_b",
      }),
    );

    act(() => {
      result.current.onSlideChange(2);
    });
    act(() => {
      result.current.closeDrawer();
    });

    expect(track).toHaveBeenCalledWith("product_tour_card", {
      page: PAGE,
      card: 3,
      variant: "q3_b",
    });
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Close",
      page: PAGE,
      card: 3,
      variant: "q3_b",
    });
  });

  it("should use carousel analytics instead of product_tour_card when provided", () => {
    const analytics = {
      getContext: jest.fn((_index: number, stepName: string) => ({
        page: PAGE,
        contentId: "q3-tour",
        step: 2,
        stepName,
        totalSteps: 4,
        variant: "q3_a",
      })),
      trackCloseClick: jest.fn(),
      trackContinueClick: jest.fn(),
      trackDismissed: jest.fn(),
      trackCompleted: jest.fn(),
      trackInitialStep: jest.fn(),
      trackStepNavigation: jest.fn(),
    };

    const { result } = renderHook(() =>
      useWalletV4TourDrawerViewModel({
        isTourEnabled: true,
        hasSeenTour: false,
        markTourAsSeen: jest.fn(),
        page: PAGE,
        variant: "q3_a",
        analytics,
        getStepName: () => "Say goodbye to long addresses",
      }),
    );

    act(() => {
      result.current.onSlideChange(1);
    });
    act(() => {
      result.current.onContinueClick?.(0, false);
    });
    act(() => {
      result.current.onHeaderClosePressed?.();
    });

    expect(analytics.trackStepNavigation).toHaveBeenCalled();
    expect(analytics.trackContinueClick).toHaveBeenCalled();
    expect(analytics.trackCloseClick).toHaveBeenCalled();
    expect(track).not.toHaveBeenCalledWith("product_tour_card", expect.anything());
  });

  it("should ignore the initial slide callback and still track a later swipe back to step 1", () => {
    const analytics = {
      getContext: jest.fn((index: number, stepName: string) => ({
        page: PAGE,
        contentId: "q3-tour",
        step: index + 1,
        stepName,
        totalSteps: 4,
      })),
      trackCloseClick: jest.fn(),
      trackContinueClick: jest.fn(),
      trackDismissed: jest.fn(),
      trackCompleted: jest.fn(),
      trackInitialStep: jest.fn(),
      trackStepNavigation: jest.fn(),
    };

    const { result } = renderHook(() =>
      useWalletV4TourDrawerViewModel({
        isTourEnabled: true,
        hasSeenTour: false,
        markTourAsSeen: jest.fn(),
        page: PAGE,
        analytics,
        getStepName: () => "Say goodbye to long addresses",
      }),
    );

    expect(analytics.trackInitialStep).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.onSlideChange(0);
    });
    act(() => {
      result.current.onSlideChange(0);
    });

    expect(analytics.trackStepNavigation).not.toHaveBeenCalled();

    act(() => {
      result.current.onSlideChange(1);
    });
    act(() => {
      result.current.onSlideChange(0);
    });

    expect(analytics.trackStepNavigation).toHaveBeenCalledTimes(2);
    expect(analytics.trackInitialStep).toHaveBeenCalledTimes(1);
  });
});

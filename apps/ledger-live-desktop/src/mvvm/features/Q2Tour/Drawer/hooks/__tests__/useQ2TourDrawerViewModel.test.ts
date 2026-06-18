import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import {
  trackQ2TourCloseClick,
  trackQ2TourCompleted,
  trackQ2TourContinueClick,
  trackQ2TourDismissed,
  trackQ2TourInitialStep,
  trackQ2TourStepNavigation,
} from "../../../analytics/q2TourCarouselAnalytics";
import { Q2_TOUR_LAST_SLIDE_INDEX } from "../../const";
import { useQ2TourDrawerViewModel } from "../useQ2TourDrawerViewModel";

jest.mock("../../../analytics/q2TourCarouselAnalytics", () => ({
  getQ2TourAnalyticsContext: jest.fn((slideIndex: number, stepName: string) => ({
    page: "Q2 Tour",
    contentId: "q2-tour",
    step: slideIndex + 1,
    stepName,
    totalSteps: 5,
  })),
  trackQ2TourCloseClick: jest.fn(),
  trackQ2TourContinueClick: jest.fn(),
  trackQ2TourDismissed: jest.fn(),
  trackQ2TourCompleted: jest.fn(),
  trackQ2TourInitialStep: jest.fn(),
  trackQ2TourStepNavigation: jest.fn(),
}));

const q2TourEnabledOverrides = {
  lwdWallet40: {
    enabled: true,
    params: { q2Tour: true },
  },
};

const getInitialState = (overrides?: {
  hasSeenQ2Tour?: boolean;
  hasCompletedOnboarding?: boolean;
  featureFlagOverrides?: typeof q2TourEnabledOverrides;
}) => ({
  ...withFlagOverrides(overrides?.featureFlagOverrides ?? q2TourEnabledOverrides),
  settings: {
    hasCompletedOnboarding: overrides?.hasCompletedOnboarding ?? true,
    hasSeenQ2Tour: overrides?.hasSeenQ2Tour ?? false,
  },
});

describe("useQ2TourDrawerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("auto-open on Portfolio", () => {
    it("should not auto-open when not on Portfolio page", () => {
      const { result } = renderHook(() => useQ2TourDrawerViewModel({ isOnPortfolioPage: false }), {
        initialState: getInitialState(),
      });

      expect(result.current.isDialogOpen).toBe(false);
      expect(trackQ2TourInitialStep).not.toHaveBeenCalled();
    });

    it("should auto-open when tour is enabled, not seen, and onboarding is complete", () => {
      const { result } = renderHook(() => useQ2TourDrawerViewModel({ isOnPortfolioPage: true }), {
        initialState: getInitialState(),
      });

      expect(result.current.isDialogOpen).toBe(true);
      expect(trackQ2TourInitialStep).toHaveBeenCalledTimes(1);
    });

    it("should not auto-open when tour has already been seen", () => {
      const { result } = renderHook(() => useQ2TourDrawerViewModel({ isOnPortfolioPage: true }), {
        initialState: getInitialState({ hasSeenQ2Tour: true }),
      });

      expect(result.current.isDialogOpen).toBe(false);
    });

    it("should not auto-open when onboarding is incomplete", () => {
      const { result } = renderHook(() => useQ2TourDrawerViewModel({ isOnPortfolioPage: true }), {
        initialState: getInitialState({ hasCompletedOnboarding: false }),
      });

      expect(result.current.isDialogOpen).toBe(false);
    });
  });

  describe("handleOpenDialog", () => {
    it("should open dialog and track initial step when tour is enabled and not seen", () => {
      const { result } = renderHook(() => useQ2TourDrawerViewModel({ isOnPortfolioPage: false }), {
        initialState: getInitialState(),
      });

      act(() => {
        result.current.handleOpenDialog();
      });

      expect(result.current.isDialogOpen).toBe(true);
      expect(trackQ2TourInitialStep).toHaveBeenCalledTimes(1);
    });

    it("should not open when hasSeenTour is true", () => {
      const { result } = renderHook(() => useQ2TourDrawerViewModel({ isOnPortfolioPage: false }), {
        initialState: getInitialState({ hasSeenQ2Tour: true }),
      });

      act(() => {
        result.current.handleOpenDialog();
      });

      expect(result.current.isDialogOpen).toBe(false);
    });

    it("should not open when q2Tour flag is disabled", () => {
      const { result } = renderHook(() => useQ2TourDrawerViewModel({ isOnPortfolioPage: false }), {
        initialState: getInitialState({
          featureFlagOverrides: {
            lwdWallet40: { enabled: true, params: { q2Tour: false } },
          },
        }),
      });

      act(() => {
        result.current.handleOpenDialog();
      });

      expect(result.current.isDialogOpen).toBe(false);
    });
  });

  describe("handleCloseDialog", () => {
    it("should close dialog and persist hasSeen", () => {
      const { result, store } = renderHook(
        () => useQ2TourDrawerViewModel({ isOnPortfolioPage: true }),
        { initialState: getInitialState() },
      );

      expect(result.current.isDialogOpen).toBe(true);

      act(() => {
        result.current.handleCloseDialog();
      });

      expect(result.current.isDialogOpen).toBe(false);
      expect(store.getState().settings.hasSeenQ2Tour).toBe(true);
    });
  });

  describe("closeDrawer", () => {
    it("should track close click and close dialog", () => {
      const { result } = renderHook(() => useQ2TourDrawerViewModel({ isOnPortfolioPage: true }), {
        initialState: getInitialState(),
      });

      act(() => {
        result.current.closeDrawer();
      });

      expect(trackQ2TourCloseClick).toHaveBeenCalledTimes(1);
      expect(result.current.isDialogOpen).toBe(false);
    });

    it("should not track close twice when called repeatedly", () => {
      const { result } = renderHook(() => useQ2TourDrawerViewModel({ isOnPortfolioPage: true }), {
        initialState: getInitialState(),
      });

      act(() => {
        result.current.closeDrawer();
        result.current.closeDrawer();
      });

      expect(trackQ2TourCloseClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("dismissDrawer", () => {
    it("should track drawer dismissed and close dialog", () => {
      const { result } = renderHook(() => useQ2TourDrawerViewModel({ isOnPortfolioPage: true }), {
        initialState: getInitialState(),
      });

      act(() => {
        result.current.dismissDrawer();
      });

      expect(trackQ2TourDismissed).toHaveBeenCalledTimes(1);
      expect(result.current.isDialogOpen).toBe(false);
    });
  });

  describe("onSlideChange", () => {
    it("should track step navigation", () => {
      const { result } = renderHook(() => useQ2TourDrawerViewModel({ isOnPortfolioPage: false }), {
        initialState: getInitialState(),
      });

      act(() => {
        result.current.onSlideChange(2);
      });

      expect(trackQ2TourStepNavigation).toHaveBeenCalledWith(expect.objectContaining({ step: 3 }));
    });
  });

  describe("onContinueClick", () => {
    it("should track continue click on non-last slide", () => {
      const { result } = renderHook(() => useQ2TourDrawerViewModel({ isOnPortfolioPage: false }), {
        initialState: getInitialState(),
      });

      act(() => {
        result.current.onContinueClick(0, false);
      });

      expect(trackQ2TourContinueClick).toHaveBeenCalledTimes(1);
      expect(trackQ2TourCompleted).not.toHaveBeenCalled();
    });

    it("should track tour completed on last slide", () => {
      const { result } = renderHook(() => useQ2TourDrawerViewModel({ isOnPortfolioPage: false }), {
        initialState: getInitialState(),
      });

      act(() => {
        result.current.onContinueClick(Q2_TOUR_LAST_SLIDE_INDEX, true);
      });

      expect(trackQ2TourCompleted).toHaveBeenCalledWith(
        expect.objectContaining({ step: Q2_TOUR_LAST_SLIDE_INDEX + 1 }),
      );
      expect(trackQ2TourContinueClick).not.toHaveBeenCalled();
    });
  });
});

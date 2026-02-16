import { renderHook, act } from "tests/testSetup";
import { useWalletV4TourDrawerViewModel } from "../useWalletV4TourDrawerViewModel";

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

const tourEnabledOverrides = {
  lwdWallet40: {
    enabled: true,
    params: { tour: true },
  },
};

describe("useWalletV4TourDrawerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when not on Portfolio page", () => {
    it("should not auto-open dialog", () => {
      const { result } = renderHook(
        () => useWalletV4TourDrawerViewModel({ isOnPortfolioPage: false }),
        {
          initialState: {
            settings: {
              hasSeenWalletV4Tour: false,
              overriddenFeatureFlags: tourEnabledOverrides,
            },
          },
        },
      );

      expect(result.current.isDialogOpen).toBe(false);
    });
  });

  describe("when on Portfolio page with tour enabled and not seen", () => {
    it("should auto-open dialog", () => {
      const { result } = renderHook(
        () => useWalletV4TourDrawerViewModel({ isOnPortfolioPage: true }),
        {
          initialState: {
            settings: {
              hasSeenWalletV4Tour: false,
              overriddenFeatureFlags: tourEnabledOverrides,
            },
          },
        },
      );

      expect(result.current.isDialogOpen).toBe(true);
    });
  });

  describe("handleOpenDialog", () => {
    it("should open dialog when tour enabled and not seen", () => {
      const { result } = renderHook(
        () => useWalletV4TourDrawerViewModel({ isOnPortfolioPage: false }),
        {
          initialState: {
            settings: {
              hasSeenWalletV4Tour: false,
              overriddenFeatureFlags: tourEnabledOverrides,
            },
          },
        },
      );

      expect(result.current.isDialogOpen).toBe(false);

      act(() => {
        result.current.handleOpenDialog();
      });

      expect(result.current.isDialogOpen).toBe(true);
    });

    it("should not open when hasSeenTour is true", () => {
      const { result } = renderHook(
        () => useWalletV4TourDrawerViewModel({ isOnPortfolioPage: false }),
        {
          initialState: {
            settings: {
              hasSeenWalletV4Tour: true,
              overriddenFeatureFlags: tourEnabledOverrides,
            },
          },
        },
      );

      act(() => {
        result.current.handleOpenDialog();
      });

      expect(result.current.isDialogOpen).toBe(false);
    });

    it("should not open when tour is disabled", () => {
      const { result } = renderHook(
        () => useWalletV4TourDrawerViewModel({ isOnPortfolioPage: false }),
        {
          initialState: {
            settings: {
              hasSeenWalletV4Tour: false,
              overriddenFeatureFlags: {
                lwdWallet40: { enabled: true, params: { tour: false } },
              },
            },
          },
        },
      );

      act(() => {
        result.current.handleOpenDialog();
      });

      expect(result.current.isDialogOpen).toBe(false);
    });
  });

  describe("handleCloseDialog", () => {
    it("should close dialog and dispatch setHasSeenWalletV4Tour", () => {
      const { result, store } = renderHook(
        () => useWalletV4TourDrawerViewModel({ isOnPortfolioPage: true }),
        {
          initialState: {
            settings: {
              hasSeenWalletV4Tour: false,
              overriddenFeatureFlags: tourEnabledOverrides,
            },
          },
        },
      );

      expect(result.current.isDialogOpen).toBe(true);

      act(() => {
        result.current.handleCloseDialog();
      });

      expect(result.current.isDialogOpen).toBe(false);
      expect(store.getState().settings.hasSeenWalletV4Tour).toBe(true);
    });
  });
});

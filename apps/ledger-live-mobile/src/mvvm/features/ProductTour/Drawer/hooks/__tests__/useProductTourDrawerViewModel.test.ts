import { act, renderHook } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { NavigatorName, ScreenName } from "~/const/navigation";
import { track } from "~/analytics";
import { useProductTourDrawerViewModel } from "../useProductTourDrawerViewModel";
import { PAGE_TRACKING_PRODUCT_TOUR, PRODUCT_TOUR_LAST_SLIDE_INDEX } from "../../const";
import { productTourCompletedSelector } from "~/reducers/settings";
import { setProductTourCompleted } from "~/actions/settings";
import { setOverride } from "@shared/feature-flags";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const withFeatureEnabled = (state: State): State => ({
  ...state,
  featureFlags: {
    ...state.featureFlags,
    overrides: { lwmProductTour: { enabled: true } },
  },
});

const withProductTourCompleted = (state: State): State => ({
  ...state,
  settings: { ...state.settings, productTourCompleted: true },
});

describe("useProductTourDrawerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initial drawer state", () => {
    it("should keep drawer closed on mount even when feature is enabled and tour is not completed", () => {
      const { result } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      expect(result.current.isDrawerOpen).toBe(false);
    });

    it("should keep drawer closed when feature flag is disabled", () => {
      const { result } = renderHook(() => useProductTourDrawerViewModel());

      expect(result.current.isDrawerOpen).toBe(false);
    });

    it("should keep drawer closed when product tour is already completed", () => {
      const { result } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: (state: State) => withFeatureEnabled(withProductTourCompleted(state)),
      });

      expect(result.current.isDrawerOpen).toBe(false);
    });
  });

  describe("openProductTour", () => {
    it("should open drawer when feature is enabled and tour is not completed", () => {
      const { result } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      act(() => result.current.closeProductTour());
      expect(result.current.isDrawerOpen).toBe(false);

      act(() => result.current.openProductTour());
      expect(result.current.isDrawerOpen).toBe(true);
    });

    it("should not open drawer when feature flag is disabled", () => {
      const { result } = renderHook(() => useProductTourDrawerViewModel());

      act(() => result.current.openProductTour());

      expect(result.current.isDrawerOpen).toBe(false);
    });

    it("should not open drawer when product tour is already completed", () => {
      const { result } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: (state: State) => withFeatureEnabled(withProductTourCompleted(state)),
      });

      act(() => result.current.openProductTour());

      expect(result.current.isDrawerOpen).toBe(false);
    });
  });

  describe("closeProductTour", () => {
    it("should close the drawer and track modal_dismissed when dismissed via swipe or backdrop", () => {
      const { result } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      act(() => result.current.openProductTour());
      act(() => result.current.closeProductTour());

      expect(result.current.isDrawerOpen).toBe(false);
      expect(track).toHaveBeenCalledWith("modal_dismissed", {
        page: PAGE_TRACKING_PRODUCT_TOUR,
        card: 1,
      });
    });

    it("should not track modal_dismissed when invoked after the close button was pressed", () => {
      const { result } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      act(() => result.current.openProductTour());
      act(() => result.current.onCloseButtonPress());
      act(() => result.current.closeProductTour());

      expect(track).not.toHaveBeenCalledWith(
        "modal_dismissed",
        expect.objectContaining({ page: PAGE_TRACKING_PRODUCT_TOUR }),
      );
    });

    it("should track modal_dismissed again on a subsequent dismiss after a close button press", () => {
      const { result } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      act(() => result.current.openProductTour());
      act(() => result.current.onCloseButtonPress());
      act(() => result.current.closeProductTour());
      act(() => result.current.closeProductTour());

      expect(track).toHaveBeenCalledWith("modal_dismissed", {
        page: PAGE_TRACKING_PRODUCT_TOUR,
        card: 1,
      });
    });

    it("should not track modal_dismissed when invoked after a CTA action", () => {
      const { result } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      act(() => result.current.openProductTour());
      act(() => result.current.onPrimaryAction("stake"));
      act(() => result.current.closeProductTour());

      expect(track).not.toHaveBeenCalledWith(
        "modal_dismissed",
        expect.objectContaining({ page: PAGE_TRACKING_PRODUCT_TOUR }),
      );
    });

    it("should not track modal_dismissed when invoked after completeProductTour", () => {
      const { result } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      act(() => result.current.openProductTour());
      act(() => result.current.completeProductTour());
      act(() => result.current.closeProductTour());

      expect(track).not.toHaveBeenCalledWith(
        "modal_dismissed",
        expect.objectContaining({ page: PAGE_TRACKING_PRODUCT_TOUR }),
      );
    });

    it("should keep drawer open when productTourCompleted is set without an explicit dismiss", () => {
      const { result, store } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      act(() => result.current.openProductTour());
      act(() => {
        store.dispatch(setProductTourCompleted(true));
      });

      expect(result.current.isDrawerOpen).toBe(true);
      expect(productTourCompletedSelector(store.getState())).toBe(true);
    });
  });

  describe("onCloseButtonPress", () => {
    it("should close the drawer and track button_clicked with Close button", () => {
      const { result } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      act(() => result.current.openProductTour());
      act(() => result.current.onSlideChange(2));
      act(() => result.current.onCloseButtonPress());

      expect(result.current.isDrawerOpen).toBe(false);
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Close",
        page: PAGE_TRACKING_PRODUCT_TOUR,
        card: 3,
      });
    });
  });

  describe("onSlideChange", () => {
    it("should track card number as index + 1", () => {
      const { result } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      act(() => result.current.onSlideChange(3));

      expect(track).toHaveBeenCalledWith("product_tour_card", {
        page: PAGE_TRACKING_PRODUCT_TOUR,
        card: 4,
      });
    });

    it("should mark tour completed but keep drawer open when reaching the last slide", () => {
      const { result, store } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      act(() => result.current.openProductTour());
      expect(result.current.isDrawerOpen).toBe(true);
      expect(productTourCompletedSelector(store.getState())).toBe(false);

      act(() => result.current.onSlideChange(PRODUCT_TOUR_LAST_SLIDE_INDEX));

      expect(productTourCompletedSelector(store.getState())).toBe(true);
      expect(result.current.isDrawerOpen).toBe(true);
    });
  });

  describe("onPrimaryAction", () => {
    it('should navigate to Earn via Main navigator and close drawer for "stake" action', () => {
      const { result } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      act(() => result.current.onPrimaryAction("stake"));

      expect(result.current.isDrawerOpen).toBe(false);
      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Main, {
        screen: NavigatorName.Earn,
      });
    });

    it('should navigate to the correct navigator and close drawer for "card" action', () => {
      const { result } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      act(() => result.current.onPrimaryAction("card"));

      expect(result.current.isDrawerOpen).toBe(false);
      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Card);
    });

    it('should navigate to Swap via Main navigator for "swap" action', () => {
      const { result } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      act(() => result.current.onPrimaryAction("swap"));

      expect(result.current.isDrawerOpen).toBe(false);
      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Main, {
        screen: NavigatorName.Swap,
        params: {
          screen: ScreenName.SwapTab,
          params: {},
        },
      });
    });

    it('should navigate to Portfolio via Main navigator and close drawer for "portfolio" action', () => {
      const { result } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      act(() => result.current.onPrimaryAction("portfolio"));

      expect(result.current.isDrawerOpen).toBe(false);
      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Main, {
        screen: NavigatorName.Portfolio,
        params: { screen: NavigatorName.WalletTab },
      });
    });
  });

  describe("feature flag changes while drawer is open", () => {
    it("should close the drawer when the product tour feature is disabled", () => {
      const { result, store, rerender } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      act(() => result.current.openProductTour());
      expect(result.current.isDrawerOpen).toBe(true);

      act(() => {
        store.dispatch(setOverride({ key: "lwmProductTour", value: { enabled: false } }));
      });
      rerender({});

      expect(result.current.isDrawerOpen).toBe(false);
    });
  });

  describe("completeProductTour", () => {
    it("should dispatch setProductTourCompleted(true) and close drawer", () => {
      const { result, store } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      act(() => result.current.openProductTour());
      act(() => result.current.completeProductTour());

      expect(result.current.isDrawerOpen).toBe(false);
      expect(productTourCompletedSelector(store.getState())).toBe(true);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("productTourCompleted while drawer is open", () => {
    it("should keep the drawer open when productTourCompleted becomes true externally", () => {
      const { result, store } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      act(() => result.current.openProductTour());
      expect(result.current.isDrawerOpen).toBe(true);

      act(() => {
        store.dispatch(setProductTourCompleted(true));
      });

      expect(result.current.isDrawerOpen).toBe(true);
    });
  });

  it("should have productTourCompleted as false by default in the store", () => {
    const { store } = renderHook(() => useProductTourDrawerViewModel());

    expect(productTourCompletedSelector(store.getState())).toBe(false);
  });
});

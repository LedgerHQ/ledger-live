import { act, renderHook } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { NavigatorName } from "~/const/navigation";
import { track } from "~/analytics";
import { useProductTourDrawerViewModel } from "../useProductTourDrawerViewModel";
import { PAGE_TRACKING_PRODUCT_TOUR } from "../../const";
import { productTourCompletedSelector } from "~/reducers/settings";
import { setProductTourCompleted } from "~/actions/settings";
import * as featureFlagsModule from "@ledgerhq/live-common/featureFlags/index";
import type { WalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/types";

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

const mockUseWalletFeaturesConfig = jest.spyOn(featureFlagsModule, "useWalletFeaturesConfig");

describe("useProductTourDrawerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWalletFeaturesConfig.mockReturnValue({
      shouldDisplayWallet40MainNav: true,
    } as WalletFeaturesConfig);
  });

  describe("initial drawer state", () => {
    it("should open drawer when feature is enabled and tour is not completed", () => {
      const { result } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      expect(result.current.isDrawerOpen).toBe(true);
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
    it("should close the drawer and track button_clicked event", () => {
      const { result } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      act(() => result.current.closeProductTour());

      expect(result.current.isDrawerOpen).toBe(false);
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Close",
        page: PAGE_TRACKING_PRODUCT_TOUR,
        card: 1,
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
  });

  describe("onPrimaryAction", () => {
    it.each([
      ["stake", NavigatorName.Earn],
      ["card", NavigatorName.Card],
    ] as const)(
      'should navigate to the correct navigator and close drawer for "%s" action',
      (action, navigator) => {
        const { result } = renderHook(() => useProductTourDrawerViewModel(), {
          overrideInitialState: withFeatureEnabled,
        });

        act(() => result.current.onPrimaryAction(action));

        expect(result.current.isDrawerOpen).toBe(false);
        expect(mockNavigate).toHaveBeenCalledWith(navigator);
      },
    );

    it('should navigate to Swap via Main navigator when Wallet40 main nav is enabled for "swap" action', () => {
      mockUseWalletFeaturesConfig.mockReturnValue({
        shouldDisplayWallet40MainNav: true,
      } as WalletFeaturesConfig);
      const { result } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      act(() => result.current.onPrimaryAction("swap"));

      expect(result.current.isDrawerOpen).toBe(false);
      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Main, {
        screen: NavigatorName.Swap,
      });
    });

    it('should navigate directly to Swap when Wallet40 main nav is disabled for "swap" action', () => {
      mockUseWalletFeaturesConfig.mockReturnValue({
        shouldDisplayWallet40MainNav: false,
      } as WalletFeaturesConfig);
      const { result } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      act(() => result.current.onPrimaryAction("swap"));

      expect(result.current.isDrawerOpen).toBe(false);
      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Swap);
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

    it('should dispatch setProductTourCompleted(true) and close drawer for "done" action', () => {
      const { result, store } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      act(() => result.current.onPrimaryAction("done"));

      expect(result.current.isDrawerOpen).toBe(false);
      expect(productTourCompletedSelector(store.getState())).toBe(true);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("useEffect auto-close", () => {
    it("should close the drawer when productTourCompleted becomes true externally", () => {
      const { result, store } = renderHook(() => useProductTourDrawerViewModel(), {
        overrideInitialState: withFeatureEnabled,
      });

      expect(result.current.isDrawerOpen).toBe(true);

      act(() => {
        store.dispatch(setProductTourCompleted(true));
      });

      expect(result.current.isDrawerOpen).toBe(false);
    });
  });

  it("should have productTourCompleted as false by default in the store", () => {
    const { store } = renderHook(() => useProductTourDrawerViewModel());

    expect(productTourCompletedSelector(store.getState())).toBe(false);
  });
});

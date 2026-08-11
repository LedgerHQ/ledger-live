import { Linking } from "react-native";
import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { screen, track } from "~/analytics";
import { LAZY_ONBOARDING_TOUR_PAGE, LAZY_ONBOARDING_TOUR_SHOP_PAGE } from "../const";
import {
  __resetLazyOnboardingTourControllerForTests,
  lazyOnboardingTourController,
} from "../lazyOnboardingTourController";
import { useLazyOnboardingTourDrawerViewModel } from "../useLazyOnboardingTourDrawerViewModel";

jest.mock("~/analytics", () => ({
  ...jest.requireActual("~/analytics"),
  track: jest.fn(),
  screen: jest.fn(),
}));

const SHOP_LINK = "https://shop.ledger.com/?product=flex";

function renderTourViewModel(enabled = true) {
  return renderHook(() => useLazyOnboardingTourDrawerViewModel(), {
    overrideInitialState: withFlagOverrides({
      lazyOnboardingBanner: {
        enabled,
        params: { mode: "feature_intro", link: SHOP_LINK },
      },
    }),
  });
}

describe("useLazyOnboardingTourDrawerViewModel dismiss analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetLazyOnboardingTourControllerForTests();
  });

  it("should track modal_dismissed with stable keys on swipe/backdrop dismiss", () => {
    const { result } = renderTourViewModel();

    act(() => {
      lazyOnboardingTourController.open();
    });
    expect(result.current?.isOpen).toBe(true);

    act(() => {
      result.current?.onClose();
    });

    expect(track).toHaveBeenCalledWith(
      "modal_dismissed",
      expect.objectContaining({
        page: LAZY_ONBOARDING_TOUR_PAGE,
        card: 1,
        source: "lazy onboarding",
        mode: "feature_intro",
        platform: "llm",
      }),
    );
    expect(result.current?.isOpen).toBe(false);
  });

  it("should track button close and not modal_dismissed when the X is pressed", () => {
    const { result } = renderTourViewModel();

    act(() => {
      lazyOnboardingTourController.open();
    });

    act(() => {
      result.current?.onCloseButtonPress();
    });

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "Close",
        page: LAZY_ONBOARDING_TOUR_PAGE,
        card: 1,
      }),
    );

    act(() => {
      result.current?.onClose();
    });

    expect(track).not.toHaveBeenCalledWith("modal_dismissed", expect.anything());
  });

  it("should not track modal_dismissed when Done closes the tour", () => {
    const { result } = renderTourViewModel();

    act(() => {
      lazyOnboardingTourController.open();
    });

    act(() => {
      result.current?.onDone();
    });

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "Done",
        page: LAZY_ONBOARDING_TOUR_PAGE,
      }),
    );

    act(() => {
      result.current?.onClose();
    });

    expect(track).not.toHaveBeenCalledWith("modal_dismissed", expect.anything());
  });

  it("should track continue, slide change, and buy with shop screen", () => {
    const { result } = renderTourViewModel();

    act(() => {
      lazyOnboardingTourController.open();
    });

    expect(screen).toHaveBeenCalledWith(
      LAZY_ONBOARDING_TOUR_PAGE,
      undefined,
      expect.objectContaining({ name: "lazy onboarding tour", card: 1 }),
    );

    act(() => {
      result.current?.onContinue(0);
      result.current?.onSlideChange(1);
      result.current?.onBuy(1);
    });

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "Continue", card: 1 }),
    );
    expect(track).toHaveBeenCalledWith(
      "product_tour_card",
      expect.objectContaining({ page: LAZY_ONBOARDING_TOUR_PAGE, card: 2 }),
    );
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "Buy a Ledger device", card: 2 }),
    );
    expect(Linking.openURL).toHaveBeenCalled();
    expect(screen).toHaveBeenCalledWith(
      LAZY_ONBOARDING_TOUR_SHOP_PAGE,
      undefined,
      expect.objectContaining({ name: "shop", source: "lazy onboarding tour" }),
    );
  });

  it("should return null when the feature is disabled", () => {
    const { result } = renderTourViewModel(false);
    expect(result.current).toBeNull();
  });
});

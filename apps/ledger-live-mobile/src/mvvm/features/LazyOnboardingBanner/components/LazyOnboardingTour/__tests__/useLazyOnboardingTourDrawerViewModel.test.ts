import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { track } from "~/analytics";
import { LAZY_ONBOARDING_TOUR_PAGE } from "../const";
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

function renderTourViewModel() {
  return renderHook(() => useLazyOnboardingTourDrawerViewModel(), {
    overrideInitialState: withFlagOverrides({
      lazyOnboardingBanner: {
        enabled: true,
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
        step: 0,
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
        button: "close",
        page: LAZY_ONBOARDING_TOUR_PAGE,
        step: 0,
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
        button: "done",
        page: LAZY_ONBOARDING_TOUR_PAGE,
      }),
    );

    act(() => {
      result.current?.onClose();
    });

    expect(track).not.toHaveBeenCalledWith("modal_dismissed", expect.anything());
  });
});

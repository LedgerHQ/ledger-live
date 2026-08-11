import React from "react";
import { Linking } from "react-native";
import { resetLazyOnboardingBannerSession } from "@features/flow-lazy-onboarding-banner/testing";
import { DeviceModelId } from "@ledgerhq/devices";
import { fireEvent, render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { track } from "~/analytics";
import type { State } from "~/reducers/types";
import {
  __resetLazyOnboardingTourControllerForTests,
  LazyOnboardingTourPortfolioMount,
} from "../index";
import { LazyOnboardingBanner } from "../components/LazyOnboardingBanner";
import { LAZY_ONBOARDING_TOUR_PAGE } from "../components/LazyOnboardingTour/const";

type RenderOptions = Readonly<{
  enabled?: boolean;
  mode?: "shop_direct" | "feature_intro";
  stateTransform?: (state: State) => State;
  withTourMount?: boolean;
}>;

const SHOP_LINK = "https://shop.ledger.com/?product=flex";

const SLIDE_TITLES = [
  "Is your crypto safe?",
  "Take back control",
  "You approve every move",
  "Self-custody starts here",
] as const;

function withEligibleLazyOnboardingState(state: State): State {
  return {
    ...state,
    settings: {
      ...state.settings,
      hasCompletedOnboarding: true,
      readOnlyModeEnabled: true,
      onboardingHasDevice: false,
      isReborn: true,
      seenDevices: [],
      lastConnectedDevice: null,
    },
  };
}

function renderBanner({
  enabled = true,
  mode = "shop_direct",
  stateTransform,
  withTourMount = false,
}: RenderOptions = {}) {
  return render(
    <>
      <LazyOnboardingBanner />
      {withTourMount ? <LazyOnboardingTourPortfolioMount /> : null}
    </>,
    {
      overrideInitialState: withFlagOverrides(
        {
          lazyOnboardingBanner: {
            enabled,
            params: { mode, link: SHOP_LINK },
          },
        },
        state =>
          stateTransform?.(withEligibleLazyOnboardingState(state)) ??
          withEligibleLazyOnboardingState(state),
      ),
    },
  );
}

function resizeTourSlidesContainer() {
  const slidesContainer = screen.getByTestId("lazy-onboarding-tour-slides-container");
  fireEvent(slidesContainer, "layout", {
    nativeEvent: { layout: { width: 375, height: 800 } },
  });
}

async function openTourFromBanner(user: Awaited<ReturnType<typeof renderBanner>>["user"]) {
  await user.press(screen.getByTestId("lazy-onboarding-banner"));
  await waitFor(() => {
    expect(screen.getByTestId("lazy-onboarding-tour-slides-container")).toBeTruthy();
  });
  resizeTourSlidesContainer();
  expect(await screen.findByText(SLIDE_TITLES[0])).toBeVisible();
}

describe("LazyOnboardingBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetLazyOnboardingBannerSession();
    __resetLazyOnboardingTourControllerForTests();
  });

  it("should open the shop with attribution in shop_direct mode", async () => {
    const { user } = renderBanner({ mode: "shop_direct" });

    expect(screen.getByText("Why millions choose Ledger?")).toBeVisible();
    expect(screen.getByText("To have peace of mind every time they transact.")).toBeVisible();

    await user.press(screen.getByTestId("lazy-onboarding-banner"));

    expect(Linking.openURL).toHaveBeenCalledTimes(1);
    const openedUrl = new URL(jest.mocked(Linking.openURL).mock.calls[0][0]);
    expect(openedUrl.searchParams.get("product")).toBe("flex");
    expect(openedUrl.searchParams.get("utm_source")).toBe("ledger_wallet_mobile");
    expect(openedUrl.searchParams.get("utm_medium")).toBe("ledger_live");
    expect(openedUrl.searchParams.get("utm_campaign")).toBe("upsell_large_screen");
    expect(openedUrl.searchParams.get("utm_content")).toBe("lazy_onboarding_banner");
  });

  it("should open the tour instead of the shop in feature_intro mode", async () => {
    const { user } = renderBanner({ mode: "feature_intro", withTourMount: true });
    await openTourFromBanner(user);
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it("should remain hidden for the rest of the session after it is closed", async () => {
    const firstRender = renderBanner();

    await firstRender.user.press(screen.getByTestId("media-banner-close-button"));
    expect(screen.queryByText("Why millions choose Ledger?")).toBeNull();

    firstRender.unmount();
    renderBanner();

    expect(screen.queryByText("Why millions choose Ledger?")).toBeNull();
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it("should not render when the feature is disabled", () => {
    renderBanner({ enabled: false });

    expect(screen.queryByText("Why millions choose Ledger?")).toBeNull();
  });

  it("should stop rendering after a device has been connected", () => {
    renderBanner({
      stateTransform: state => ({
        ...state,
        settings: {
          ...state.settings,
          lastConnectedDevice: {
            deviceId: "device-id",
            deviceName: "Ledger Flex",
            modelId: DeviceModelId.europa,
            wired: false,
          },
        },
      }),
    });

    expect(screen.queryByText("Why millions choose Ledger?")).toBeNull();
  });

  it("should stay hidden when a previously connected model is no longer recognized", () => {
    renderBanner({
      stateTransform: state => ({
        ...state,
        settings: {
          ...state.settings,
          lastConnectedDevice: {
            deviceId: "device-id",
            deviceName: "Legacy Ledger",
            modelId: "legacy-model" as DeviceModelId,
            wired: false,
          },
        },
      }),
    });

    expect(screen.queryByText("Why millions choose Ledger?")).toBeNull();
  });
});

describe("LazyOnboardingTour", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetLazyOnboardingBannerSession();
    __resetLazyOnboardingTourControllerForTests();
  });

  it("should open the shop from Buy on the first slide", async () => {
    const { user } = renderBanner({ mode: "feature_intro", withTourMount: true });
    await openTourFromBanner(user);

    await user.press(screen.getByTestId("lazy-onboarding-tour-secondary-button"));

    expect(Linking.openURL).toHaveBeenCalledTimes(1);
    const openedUrl = new URL(jest.mocked(Linking.openURL).mock.calls[0][0]);
    expect(openedUrl.searchParams.get("utm_content")).toBe("lazy_onboarding_banner");
    expect(screen.getByText(SLIDE_TITLES[0])).toBeVisible();
  });

  it("should dismiss the tour when the close button is pressed", async () => {
    const { user } = renderBanner({ mode: "feature_intro", withTourMount: true });
    await openTourFromBanner(user);

    await user.press(screen.getByTestId("lazy-onboarding-tour-close-button"));
    expect(screen.queryByText(SLIDE_TITLES[0])).toBeNull();
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "close",
        page: LAZY_ONBOARDING_TOUR_PAGE,
      }),
    );
    expect(track).not.toHaveBeenCalledWith("modal_dismissed", expect.anything());
  });

  it("should track continue when the primary button is pressed", async () => {
    const { user } = renderBanner({ mode: "feature_intro", withTourMount: true });
    await openTourFromBanner(user);

    await user.press(screen.getByTestId("lazy-onboarding-tour-primary-button"));

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "continue",
        page: LAZY_ONBOARDING_TOUR_PAGE,
        step: 0,
        mode: "feature_intro",
      }),
    );
  });
});

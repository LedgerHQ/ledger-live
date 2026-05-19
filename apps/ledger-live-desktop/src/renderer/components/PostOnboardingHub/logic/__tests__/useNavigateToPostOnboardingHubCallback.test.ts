/**
 * @jest-environment jsdom
 */
import React from "react";
import { PostOnboardingProvider } from "@ledgerhq/live-common/postOnboarding/PostOnboardingProvider";
import { DEFAULT_FEATURES } from "@ledgerhq/live-common/featureFlags/defaultFeatures";
import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { useNavigateToPostOnboardingHubCallback } from "../useNavigateToPostOnboardingHubCallback";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

const PROTECT_ID = "protect-prod";
const RECOVER_UPSELL_URI = "ledgerlive://recover/protect-prod?redirectTo=upsell&source=lld-onboarding-24";
const RECOVER_LANDING_PATH = `/recover/${PROTECT_ID}?redirectTo=upsell&source=lld-post-onboarding-banner`;

const protectDesktopDefaultParams = DEFAULT_FEATURES.protectServicesDesktop.params!;

function featureFlagsWithRecover() {
  return withFlagOverrides({
    lwdWallet40: {
      enabled: true,
      params: { finishOnboardingWidget: true },
    },
    protectServicesDesktop: {
      enabled: true,
      params: {
        ...protectDesktopDefaultParams,
        protectId: PROTECT_ID,
        availableOnDesktop: true,
        compatibleDevices: [{ name: DeviceModelId.nanoX, available: true, comingSoon: false }],
        onboardingCompleted: {
          ...protectDesktopDefaultParams.onboardingCompleted,
          upsellURI: RECOVER_UPSELL_URI,
        },
      },
    },
  });
}

function featureFlagsWithWallet40WithoutRecover() {
  return withFlagOverrides({
    lwdWallet40: {
      enabled: true,
      params: { finishOnboardingWidget: true },
    },
    protectServicesDesktop: { enabled: false },
  });
}

function postOnboardingState(deviceModelId = DeviceModelId.nanoX) {
  return {
    deviceModelId,
    walletEntryPointDismissed: false,
    entryPointFirstDisplayedDate: null,
    walletEntryPointEligibleForPortfolio: null,
    actionsToComplete: [PostOnboardingActionId.syncAccounts],
    actionsCompleted: { [PostOnboardingActionId.syncAccounts]: false },
    lastActionCompleted: null,
    postOnboardingInProgress: true,
  };
}

type NavigateHookInitialState = NonNullable<
  Parameters<typeof renderHook>[1]
>["initialState"];

function renderNavigateHook(initialState: NavigateHookInitialState = {}) {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      PostOnboardingProvider,
      {
        navigateToPostOnboardingHub: jest.fn(),
        getPostOnboardingActionsForDevice: () => [],
        getPostOnboardingAction: () => undefined,
      },
      children,
    );

  return renderHook(() => useNavigateToPostOnboardingHubCallback(), {
    wrapper: Wrapper,
    initialState,
  });
}

describe("useNavigateToPostOnboardingHubCallback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should navigate to recover landing and open finish dialog when Wallet40 and recover apply", () => {
    const { result, store } = renderNavigateHook({
      ...featureFlagsWithRecover(),
      postOnboarding: postOnboardingState(),
      settings: { hasBeenRedirectedToPostOnboarding: false },
    });

    act(() => {
      result.current();
    });

    expect(mockNavigate).toHaveBeenCalledWith(RECOVER_LANDING_PATH, { replace: true });
    expect(store.getState().dialogs.FINISH_POST_ONBOARDING).toBe(true);
    expect(mockNavigate).not.toHaveBeenCalledWith("/");
    expect(mockNavigate).not.toHaveBeenCalledWith("/post-onboarding");
  });

  it("should navigate to portfolio and open finish dialog when Wallet40 is enabled without recover", () => {
    const { result, store } = renderNavigateHook({
      ...featureFlagsWithWallet40WithoutRecover(),
      postOnboarding: postOnboardingState(),
      settings: { hasBeenRedirectedToPostOnboarding: false },
    });

    act(() => {
      result.current();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    expect(store.getState().dialogs.FINISH_POST_ONBOARDING).toBe(true);
    expect(mockNavigate).not.toHaveBeenCalledWith(RECOVER_LANDING_PATH);
  });

  it("should not reopen finish dialog when already redirected with Wallet40 enabled", () => {
    const { result, store } = renderNavigateHook({
      ...featureFlagsWithRecover(),
      postOnboarding: postOnboardingState(),
      settings: { hasBeenRedirectedToPostOnboarding: true },
      dialogs: { FINISH_POST_ONBOARDING: false },
    });

    act(() => {
      result.current();
    });

    expect(mockNavigate).toHaveBeenCalledWith(RECOVER_LANDING_PATH, { replace: true });
    expect(store.getState().dialogs.FINISH_POST_ONBOARDING).toBe(false);
  });

  it("should use resetNavigationStack for recover landing navigation", () => {
    const { result } = renderNavigateHook({
      ...featureFlagsWithRecover(),
      postOnboarding: postOnboardingState(),
      settings: { hasBeenRedirectedToPostOnboarding: false },
    });

    act(() => {
      result.current(false);
    });

    expect(mockNavigate).toHaveBeenCalledWith(RECOVER_LANDING_PATH, { replace: false });
  });

  it("should navigate to post-onboarding hub when finish widget is disabled", () => {
    const { result, store } = renderNavigateHook({
      ...withFlagOverrides({
        lwdWallet40: { enabled: false },
        protectServicesDesktop: { enabled: true },
      }),
      postOnboarding: postOnboardingState(),
    });

    act(() => {
      result.current();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/post-onboarding", { replace: false });
    expect(store.getState().dialogs.FINISH_POST_ONBOARDING).not.toBe(true);
  });

  it("should replace history when navigating to post-onboarding hub with resetNavigationStack", () => {
    const { result } = renderNavigateHook({
      ...withFlagOverrides({ lwdWallet40: { enabled: false } }),
      postOnboarding: postOnboardingState(),
    });

    act(() => {
      result.current(true);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/post-onboarding", { replace: true });
    expect(mockNavigate).not.toHaveBeenCalledWith("/");
  });
});

import { useCallback, useLayoutEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { lastOnboardedDeviceSelector } from "~/renderer/reducers/settings";
import { useShouldRedirect } from "./useShouldRedirect";
import { useOpenRecoverCallback } from "./useOpenRecoverCallback";
import { useOpenPostOnboardingCallback } from "./useOpenPostOnboardingCallback";
import { useHistory } from "react-router";

/**
 * Navigates to the post onboarding or to the Ledger Recover upsell if needed
 * */
export function useRedirectToPostOnboardingCallback() {
  const history = useHistory();
  const lastOnboardedDevice = useSelector(lastOnboardedDeviceSelector);

  const { shouldRedirectToRecoverUpsell, shouldRedirectToPostOnboarding } = useShouldRedirect();

  const openRecoverUpsell = useOpenRecoverCallback();
  const openPostOnboarding = useOpenPostOnboardingCallback();

  const fallbackRedirection = useCallback(() => {
    if (history.location.pathname !== "/") {
      history.push("/");
    }
  }, [history]);

  return useCallback(
    (onDone: () => void = () => {}) => {
      if (shouldRedirectToRecoverUpsell) {
        openRecoverUpsell({ fallbackRedirection });
        onDone();
      } else if (shouldRedirectToPostOnboarding && lastOnboardedDevice) {
        openPostOnboarding({ deviceModelId: lastOnboardedDevice.modelId, fallbackRedirection });
        onDone();
      }
    },
    [
      fallbackRedirection,
      lastOnboardedDevice,
      openPostOnboarding,
      openRecoverUpsell,
      shouldRedirectToPostOnboarding,
      shouldRedirectToRecoverUpsell,
    ],
  );
}

export function useAutoRedirectToPostOnboarding() {
  const redirectToPostOnboarding = useRedirectToPostOnboardingCallback();
  const redirectionDone = useRef(false);
  useLayoutEffect(() => {
    if (!redirectionDone.current) {
      redirectToPostOnboarding(() => {
        redirectionDone.current = true;
      });
    }
  }, [redirectToPostOnboarding]);
}

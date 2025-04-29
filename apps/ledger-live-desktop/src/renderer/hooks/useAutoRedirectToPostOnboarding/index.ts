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
// TODO: Rename and refactor this function and use algebraic data types like Result
// to avoid the need of a fallback redirection and to make the function more readable
// and maintainable. (see neverthrow library for example)
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
        return true;
      }
      if (shouldRedirectToPostOnboarding && lastOnboardedDevice) {
        openPostOnboarding({ deviceModelId: lastOnboardedDevice.modelId, fallbackRedirection });
        onDone();
        return true;
      }
      return false;
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

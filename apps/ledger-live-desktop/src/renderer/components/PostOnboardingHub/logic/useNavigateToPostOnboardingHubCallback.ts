import { useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { useNavigate } from "react-router";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { hasBeenRedirectedToPostOnboardingSelector } from "~/renderer/reducers/settings";
import useFinishOnboardingDialog from "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/useFinishOnboardingDialog";

export function useNavigateToPostOnboardingHubCallback() {
  const navigate = useNavigate();
  const hasBeenRedirectedToPostOnboarding = useSelector(hasBeenRedirectedToPostOnboardingSelector);
  const { shouldDisplayFinishOnboardingWidget = false } = useWalletFeaturesConfig("desktop");
  const { handleOpen: openFinishOnboardingDialog } = useFinishOnboardingDialog();

  return useCallback(
    (resetNavigationStack?: boolean) => {
      if (shouldDisplayFinishOnboardingWidget) {
        navigate("/", { replace: true });
        if (!hasBeenRedirectedToPostOnboarding) {
          openFinishOnboardingDialog();
        }
        return;
      }
      navigate("/post-onboarding", { replace: !!resetNavigationStack });
    },
    [
      hasBeenRedirectedToPostOnboarding,
      navigate,
      openFinishOnboardingDialog,
      shouldDisplayFinishOnboardingWidget,
    ],
  );
}

import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import useFinishOnboardingDialog from "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/useFinishOnboardingDialog";

export function useNavigateToPostOnboardingHubCallback() {
  const navigate = useNavigate();
  const { shouldDisplayFinishOnboardingWidget = false } = useWalletFeaturesConfig("desktop");
  const { handleOpen: openFinishOnboardingDialog } = useFinishOnboardingDialog();

  return useCallback(
    (_resetNavigationStack?: boolean) => {
      if (shouldDisplayFinishOnboardingWidget) {
        navigate("/", { replace: true });
        openFinishOnboardingDialog();
        return;
      } else {
        navigate("/post-onboarding");
      }
    },
    [navigate, openFinishOnboardingDialog, shouldDisplayFinishOnboardingWidget],
  );
}

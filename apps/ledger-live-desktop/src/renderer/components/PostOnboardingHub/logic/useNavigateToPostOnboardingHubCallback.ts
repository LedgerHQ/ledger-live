import { useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { useNavigate } from "react-router";
import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { isRecoverDisplayed } from "@ledgerhq/live-common/featureFlags/index";
import { useUpsellPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { hasBeenRedirectedToPostOnboardingSelector } from "~/renderer/reducers/settings";
import useFinishOnboardingDialog from "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/useFinishOnboardingDialog";

export function useNavigateToPostOnboardingHubCallback() {
  const navigate = useNavigate();
  const hasBeenRedirectedToPostOnboarding = useSelector(hasBeenRedirectedToPostOnboardingSelector);
  const { shouldDisplayFinishOnboardingWidget = false } = useWalletFeaturesConfig("desktop");
  const { handleOpen: openFinishOnboardingDialog } = useFinishOnboardingDialog();
  const { deviceModelId } = usePostOnboardingHubState();
  const recoverServices = useFeature("protectServicesDesktop");
  const upsellPath = useUpsellPath(recoverServices);
  const protectId = recoverServices?.params?.protectId ?? "protect-prod";

  return useCallback(
    (resetNavigationStack?: boolean) => {
      const shouldNavigateToRecoverLanding =
        isRecoverDisplayed(recoverServices, deviceModelId ?? undefined) &&
        !!upsellPath;

      if (shouldDisplayFinishOnboardingWidget) {
        const replace = resetNavigationStack ?? true;
        if (shouldNavigateToRecoverLanding) {
          navigate(
            `/recover/${protectId}?redirectTo=upsell&source=lld-post-onboarding-banner`,
            { replace },
          );
        } else {
          navigate("/", { replace: true });
        }
        if (!hasBeenRedirectedToPostOnboarding) {
          openFinishOnboardingDialog();
        }
        return;
      }
      navigate("/post-onboarding", { replace: !!resetNavigationStack });
    },
    [
      deviceModelId,
      hasBeenRedirectedToPostOnboarding,
      navigate,
      openFinishOnboardingDialog,
      protectId,
      recoverServices,
      shouldDisplayFinishOnboardingWidget,
      upsellPath,
    ],
  );
}

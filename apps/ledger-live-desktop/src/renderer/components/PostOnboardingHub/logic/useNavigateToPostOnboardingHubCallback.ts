import { useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { useNavigate } from "react-router";
import { useFeature } from "@features/platform-feature-flags";
import { isRecoverDisplayed } from "@ledgerhq/live-common/recover/isRecoverDisplayed";
import { useUpsellPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import {
  hasBeenRedirectedToPostOnboardingSelector,
  hasBeenUpsoldRecoverSelector,
} from "~/renderer/reducers/settings";
import useFinishOnboardingDialog from "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/useFinishOnboardingDialog";
import { addAccountToResumeSelector } from "~/renderer/reducers/onboarding";

export function useNavigateToPostOnboardingHubCallback() {
  const navigate = useNavigate();
  const hasBeenRedirectedToPostOnboarding = useSelector(hasBeenRedirectedToPostOnboardingSelector);
  const hasBeenUpsoldRecover = useSelector(hasBeenUpsoldRecoverSelector);
  const addAccountToResume = useSelector(addAccountToResumeSelector);
  const onboardingWidgetFeature = useFeature("onboardingWidget");
  const shouldDisplayFinishOnboardingWidget = onboardingWidgetFeature?.enabled ?? false;
  const { handleOpen: openFinishOnboardingDialog } = useFinishOnboardingDialog();
  const { deviceModelId } = usePostOnboardingHubState();
  const recoverServices = useFeature("protectServicesDesktop");
  const upsellPath = useUpsellPath(recoverServices);
  const protectId = recoverServices?.params?.protectId ?? "protect-prod";

  return useCallback(
    (resetNavigationStack?: boolean) => {
      const shouldNavigateToRecoverLanding =
        isRecoverDisplayed(recoverServices, deviceModelId ?? undefined) &&
        !!upsellPath &&
        !hasBeenUpsoldRecover;

      if (shouldDisplayFinishOnboardingWidget) {
        const replace = resetNavigationStack ?? true;
        if (shouldNavigateToRecoverLanding) {
          navigate(`/recover/${protectId}?redirectTo=upsell&source=lld-post-onboarding-banner`, {
            replace,
          });
        } else {
          navigate(addAccountToResume?.returnTo ?? "/", { replace: true });
        }
        // An Add Account flow waits to resume where it started: don't open Wallet setup over it.
        if (!hasBeenRedirectedToPostOnboarding && !addAccountToResume) {
          openFinishOnboardingDialog();
        }
        return;
      }
      navigate("/post-onboarding", { replace: !!resetNavigationStack });
    },
    [
      deviceModelId,
      hasBeenRedirectedToPostOnboarding,
      hasBeenUpsoldRecover,
      navigate,
      openFinishOnboardingDialog,
      protectId,
      recoverServices,
      addAccountToResume,
      shouldDisplayFinishOnboardingWidget,
      upsellPath,
    ],
  );
}

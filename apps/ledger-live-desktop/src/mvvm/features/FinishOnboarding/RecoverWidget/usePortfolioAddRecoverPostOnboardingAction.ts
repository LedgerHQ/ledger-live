import { useEffect } from "react";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useUpsellPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { addPostOnboardingAction } from "@ledgerhq/live-common/postOnboarding/actions";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { useDispatch } from "LLD/hooks/redux";
import { usePostOnboardingHubStepperDisplay } from "~/renderer/components/PostOnboardingHub/logic/usePostOnboardingHubStepperDisplay";
import { useRecoverBannerState } from "~/renderer/hooks/useRecoverBannerState";
import { hasStartedLedgerRecoverFlowForPostOnboarding } from "./recoverPortfolioWidgetVisibility";

/**
 * Orchestrates the Recover post-onboarding action-append from an always-mounted portfolio path.
 *
 * Must not live inside the Recover widget render tree: `PortfolioBannerContent` hides that subtree
 * when the LNS upsell takes priority, which would otherwise prevent users with an in-progress
 * subscription from ever getting Recover added to the hub.
 */
export function usePortfolioAddRecoverPostOnboardingAction() {
  const dispatch = useDispatch();
  const recoverServices = useFeature("protectServicesDesktop");
  const upsellPath = useUpsellPath(recoverServices);
  const { shouldDisplayFinishOnboardingWidget } = useWalletFeaturesConfig("desktop");
  const { actionsState } = usePostOnboardingHubState();
  const { areAllActionsCompleted, loading } = usePostOnboardingHubStepperDisplay(actionsState);
  const protectId = recoverServices?.params?.protectId ?? "protect-prod";
  const {
    data: { subscriptionState },
  } = useRecoverBannerState(protectId);

  const effectiveSubscriptionState = upsellPath ? subscriptionState : undefined;

  const recoverAlreadyInList = actionsState.some(
    action => action.id === PostOnboardingActionId.recover,
  );

  useEffect(() => {
    const shouldAdd =
      shouldDisplayFinishOnboardingWidget &&
      hasStartedLedgerRecoverFlowForPostOnboarding(effectiveSubscriptionState) &&
      !recoverAlreadyInList &&
      actionsState.length > 0 &&
      !loading &&
      !areAllActionsCompleted;

    if (shouldAdd) {
      dispatch(addPostOnboardingAction({ actionId: PostOnboardingActionId.recover }));
    }
  }, [
    actionsState.length,
    areAllActionsCompleted,
    dispatch,
    effectiveSubscriptionState,
    loading,
    recoverAlreadyInList,
    shouldDisplayFinishOnboardingWidget,
  ]);
}

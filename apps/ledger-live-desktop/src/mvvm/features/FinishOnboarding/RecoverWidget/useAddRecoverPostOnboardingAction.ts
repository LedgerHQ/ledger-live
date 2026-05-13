import { useEffect } from "react";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { addPostOnboardingAction } from "@ledgerhq/live-common/postOnboarding/actions";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { useDispatch } from "LLD/hooks/redux";
import { usePostOnboardingHubStepperDisplay } from "~/renderer/components/PostOnboardingHub/logic/usePostOnboardingHubStepperDisplay";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { hasStartedLedgerRecoverFlowForPostOnboarding } from "./recoverPortfolioWidgetVisibility";

export function useAddRecoverPostOnboardingAction(
  subscriptionState: LedgerRecoverSubscriptionStateEnum | undefined,
) {
  const dispatch = useDispatch();
  const { shouldDisplayFinishOnboardingWidget } = useWalletFeaturesConfig("desktop");
  const { actionsState } = usePostOnboardingHubState();
  const { areAllActionsCompleted, loading } = usePostOnboardingHubStepperDisplay(actionsState);

  const recoverAlreadyInList = actionsState.some(
    action => action.id === PostOnboardingActionId.recover,
  );

  useEffect(() => {
    const shouldAdd =
      shouldDisplayFinishOnboardingWidget &&
      hasStartedLedgerRecoverFlowForPostOnboarding(subscriptionState) &&
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
    loading,
    recoverAlreadyInList,
    shouldDisplayFinishOnboardingWidget,
    subscriptionState,
  ]);
}

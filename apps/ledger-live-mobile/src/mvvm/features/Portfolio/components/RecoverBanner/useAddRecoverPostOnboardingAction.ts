import { useEffect } from "react";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { addPostOnboardingAction } from "@ledgerhq/live-common/postOnboarding/actions";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { usePostOnboardingHubStepperDisplay } from "~/logic/postOnboarding/usePostOnboardingHubStepperDisplay";
import { useDispatch } from "~/context/hooks";
import {
  LedgerRecoverSubscriptionStateEnum,
  LedgerRecoverSubscriptionStateInProgressEnum,
} from "~/types/recoverSubscriptionState";

export function useAddRecoverPostOnboardingAction(
  subscriptionState: LedgerRecoverSubscriptionStateEnum | undefined,
) {
  const dispatch = useDispatch();
  const { shouldDisplayOnboardingWidget } = useWalletFeaturesConfig("mobile");
  const { actionsState } = usePostOnboardingHubState();
  const { areAllActionsCompleted, loading } = usePostOnboardingHubStepperDisplay(actionsState);

  const actionStateRecover = actionsState.find(
    action => action.id === PostOnboardingActionId.recover,
  );

  useEffect(() => {
    const shouldAddRecoverToPostOnboarding =
      shouldDisplayOnboardingWidget &&
      subscriptionState !== undefined &&
      (subscriptionState in LedgerRecoverSubscriptionStateInProgressEnum ||
        subscriptionState === LedgerRecoverSubscriptionStateEnum.BACKUP_DONE) &&
      actionStateRecover === undefined &&
      actionsState.length > 0 &&
      !loading &&
      !areAllActionsCompleted;

    if (shouldAddRecoverToPostOnboarding) {
      dispatch(addPostOnboardingAction({ actionId: PostOnboardingActionId.recover }));
    }
  }, [
    actionStateRecover,
    actionsState.length,
    areAllActionsCompleted,
    dispatch,
    loading,
    shouldDisplayOnboardingWidget,
    subscriptionState,
  ]);
}

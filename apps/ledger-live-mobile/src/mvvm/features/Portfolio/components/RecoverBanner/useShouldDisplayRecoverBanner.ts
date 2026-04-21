import { useEffect } from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { addPostOnboardingAction } from "@ledgerhq/live-common/postOnboarding/actions";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { useDispatch } from "~/context/hooks";
import {
  LedgerRecoverSubscriptionStateEnum,
  LedgerRecoverSubscriptionStateInProgressEnum,
} from "~/types/recoverSubscriptionState";
import useRecoverBannerState from "../../hooks/useRecoverBannerState";

function useShouldDisplayRecoverBanner() {
  const recoverServices = useFeature("protectServicesMobile");
  const bannerIsEnabled = recoverServices?.params?.bannerSubscriptionNotification;
  const protectID = recoverServices?.params?.protectId ?? "protect-prod";

  const dispatch = useDispatch();

  const { actionsState } = usePostOnboardingHubState();
  const actionStateRecover = actionsState.find(
    action => action.id === PostOnboardingActionId.recover,
  );

  const { data } = useRecoverBannerState(protectID);

  useEffect(() => {
    if (
      data?.subscriptionState !== undefined &&
      (data.subscriptionState in LedgerRecoverSubscriptionStateInProgressEnum ||
        data.subscriptionState === LedgerRecoverSubscriptionStateEnum.BACKUP_DONE) &&
      actionStateRecover === undefined
    ) {
      dispatch(addPostOnboardingAction({ actionId: PostOnboardingActionId.recover }));
    }
  }, [data?.subscriptionState, actionStateRecover, dispatch]);

  const inProgress =
    (data?.subscriptionState ?? LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION) in
    LedgerRecoverSubscriptionStateInProgressEnum;
  const shouldDisplay = bannerIsEnabled && inProgress && data?.displayBanner;

  return !!shouldDisplay;
}

export default useShouldDisplayRecoverBanner;

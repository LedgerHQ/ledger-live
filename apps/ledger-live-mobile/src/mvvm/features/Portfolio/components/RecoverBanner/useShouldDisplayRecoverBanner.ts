import { useCallback, useEffect, useMemo, useState } from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { addPostOnboardingAction } from "@ledgerhq/live-common/postOnboarding/actions";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { useDispatch } from "~/context/hooks";
import { getStoreValue } from "~/store";
import {
  LedgerRecoverSubscriptionStateEnum,
  LedgerRecoverSubscriptionStateInProgressEnum,
} from "~/types/recoverSubscriptionState";

function useShouldDisplayRecoverBanner() {
  const recoverServices = useFeature("protectServicesMobile");
  const bannerIsEnabled = recoverServices?.params?.bannerSubscriptionNotification;

  const [storageData, setStorageData] = useState<LedgerRecoverSubscriptionStateEnum>(
    LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION,
  );
  const [displayBannerData, setDisplayBannerData] = useState<boolean>();

  const dispatch = useDispatch();
  const protectID = recoverServices?.params?.protectId ?? "protect-prod";

  const { actionsState } = usePostOnboardingHubState();
  const actionStateRecover = actionsState.find(
    action => action.id === PostOnboardingActionId.recover,
  );

  const getStorageSubscriptionState = useCallback(async () => {
    const storageState: LedgerRecoverSubscriptionStateEnum | undefined = await getStoreValue(
      "SUBSCRIPTION_STATE",
      protectID,
    );
    const storage = storageState || LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION;
    const displayBanner = await getStoreValue("DISPLAY_BANNER", protectID);
    setStorageData(storage);
    setDisplayBannerData(displayBanner === "true");
    if (
      storageState !== undefined &&
      (storageState in LedgerRecoverSubscriptionStateInProgressEnum ||
        storageState === LedgerRecoverSubscriptionStateEnum.BACKUP_DONE) &&
      actionStateRecover === undefined
    ) {
      dispatch(addPostOnboardingAction({ actionId: PostOnboardingActionId.recover }));
    }
  }, [protectID, actionStateRecover, dispatch]);

  const recoverBannerInProgress = useMemo(
    () => storageData in LedgerRecoverSubscriptionStateInProgressEnum,

    [storageData],
  );

  useEffect(() => {
    getStorageSubscriptionState();
  }, [getStorageSubscriptionState]);

  const shouldDisplay = bannerIsEnabled && recoverBannerInProgress && displayBannerData;

  return !!shouldDisplay;
}

export default useShouldDisplayRecoverBanner;

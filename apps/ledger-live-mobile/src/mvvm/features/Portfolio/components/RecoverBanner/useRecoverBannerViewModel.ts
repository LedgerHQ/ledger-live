import { useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useCustomURI } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { addPostOnboardingAction } from "@ledgerhq/live-common/postOnboarding/actions";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { useDispatch } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { getStoreValue, setStoreValue } from "~/store";
import {
  LedgerRecoverSubscriptionStateEnum,
  LedgerRecoverSubscriptionStateInProgressEnum,
} from "~/types/recoverSubscriptionState";
import { track } from "~/analytics";

function useRecoverBannerViewModel() {
  const [displayBannerData, setDisplayBannerData] = useState<boolean>();
  const [isInProgress, setIsInProgress] = useState<boolean>(false);

  const { t } = useTranslation();
  const recoverServices = useFeature("protectServicesMobile");
  const dispatch = useDispatch();
  const bannerIsEnabled = recoverServices?.params?.bannerSubscriptionNotification;
  const protectID = recoverServices?.params?.protectId ?? "protect-prod";

  const { actionsState } = usePostOnboardingHubState();
  const actionStateRecover = actionsState.find(
    action => action.id === PostOnboardingActionId.recover,
  );

  const recoverResumeActivatePath = useCustomURI(
    recoverServices,
    "resumeActivate",
    "llm-banner-unfinished-onboarding",
    "recover-launch",
  );

  const getStorageSubscriptionState = useCallback(async () => {
    const storageState: LedgerRecoverSubscriptionStateEnum | undefined = await getStoreValue(
      "SUBSCRIPTION_STATE",
      protectID,
    );
    const storage = storageState || LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION;
    const displayBanner = await getStoreValue("DISPLAY_BANNER", protectID);
    setDisplayBannerData(displayBanner === "true");
    if (
      storageState !== undefined &&
      (storageState in LedgerRecoverSubscriptionStateInProgressEnum ||
        storageState === LedgerRecoverSubscriptionStateEnum.BACKUP_DONE) &&
      actionStateRecover === undefined
    ) {
      dispatch(addPostOnboardingAction({ actionId: PostOnboardingActionId.recover }));
    }

    if (storage in LedgerRecoverSubscriptionStateInProgressEnum) {
      setIsInProgress(true);
    } else {
      setIsInProgress(false);
    }
  }, [protectID, dispatch, actionStateRecover]);

  const onRedirectRecover = async () => {
    track("banner_clicked", {
      name: "recover",
    });
    if (!recoverResumeActivatePath) return;
    try {
      const canOpen = await Linking.canOpenURL(recoverResumeActivatePath);

      if (canOpen) {
        await Linking.openURL(recoverResumeActivatePath);
      }
    } catch {
      // eslint-disable-next-line no-console
      console.warn("Cannot open recover resume path");
    }
  };

  const onCloseBanner = () => {
    setStoreValue("DISPLAY_BANNER", "false", protectID);
    setDisplayBannerData(false);
    track("button_clicked", {
      button: "close",
      source: "recover banner",
    });
  };

  useEffect(() => {
    getStorageSubscriptionState();
  }, [getStorageSubscriptionState]);

  const shouldDisplay = bannerIsEnabled && isInProgress && displayBannerData;

  const title = t("portfolio.recoverBanner.title");
  const description = t("portfolio.recoverBanner.description");

  return {
    onRedirectRecover,
    onCloseBanner,
    shouldDisplay,
    title,
    description,
  };
}

export default useRecoverBannerViewModel;

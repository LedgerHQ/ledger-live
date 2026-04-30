import { useEffect } from "react";
import { GestureResponderEvent, Linking } from "react-native";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useCustomURI } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { addPostOnboardingAction } from "@ledgerhq/live-common/postOnboarding/actions";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { useDispatch } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import {
  LedgerRecoverSubscriptionStateEnum,
  LedgerRecoverSubscriptionStateInProgressEnum,
} from "~/types/recoverSubscriptionState";
import { track } from "~/analytics";
import {
  useGetRecoverBannerStateQuery,
  useDismissRecoverBannerMutation,
} from "./state-manager/api";

function useRecoverBannerViewModel() {
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

  const { data } = useGetRecoverBannerStateQuery(protectID);
  const [dismissRecoverBanner] = useDismissRecoverBannerMutation();

  const subscriptionState =
    data?.subscriptionState ?? LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION;
  const isInProgress = subscriptionState in LedgerRecoverSubscriptionStateInProgressEnum;

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

  const onCloseBanner = (event?: GestureResponderEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    dismissRecoverBanner(protectID);
    track("button_clicked", {
      button: "close",
      source: "recover banner",
    });
  };

  const shouldDisplay = bannerIsEnabled && isInProgress && data?.displayBanner;

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

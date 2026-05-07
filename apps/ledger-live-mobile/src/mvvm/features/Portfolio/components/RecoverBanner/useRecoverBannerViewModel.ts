import { GestureResponderEvent, Linking } from "react-native";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useCustomURI } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { useTranslation } from "~/context/Locale";
import {
  LedgerRecoverSubscriptionStateEnum,
  LedgerRecoverSubscriptionStateInProgressEnum,
} from "~/types/recoverSubscriptionState";
import { track } from "~/analytics";
import useRecoverBannerState from "../../hooks/useRecoverBannerState";
import { useAddRecoverPostOnboardingAction } from "./useAddRecoverPostOnboardingAction";

function useRecoverBannerViewModel() {
  const { t } = useTranslation();
  const recoverServices = useFeature("protectServicesMobile");
  const bannerIsEnabled = recoverServices?.params?.bannerSubscriptionNotification;
  const protectID = recoverServices?.params?.protectId ?? "protect-prod";

  const recoverResumeActivatePath = useCustomURI(
    recoverServices,
    "resumeActivate",
    "llm-banner-unfinished-onboarding",
    "recover-launch",
  );

  const { data, dismissBanner } = useRecoverBannerState(protectID);

  const subscriptionState =
    data?.subscriptionState ?? LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION;
  const isInProgress = subscriptionState in LedgerRecoverSubscriptionStateInProgressEnum;
  useAddRecoverPostOnboardingAction(data?.subscriptionState);

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
    dismissBanner();
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

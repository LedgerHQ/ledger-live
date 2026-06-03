import { useFeature } from "@features/platform-feature-flags";
import {
  LedgerRecoverSubscriptionStateEnum,
  LedgerRecoverSubscriptionStateInProgressEnum,
} from "~/types/recoverSubscriptionState";
import useRecoverBannerState from "../../hooks/useRecoverBannerState";
import { useAddRecoverPostOnboardingAction } from "./useAddRecoverPostOnboardingAction";

function useShouldDisplayRecoverBanner() {
  const recoverServices = useFeature("protectServicesMobile");
  const bannerIsEnabled = recoverServices?.params?.bannerSubscriptionNotification;
  const protectID = recoverServices?.params?.protectId ?? "protect-prod";

  const { data } = useRecoverBannerState(protectID);
  useAddRecoverPostOnboardingAction(data?.subscriptionState);

  const inProgress =
    (data?.subscriptionState ?? LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION) in
    LedgerRecoverSubscriptionStateInProgressEnum;
  const shouldDisplay = bannerIsEnabled && inProgress && data?.displayBanner;

  return !!shouldDisplay;
}

export default useShouldDisplayRecoverBanner;

import { isRecoverDisplayed, useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useUpsellPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { useRecoverBannerState } from "~/renderer/hooks/useRecoverBannerState";
import { useAddRecoverPostOnboardingAction } from "./useAddRecoverPostOnboardingAction";

/**
 * Orchestrates the Recover post-onboarding action-append from an always-mounted portfolio path.
 *
 * Must not live inside the Recover widget render tree: `PortfolioBannerContent` hides that subtree
 * when the LNS upsell takes priority, which would otherwise prevent users with an in-progress
 * subscription from ever getting Recover added to the hub.
 */
export function usePortfolioAddRecoverPostOnboardingAction() {
  const recoverServices = useFeature("protectServicesDesktop");
  const upsellPath = useUpsellPath(recoverServices);
  const { deviceModelId } = usePostOnboardingHubState();
  const protectId = recoverServices?.params?.protectId ?? "protect-prod";
  const {
    data: { subscriptionState },
  } = useRecoverBannerState(protectId);

  const isRecoverOfferAvailable = isRecoverDisplayed(recoverServices, deviceModelId ?? undefined);

  useAddRecoverPostOnboardingAction(
    isRecoverOfferAvailable && upsellPath ? subscriptionState : undefined,
  );
}

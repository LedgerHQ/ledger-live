import {
  needsConsentRenewal,
  needsPrivacyPolicyAck,
  resolveAnalyticsOptInParams,
} from "@ledgerhq/live-common/analyticsConsent/index";
import { isGenericAwarenessModalContentCardReady } from "@ledgerhq/live-common/genericAwarenessModal";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { selectIsBackupHubFeatureIntroOpen } from "~/reducers/backupHubFeatureIntro";
import { selectGenericAwarenessModalContentCards } from "~/reducers/genericAwarenessModal";
import {
  analyticsConsentInfoSelector,
  hasCompletedOnboardingSelector,
  productTourCompletedSelector,
} from "~/reducers/settings";

const APP_START_PREFIX = "app_start";

const hasGenericAwarenessAppStartPrefix = (id: string) =>
  id.toLowerCase().startsWith(APP_START_PREFIX);

export function useCompetingAppStartModalsPresent(): boolean {
  const cards = useSelector(selectGenericAwarenessModalContentCards);
  const isBackupHubFeatureIntroOpen = useSelector(selectIsBackupHubFeatureIntroOpen);
  const productTourCompleted = useSelector(productTourCompletedSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const analyticsConsentInfo = useSelector(analyticsConsentInfoSelector);

  const productTourFlag = useFeature("lwmProductTour");
  const genericAwarenessModalFlag = useFeature("lwmGenericAwarenessModal");
  const analyticsOptInFlag = useFeature("analyticsOptIn");

  const hasProductTourCompeting = Boolean(
    productTourFlag?.enabled && hasCompletedOnboarding && !productTourCompleted,
  );

  const hasGenericAwarenessCompeting = Boolean(
    genericAwarenessModalFlag?.enabled &&
    cards.some(
      card =>
        hasGenericAwarenessAppStartPrefix(card.id) && isGenericAwarenessModalContentCardReady(card),
    ),
  );

  const { consentValidityDays, policyVersion } = resolveAnalyticsOptInParams(analyticsOptInFlag);

  const hasAnalyticsConsentCompeting = Boolean(
    analyticsOptInFlag?.enabled &&
    hasCompletedOnboarding &&
    (needsPrivacyPolicyAck(analyticsConsentInfo.privacyPolicyVersion, policyVersion) ||
      needsConsentRenewal(analyticsConsentInfo.consentDate, consentValidityDays)),
  );

  return (
    isBackupHubFeatureIntroOpen ||
    hasProductTourCompeting ||
    hasGenericAwarenessCompeting ||
    hasAnalyticsConsentCompeting
  );
}

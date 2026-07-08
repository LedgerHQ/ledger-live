import { useMemo } from "react";
import {
  needsConsentRenewal,
  needsPrivacyPolicyAck,
  resolveAnalyticsOptInParams,
} from "@ledgerhq/live-common/analyticsConsent/index";
import { isGenericAwarenessModalContentCardReady } from "@ledgerhq/live-common/genericAwarenessModal";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { selectGenericAwarenessModalContentCards } from "~/reducers/genericAwarenessModal";
import {
  analyticsConsentInfoSelector,
  analyticsEnabledSelector,
  hasCompletedOnboardingSelector,
  productTourCompletedSelector,
} from "~/reducers/settings";

const APP_START_PREFIX = "app_start";

const isGenericAwarenessAppStartCardReady = (id: string) =>
  id.toLowerCase().startsWith(APP_START_PREFIX);

export function useCompetingAppStartModalsPresent(): boolean {
  const cards = useSelector(selectGenericAwarenessModalContentCards);
  const productTourCompleted = useSelector(productTourCompletedSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const analyticsConsentInfo = useSelector(analyticsConsentInfoSelector);
  const analyticsEnabled = useSelector(analyticsEnabledSelector);

  const productTourFlag = useFeature("lwmProductTour");
  const genericAwarenessModalFlag = useFeature("lwmGenericAwarenessModal");
  const analyticsOptInFlag = useFeature("analyticsOptIn");

  return useMemo(() => {
    const hasProductTourCompeting = Boolean(productTourFlag?.enabled && !productTourCompleted);

    const hasGenericAwarenessCompeting = Boolean(
      genericAwarenessModalFlag?.enabled &&
      cards.some(
        card =>
          isGenericAwarenessAppStartCardReady(card.id) &&
          isGenericAwarenessModalContentCardReady(card),
      ),
    );

    const { consentValidityDays, policyVersion } = resolveAnalyticsOptInParams(analyticsOptInFlag);

    const hasAnalyticsConsentCompeting = Boolean(
      analyticsOptInFlag?.enabled &&
      hasCompletedOnboarding &&
      (needsPrivacyPolicyAck(analyticsConsentInfo.privacyPolicyVersion, policyVersion) ||
        needsConsentRenewal(analyticsConsentInfo.consentDate, consentValidityDays) ||
        !analyticsEnabled),
    );

    return hasProductTourCompeting || hasGenericAwarenessCompeting || hasAnalyticsConsentCompeting;
  }, [
    analyticsConsentInfo.consentDate,
    analyticsConsentInfo.privacyPolicyVersion,
    analyticsEnabled,
    analyticsOptInFlag,
    cards,
    genericAwarenessModalFlag?.enabled,
    hasCompletedOnboarding,
    productTourCompleted,
    productTourFlag?.enabled,
  ]);
}

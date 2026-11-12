import { useAnalyticsConsentDecision } from "@features/flow-analytics-consent";
import { isGenericAwarenessModalContentCardReady } from "@ledgerhq/live-common/genericAwarenessModal";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { selectIsBackupHubFeatureIntroOpen } from "~/reducers/backupHubFeatureIntro";
import { selectIsProductTourDrawerOpen } from "~/reducers/productTourDrawer";
import { selectGenericAwarenessModalContentCards } from "~/reducers/genericAwarenessModal";
import { analyticsConsentInfoSelector, hasCompletedOnboardingSelector } from "~/reducers/settings";

const APP_START_PREFIX = "app_start";

const hasGenericAwarenessAppStartPrefix = (id: string) =>
  id.toLowerCase().startsWith(APP_START_PREFIX);

export function useCompetingAppStartModalsPresent(): boolean {
  const cards = useSelector(selectGenericAwarenessModalContentCards);
  const isBackupHubFeatureIntroOpen = useSelector(selectIsBackupHubFeatureIntroOpen);
  const isProductTourDrawerOpen = useSelector(selectIsProductTourDrawerOpen);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const analyticsConsentInfo = useSelector(analyticsConsentInfoSelector);

  const genericAwarenessModalFlag = useFeature("lwmGenericAwarenessModal");
  const { isFeatureEnabled: isAnalyticsOptInEnabled, decision: analyticsConsentDecision } =
    useAnalyticsConsentDecision(analyticsConsentInfo);

  const hasGenericAwarenessCompeting = Boolean(
    genericAwarenessModalFlag?.enabled &&
    cards.some(
      card =>
        hasGenericAwarenessAppStartPrefix(card.id) && isGenericAwarenessModalContentCardReady(card),
    ),
  );

  const hasAnalyticsConsentCompeting =
    isAnalyticsOptInEnabled && hasCompletedOnboarding && analyticsConsentDecision.kind !== "none";

  return (
    isBackupHubFeatureIntroOpen ||
    isProductTourDrawerOpen ||
    hasGenericAwarenessCompeting ||
    hasAnalyticsConsentCompeting
  );
}

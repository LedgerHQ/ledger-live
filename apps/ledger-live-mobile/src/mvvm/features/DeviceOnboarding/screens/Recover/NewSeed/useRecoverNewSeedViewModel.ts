import { useEffect, useRef, useState } from "react";
import { useFeature } from "@features/platform-feature-flags";
import {
  karaokes,
  onboardingButtons,
  onboardingPages,
  trackKaraokeAdvanced,
  trackKaraokePage,
  trackOnboardingClick,
  trackOnboardingPage,
  trackRecoverOffered,
  type OnboardingButton,
  type OnboardingPage,
} from "@features/platform-device-onboarding-analytics";
import type { UnseededFunnel } from "LLM/features/DeviceOnboarding/analytics/useUnseededFunnelTracking";
import { useTranslation } from "~/context/Locale";

export type RecoverNewSeedScreenProps = Readonly<{
  /** Set for a tracked funnel: the pitch then sends its events. */
  funnel?: UnseededFunnel | null;
  suspendSheets?: boolean;
  onSkip: () => void;
  onRemindLater: () => void;
  onOpenLiveApp: () => void;
  onClose: () => void;
}>;

export type RecoverSheetPoint = Readonly<{
  id: "identity" | "security" | "legacy";
  title: string;
  description: string;
}>;

export type RecoverDetailSheet = Readonly<{
  title: string;
  points: readonly RecoverSheetPoint[];
  startLabel: string;
  remindLabel: string;
  onStart: () => void;
  onRemind: () => void;
  onClose: () => void;
}>;

export type RecoverNewSeedViewProps = Readonly<{
  phrases: readonly string[];
  tapLabel: string;
  closeLabel: string;
  title: string;
  description: string;
  price: string;
  protectLabel: string;
  skipLabel: string;
  onAdvance: (shownIndex: number) => void;
  onProtect: () => void;
  onSkip: () => void;
  onClose: () => void;
  sheet: RecoverDetailSheet | null;
}>;

export function useRecoverNewSeedViewModel({
  funnel = null,
  suspendSheets = false,
  onSkip,
  onRemindLater,
  onOpenLiveApp,
  onClose,
}: RecoverNewSeedScreenProps): RecoverNewSeedViewProps {
  const { t } = useTranslation();
  const detailFlag = useFeature("recoverDetailedDrawerOnboarding");
  const showsDetail = detailFlag?.enabled === true;
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const funnelProps = funnel?.props ?? null;
  const phrases = [
    t("deviceOnboarding.karaoke.recover.tooManyBackups"),
    t("deviceOnboarding.karaoke.recover.encryptedBackup"),
    t("deviceOnboarding.karaoke.recover.thereWhenYouNeedIt"),
  ];
  useRecoverOffered(funnel, phrases.length);
  const clickOnPitch = (button: OnboardingButton) => {
    if (funnelProps) {
      trackOnboardingClick(button, funnelProps, { page: onboardingPages.recoverOnboarding });
    }
  };
  const showPage = (page: OnboardingPage) => {
    if (funnelProps) trackOnboardingPage(page, funnelProps);
  };

  return {
    phrases,
    tapLabel: t("deviceOnboarding.karaoke.tapToContinue"),
    closeLabel: t("deviceOnboarding.checks.close"),
    title: t("deviceOnboarding.karaoke.recover.title"),
    description: t("deviceOnboarding.karaoke.recover.description"),
    price: t("deviceOnboarding.karaoke.recover.price"),
    protectLabel: t("deviceOnboarding.karaoke.recover.protect"),
    skipLabel: t("deviceOnboarding.karaoke.recover.skip"),
    onAdvance: shownIndex => {
      const pitchShown = shownIndex === phrases.length;
      if (pitchShown) showPage(onboardingPages.recoverOnboarding);
      else if (funnelProps) {
        trackKaraokeAdvanced(karaokes.recover, funnelProps, shownIndex, phrases.length);
      }
    },
    onProtect: () => {
      clickOnPitch(onboardingButtons.protectWithRecover);
      if (!showsDetail) {
        onOpenLiveApp();
        return;
      }
      setIsSheetOpen(true);
      showPage(onboardingPages.recoverSheet);
    },
    onSkip: () => {
      clickOnPitch(onboardingButtons.skipRecover);
      onSkip();
    },
    onClose,
    sheet:
      showsDetail && isSheetOpen && !suspendSheets
        ? {
            title: t("deviceOnboarding.karaoke.recover.sheet.title"),
            points: [
              {
                id: "identity",
                title: t("deviceOnboarding.karaoke.recover.sheet.identity.title"),
                description: t("deviceOnboarding.karaoke.recover.sheet.identity.description"),
              },
              {
                id: "security",
                title: t("deviceOnboarding.karaoke.recover.sheet.security.title"),
                description: t("deviceOnboarding.karaoke.recover.sheet.security.description"),
              },
              {
                id: "legacy",
                title: t("deviceOnboarding.karaoke.recover.sheet.legacy.title"),
                description: t("deviceOnboarding.karaoke.recover.sheet.legacy.description"),
              },
            ],
            startLabel: t("deviceOnboarding.karaoke.recover.sheet.start"),
            remindLabel: t("deviceOnboarding.karaoke.recover.sheet.remindLater"),
            onStart: onOpenLiveApp,
            onRemind: onRemindLater,
            onClose: () => setIsSheetOpen(false),
          }
        : null,
  };
}

/** Not `TrackScreen`: coming back from the Recover Live App would send the pages again. */
function useRecoverOffered(funnel: UnseededFunnel | null, phraseCount: number) {
  const sent = useRef(false);
  useEffect(() => {
    if (!funnel || sent.current) return;
    sent.current = true;
    trackRecoverOffered(funnel.props, funnel.status);
    trackKaraokePage(karaokes.recover, funnel.props, phraseCount);
  }, [funnel, phraseCount]);
}

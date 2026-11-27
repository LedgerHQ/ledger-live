import { useState } from "react";
import { useTranslation } from "~/context/Locale";
import {
  onboardingButtons,
  onboardingPages,
  trackOnboardingClick,
  trackOnboardingPage,
  type FunnelProps,
  type ScreenTracking,
  type OnboardingButton,
  type OnboardingPage,
  type TrackingProps,
} from "@features/platform-device-onboarding-analytics";

type SkipDrawerProps = Readonly<{
  trackingProps?: TrackingProps;
  isOpen: boolean;
  onClose: () => void;
  onClosePressed: () => void;
  onSkip: () => void;
  onActivate: () => void;
}>;

export type SyncOfferPhase = "offer" | "synchronizing" | "success";

type SyncOfferSuccessViewProps = Readonly<{
  phase: "success";
  showGlow: boolean;
  screenTracking: ScreenTracking | null;
  title: string;
  continueLabel: string;
  closeLabel: string;
  onContinue: () => void;
  onQuit: () => void;
}>;

type SyncOfferSynchronizingViewProps = Readonly<{
  phase: "synchronizing";
  showGlow: boolean;
  title: string;
  closeLabel: string;
  onQuit: () => void;
}>;

type SyncOfferPromptViewProps = Readonly<{
  phase: "offer";
  showGlow: boolean;
  screenTracking: ScreenTracking | null;
  title: string;
  description: string;
  learnMoreLabel: string;
  activateLabel: string;
  skipLabel: string;
  closeLabel: string;
  onActivate: () => void;
  onOpenSkip: () => void;
  onLearnMore: () => void;
  onQuit: () => void;
  skipDrawer: SkipDrawerProps;
}>;

export type SyncOfferViewProps =
  | SyncOfferSuccessViewProps
  | SyncOfferSynchronizingViewProps
  | SyncOfferPromptViewProps;

export type SyncOfferScreenProps = Readonly<{
  onActivate: () => void;
  onSkip: () => void;
  onLearnMore: () => void;
  onQuit: () => void;
  onContinue: () => void;
  phase: SyncOfferPhase;
  showGlow?: boolean;
  /** Set in a tracked funnel, seeded or unseeded. */
  funnelProps?: FunnelProps | null;
}>;

export function useSyncOfferScreenViewModel({
  onActivate,
  onSkip,
  onLearnMore,
  onQuit,
  onContinue,
  phase,
  showGlow = false,
  funnelProps,
}: SyncOfferScreenProps): SyncOfferViewProps {
  const { t } = useTranslation();
  const [isSkipDrawerOpen, setIsSkipDrawerOpen] = useState(false);
  const closeSkipDrawer = () => setIsSkipDrawerOpen(false);
  const trackingProps = funnelProps ?? undefined;
  const screenTracking = (category: OnboardingPage): ScreenTracking | null =>
    trackingProps ? { category, ...trackingProps } : null;
  const trackClick = (button: OnboardingButton) => {
    if (funnelProps) trackOnboardingClick(button, funnelProps);
  };
  const quit = () => {
    trackClick(onboardingButtons.close);
    onQuit();
  };

  if (phase === "success") {
    return {
      phase,
      showGlow,
      screenTracking: screenTracking(onboardingPages.ledgerSyncSuccess),
      title: t("deviceOnboarding.syncOffer.success.title"),
      continueLabel: t("deviceOnboarding.syncOffer.success.cta"),
      closeLabel: t("deviceOnboarding.checks.close"),
      onContinue: () => {
        trackClick(onboardingButtons.continue);
        onContinue();
      },
      onQuit: quit,
    };
  }

  if (phase === "synchronizing") {
    return {
      phase,
      showGlow,
      title: t("deviceOnboarding.checks.synchronizing.title"),
      closeLabel: t("deviceOnboarding.checks.close"),
      onQuit: quit,
    };
  }

  return {
    phase,
    showGlow,
    screenTracking: screenTracking(onboardingPages.ledgerSync),
    title: t("deviceOnboarding.syncOffer.title"),
    description: t("deviceOnboarding.syncOffer.description"),
    learnMoreLabel: t("deviceOnboarding.syncOffer.learnMore"),
    activateLabel: t("deviceOnboarding.syncOffer.activate"),
    skipLabel: t("deviceOnboarding.syncOffer.skip"),
    closeLabel: t("deviceOnboarding.checks.close"),
    onActivate: () => {
      trackClick(onboardingButtons.activateSync);
      onActivate();
    },
    onOpenSkip: () => {
      trackClick(onboardingButtons.skip);
      setIsSkipDrawerOpen(true);
    },
    onLearnMore: () => {
      trackClick(onboardingButtons.learnMore);
      onLearnMore();
    },
    onQuit: quit,
    skipDrawer: {
      trackingProps,
      isOpen: isSkipDrawerOpen,
      onClose: closeSkipDrawer,
      onClosePressed: () => trackClick(onboardingButtons.close),
      onSkip: () => {
        trackClick(onboardingButtons.yesSkip);
        if (funnelProps) trackOnboardingPage(onboardingPages.ledgerSyncRefused, funnelProps);
        closeSkipDrawer();
        onSkip();
      },
      onActivate: () => {
        trackClick(onboardingButtons.enableSync);
        closeSkipDrawer();
        onActivate();
      },
    },
  };
}

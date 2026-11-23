import { useState } from "react";
import { useTranslation } from "~/context/Locale";
import {
  seededButtons,
  seededPages,
  seededProps,
  trackSeededClick,
  trackSeededPage,
  type DeviceModelId,
  type ScreenTracking,
  type SeededButton,
  type SeededPage,
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
  seededDeviceType?: DeviceModelId | null;
}>;

export function useSyncOfferScreenViewModel({
  onActivate,
  onSkip,
  onLearnMore,
  onQuit,
  onContinue,
  phase,
  showGlow = false,
  seededDeviceType,
}: SyncOfferScreenProps): SyncOfferViewProps {
  const { t } = useTranslation();
  const [isSkipDrawerOpen, setIsSkipDrawerOpen] = useState(false);
  const closeSkipDrawer = () => setIsSkipDrawerOpen(false);
  const trackingProps = seededDeviceType ? seededProps(seededDeviceType) : undefined;
  const screenTracking = (category: SeededPage): ScreenTracking | null =>
    trackingProps ? { category, ...trackingProps } : null;
  const trackClick = (button: SeededButton) => {
    if (seededDeviceType) trackSeededClick(button, seededDeviceType);
  };
  const quit = () => {
    trackClick(seededButtons.close);
    onQuit();
  };

  if (phase === "success") {
    return {
      phase,
      showGlow,
      screenTracking: screenTracking(seededPages.ledgerSyncSuccess),
      title: t("deviceOnboarding.syncOffer.success.title"),
      continueLabel: t("deviceOnboarding.syncOffer.success.cta"),
      closeLabel: t("deviceOnboarding.checks.close"),
      onContinue: () => {
        trackClick(seededButtons.continue);
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
    screenTracking: screenTracking(seededPages.ledgerSync),
    title: t("deviceOnboarding.syncOffer.title"),
    description: t("deviceOnboarding.syncOffer.description"),
    learnMoreLabel: t("deviceOnboarding.syncOffer.learnMore"),
    activateLabel: t("deviceOnboarding.syncOffer.activate"),
    skipLabel: t("deviceOnboarding.syncOffer.skip"),
    closeLabel: t("deviceOnboarding.checks.close"),
    onActivate: () => {
      trackClick(seededButtons.activateSync);
      onActivate();
    },
    onOpenSkip: () => {
      trackClick(seededButtons.skip);
      setIsSkipDrawerOpen(true);
    },
    onLearnMore: () => {
      trackClick(seededButtons.learnMore);
      onLearnMore();
    },
    onQuit: quit,
    skipDrawer: {
      trackingProps,
      isOpen: isSkipDrawerOpen,
      onClose: closeSkipDrawer,
      onClosePressed: () => trackClick(seededButtons.close),
      onSkip: () => {
        trackClick(seededButtons.yesSkip);
        if (seededDeviceType) trackSeededPage(seededPages.ledgerSyncRefused, seededDeviceType);
        closeSkipDrawer();
        onSkip();
      },
      onActivate: () => {
        trackClick(seededButtons.enableSync);
        closeSkipDrawer();
        onActivate();
      },
    },
  };
}

import { useState } from "react";
import { useTranslation } from "~/context/Locale";

type SkipDrawerProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
  onActivate: () => void;
}>;

export type SyncOfferPhase = "offer" | "synchronizing" | "success";

type SyncOfferSuccessViewProps = Readonly<{
  phase: "success";
  title: string;
  continueLabel: string;
  closeLabel: string;
  onContinue: () => void;
  onQuit: () => void;
}>;

type SyncOfferSynchronizingViewProps = Readonly<{
  phase: "synchronizing";
  title: string;
  closeLabel: string;
  onQuit: () => void;
}>;

type SyncOfferPromptViewProps = Readonly<{
  phase: "offer";
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
}>;

export function useSyncOfferScreenViewModel({
  onActivate,
  onSkip,
  onLearnMore,
  onQuit,
  onContinue,
  phase,
}: SyncOfferScreenProps): SyncOfferViewProps {
  const { t } = useTranslation();
  const [isSkipDrawerOpen, setIsSkipDrawerOpen] = useState(false);
  const closeSkipDrawer = () => setIsSkipDrawerOpen(false);

  if (phase === "success") {
    return {
      phase,
      title: t("deviceOnboarding.syncOffer.success.title"),
      continueLabel: t("deviceOnboarding.syncOffer.success.cta"),
      closeLabel: t("deviceOnboarding.checks.close"),
      onContinue,
      onQuit,
    };
  }

  if (phase === "synchronizing") {
    return {
      phase,
      title: t("deviceOnboarding.checks.synchronizing.title"),
      closeLabel: t("deviceOnboarding.checks.close"),
      onQuit,
    };
  }

  return {
    phase,
    title: t("deviceOnboarding.syncOffer.title"),
    description: t("deviceOnboarding.syncOffer.description"),
    learnMoreLabel: t("deviceOnboarding.syncOffer.learnMore"),
    activateLabel: t("deviceOnboarding.syncOffer.activate"),
    skipLabel: t("deviceOnboarding.syncOffer.skip"),
    closeLabel: t("deviceOnboarding.checks.close"),
    onActivate,
    onOpenSkip: () => setIsSkipDrawerOpen(true),
    onLearnMore,
    onQuit,
    skipDrawer: {
      isOpen: isSkipDrawerOpen,
      onClose: closeSkipDrawer,
      onSkip: () => {
        closeSkipDrawer();
        onSkip();
      },
      onActivate: () => {
        closeSkipDrawer();
        onActivate();
      },
    },
  };
}

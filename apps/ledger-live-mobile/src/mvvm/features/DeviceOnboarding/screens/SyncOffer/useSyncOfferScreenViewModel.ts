import { useState } from "react";
import { useTranslation } from "~/context/Locale";

type SkipDrawerProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
  onActivate: () => void;
}>;

export type SyncOfferViewProps = Readonly<{
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

export type SyncOfferScreenProps = Readonly<{
  onActivate: () => void;
  onSkip: () => void;
  onLearnMore: () => void;
  onQuit: () => void;
}>;

export function useSyncOfferScreenViewModel({
  onActivate,
  onSkip,
  onLearnMore,
  onQuit,
}: SyncOfferScreenProps): SyncOfferViewProps {
  const { t } = useTranslation();
  const [isSkipDrawerOpen, setIsSkipDrawerOpen] = useState(false);
  const closeSkipDrawer = () => setIsSkipDrawerOpen(false);

  return {
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

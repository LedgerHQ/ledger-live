import { useState } from "react";
import { useTranslation } from "~/context/Locale";
import { seededButtons, seededFunnel, seededPages } from "../../analytics/seededTracking";

type SkipDrawerProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
  onActivate: () => void;
  /** False when the seeded funnel tracks the drawer page. */
  trackScreen: boolean;
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
  const closeSkipDrawer = () => {
    setIsSkipDrawerOpen(false);
    seededFunnel.closeDrawer();
  };

  return {
    title: t("deviceOnboarding.syncOffer.title"),
    description: t("deviceOnboarding.syncOffer.description"),
    learnMoreLabel: t("deviceOnboarding.syncOffer.learnMore"),
    activateLabel: t("deviceOnboarding.syncOffer.activate"),
    skipLabel: t("deviceOnboarding.syncOffer.skip"),
    closeLabel: t("deviceOnboarding.checks.close"),
    onActivate: () => {
      seededFunnel.click(seededButtons.activateSync);
      onActivate();
    },
    onOpenSkip: () => {
      seededFunnel.click(seededButtons.skip);
      seededFunnel.openDrawer(seededPages.skipLedgerSyncDrawer);
      setIsSkipDrawerOpen(true);
    },
    onLearnMore: () => {
      seededFunnel.click(seededButtons.learnMore);
      onLearnMore();
    },
    onQuit: () => {
      seededFunnel.click(seededButtons.close);
      onQuit();
    },
    skipDrawer: {
      isOpen: isSkipDrawerOpen,
      onClose: closeSkipDrawer,
      onSkip: () => {
        seededFunnel.click(seededButtons.yesSkip);
        seededFunnel.page(seededPages.ledgerSyncRefused);
        closeSkipDrawer();
        onSkip();
      },
      onActivate: () => {
        seededFunnel.click(seededButtons.enableSync);
        closeSkipDrawer();
        onActivate();
      },
      trackScreen: !seededFunnel.isTracked(),
    },
  };
}

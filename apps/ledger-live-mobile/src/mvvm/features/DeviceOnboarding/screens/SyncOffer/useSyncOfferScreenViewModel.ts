import { useState } from "react";
import { useTranslation } from "~/context/Locale";
import {
  seededButtons,
  seededPages,
  seededProps,
  trackSeededClick,
  trackSeededPage,
} from "../../analytics/seededTracking";

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
  /** Page properties of the seeded funnel, or null when this offer is not tracked. */
  trackingProps: ReturnType<typeof seededProps> | null;
  skipDrawer: SkipDrawerProps;
}>;

export type SyncOfferScreenProps = Readonly<{
  onActivate: () => void;
  onSkip: () => void;
  onLearnMore: () => void;
  onQuit: () => void;
  /** Set when the offer ends the seeded funnel, which is then tracked. */
  seededDeviceType?: string | null;
}>;

export function useSyncOfferScreenViewModel({
  onActivate,
  onSkip,
  onLearnMore,
  onQuit,
  seededDeviceType,
}: SyncOfferScreenProps): SyncOfferViewProps {
  const { t } = useTranslation();
  const [isSkipDrawerOpen, setIsSkipDrawerOpen] = useState(false);
  const closeSkipDrawer = () => setIsSkipDrawerOpen(false);
  const trackClick = (button: string) => {
    if (seededDeviceType) trackSeededClick(button, seededDeviceType);
  };

  return {
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
    onQuit: () => {
      trackClick(seededButtons.close);
      onQuit();
    },
    trackingProps: seededDeviceType ? seededProps(seededDeviceType) : null,
    skipDrawer: {
      isOpen: isSkipDrawerOpen,
      onClose: closeSkipDrawer,
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

import { useRef, useState } from "react";
import {
  getCurrentTrackingPage,
  getPreviousTrackingPage,
  restoreTrackingPages,
} from "@shared/analytics";
import { useTranslation } from "~/context/Locale";
import {
  seededButtons,
  seededCallerWins,
  seededPages,
  seededSharedProps,
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
  trackingProps: ReturnType<typeof seededSharedProps>;
  callerWins: readonly string[];
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
  const offerPages = useRef<{ current: string; previous: string } | null>(null);
  const skipDrawerAction = useRef(false);
  const closeSkipDrawer = () => {
    setIsSkipDrawerOpen(false);
    if (skipDrawerAction.current) {
      skipDrawerAction.current = false;
      offerPages.current = null;
      return;
    }
    const saved = offerPages.current;
    offerPages.current = null;
    if (!saved) return;
    restoreTrackingPages(saved.current, saved.previous);
  };
  const closeSkipDrawerForAction = () => {
    skipDrawerAction.current = true;
    closeSkipDrawer();
  };

  return {
    title: t("deviceOnboarding.syncOffer.title"),
    description: t("deviceOnboarding.syncOffer.description"),
    learnMoreLabel: t("deviceOnboarding.syncOffer.learnMore"),
    activateLabel: t("deviceOnboarding.syncOffer.activate"),
    skipLabel: t("deviceOnboarding.syncOffer.skip"),
    closeLabel: t("deviceOnboarding.checks.close"),
    onActivate: () => {
      void trackSeededClick(seededButtons.activateSync, seededPages.ledgerSync);
      onActivate();
    },
    onOpenSkip: () => {
      void trackSeededClick(seededButtons.skip, seededPages.ledgerSync);
      offerPages.current = {
        current: getCurrentTrackingPage(),
        previous: getPreviousTrackingPage(),
      };
      setIsSkipDrawerOpen(true);
    },
    onLearnMore: () => {
      void trackSeededClick(seededButtons.learnMore, seededPages.ledgerSync);
      onLearnMore();
    },
    onQuit: () => {
      void trackSeededClick(seededButtons.close, seededPages.ledgerSync);
      onQuit();
    },
    trackingProps: seededSharedProps(),
    callerWins: seededCallerWins,
    skipDrawer: {
      isOpen: isSkipDrawerOpen,
      onClose: closeSkipDrawer,
      onSkip: () => {
        closeSkipDrawerForAction();
        void trackSeededClick(seededButtons.yesSkip, seededPages.skipDrawer);
        void trackSeededPage(seededPages.ledgerSyncRefused);
        onSkip();
      },
      onActivate: () => {
        closeSkipDrawerForAction();
        void trackSeededClick(seededButtons.enableSync, seededPages.skipDrawer);
        onActivate();
      },
    },
  };
}

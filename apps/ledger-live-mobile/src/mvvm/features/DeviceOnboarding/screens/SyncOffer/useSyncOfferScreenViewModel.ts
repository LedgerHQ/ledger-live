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
  trackingProps: Partial<ReturnType<typeof seededSharedProps>>;
  callerWins: readonly string[];
  skipDrawer: SkipDrawerProps;
}>;

export type SyncOfferScreenProps = Readonly<{
  onActivate: () => void;
  onSkip: () => void;
  onLearnMore: () => void;
  onQuit: () => void;
  analytics?: boolean;
}>;

export function useSyncOfferScreenViewModel({
  onActivate,
  onSkip,
  onLearnMore,
  onQuit,
  analytics = true,
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
  const trackClick = (button: string, page: string) => {
    if (!analytics) return;
    void trackSeededClick(button, page);
  };

  return {
    title: t("deviceOnboarding.syncOffer.title"),
    description: t("deviceOnboarding.syncOffer.description"),
    learnMoreLabel: t("deviceOnboarding.syncOffer.learnMore"),
    activateLabel: t("deviceOnboarding.syncOffer.activate"),
    skipLabel: t("deviceOnboarding.syncOffer.skip"),
    closeLabel: t("deviceOnboarding.checks.close"),
    onActivate: () => {
      trackClick(seededButtons.activateSync, seededPages.ledgerSync);
      onActivate();
    },
    onOpenSkip: () => {
      trackClick(seededButtons.skip, seededPages.ledgerSync);
      offerPages.current = {
        current: getCurrentTrackingPage(),
        previous: getPreviousTrackingPage(),
      };
      setIsSkipDrawerOpen(true);
    },
    onLearnMore: () => {
      trackClick(seededButtons.learnMore, seededPages.ledgerSync);
      onLearnMore();
    },
    onQuit: () => {
      trackClick(seededButtons.close, seededPages.ledgerSync);
      onQuit();
    },
    trackingProps: analytics ? seededSharedProps() : {},
    callerWins: analytics ? seededCallerWins : [],
    skipDrawer: {
      isOpen: isSkipDrawerOpen,
      onClose: closeSkipDrawer,
      onSkip: () => {
        closeSkipDrawerForAction();
        trackClick(seededButtons.yesSkip, seededPages.skipDrawer);
        if (analytics) void trackSeededPage(seededPages.ledgerSyncRefused);
        onSkip();
      },
      onActivate: () => {
        closeSkipDrawerForAction();
        trackClick(seededButtons.enableSync, seededPages.skipDrawer);
        onActivate();
      },
    },
  };
}

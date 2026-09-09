import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  QuarterlyTourAnalytics,
  QuarterlyTourDrawerViewModel,
  QuarterlyTourSlide,
} from "./types";

type UseQuarterlyTourDrawerViewModelParams = {
  readonly isTourEnabled: boolean;
  readonly hasSeenTour: boolean;
  readonly markTourAsSeen: () => void;
  readonly shouldAutoOpen?: boolean;
  readonly slides: readonly QuarterlyTourSlide[];
  readonly analytics: QuarterlyTourAnalytics;
};

export const useQuarterlyTourDrawerViewModel = ({
  isTourEnabled,
  hasSeenTour,
  markTourAsSeen,
  shouldAutoOpen = false,
  slides,
  analytics,
}: UseQuarterlyTourDrawerViewModelParams): QuarterlyTourDrawerViewModel => {
  const { t } = useTranslation();
  const currentIndexRef = useRef(0);
  const isClosingRef = useRef(false);
  const hasTrackedOpenRef = useRef(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getContext = useCallback(
    (slideIndex: number) => {
      const slide = slides[slideIndex];
      return slide ? analytics.getContext(slideIndex, t(slide.titleKey)) : undefined;
    },
    [analytics, slides, t],
  );

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    markTourAsSeen();
  }, [markTourAsSeen]);

  const closeDrawer = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    const context = getContext(currentIndexRef.current);
    if (context) analytics.trackCloseClick(context);
    handleCloseDialog();
  }, [analytics, getContext, handleCloseDialog]);

  const dismissDrawer = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    const context = getContext(currentIndexRef.current);
    if (context) analytics.trackDismissed(context);
    handleCloseDialog();
  }, [analytics, getContext, handleCloseDialog]);

  const completeDrawer = useCallback(() => {
    isClosingRef.current = true;
    handleCloseDialog();
  }, [handleCloseDialog]);

  const onSlideChange = useCallback(
    (index: number) => {
      currentIndexRef.current = index;
      const context = getContext(index);
      if (context) analytics.trackStepNavigation(context);
    },
    [analytics, getContext],
  );

  const onContinueClick = useCallback(
    (slideIndex: number, isLastSlide: boolean) => {
      currentIndexRef.current = slideIndex;
      const context = getContext(slideIndex);
      if (!context) return;

      if (isLastSlide) {
        analytics.trackCompleted(context);
        return;
      }

      analytics.trackContinueClick(context);
    },
    [analytics, getContext],
  );

  const openDrawer = useCallback(() => {
    isClosingRef.current = false;
    currentIndexRef.current = 0;
    setIsDialogOpen(true);
  }, []);

  useEffect(() => {
    if (!isDialogOpen) {
      hasTrackedOpenRef.current = false;
      return;
    }
    if (hasTrackedOpenRef.current) return;

    hasTrackedOpenRef.current = true;
    currentIndexRef.current = 0;
    const context = getContext(0);
    if (context) analytics.trackInitialStep(context);
  }, [analytics, getContext, isDialogOpen]);

  useEffect(() => {
    if (shouldAutoOpen && isTourEnabled && !hasSeenTour) openDrawer();
  }, [hasSeenTour, isTourEnabled, openDrawer, shouldAutoOpen]);

  const handleOpenDialog = useCallback(() => {
    if (!isTourEnabled || hasSeenTour) return;
    openDrawer();
  }, [hasSeenTour, isTourEnabled, openDrawer]);

  return {
    isDialogOpen,
    hasSeenTour,
    handleOpenDialog,
    handleCloseDialog,
    closeDrawer,
    dismissDrawer,
    completeDrawer,
    onSlideChange,
    onContinueClick,
  };
};

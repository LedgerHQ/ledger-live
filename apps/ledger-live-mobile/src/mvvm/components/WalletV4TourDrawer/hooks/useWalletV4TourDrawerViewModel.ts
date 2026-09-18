import { useState, useCallback, useRef, useEffect } from "react";
import { track } from "~/analytics";
import { withOptionalVariant, type WalletV4TourAnalytics } from "../analytics";
import type { WalletV4TourDrawerViewModel } from "../types";

type CloseSource = "cross" | "external" | "internal";

type UseWalletV4TourDrawerViewModelParams = {
  readonly isTourEnabled: boolean;
  readonly hasSeenTour: boolean;
  readonly markTourAsSeen: () => void;
  readonly page: string;
  readonly variant?: string;
  readonly analytics?: WalletV4TourAnalytics;
  readonly getStepName?: (slideIndex: number) => string;
};

export const useWalletV4TourDrawerViewModel = ({
  isTourEnabled,
  hasSeenTour,
  markTourAsSeen,
  page,
  variant,
  analytics,
  getStepName,
}: UseWalletV4TourDrawerViewModelParams): WalletV4TourDrawerViewModel => {
  const currentIndexRef = useRef(0);
  const isClosingRef = useRef(false);
  const closeSourceRef = useRef<CloseSource>("external");
  const hasAutoOpenedRef = useRef(false);
  const hasTrackedOpenRef = useRef(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(isTourEnabled && !hasSeenTour);

  const getContext = useCallback(
    (slideIndex: number) => {
      if (!analytics || !getStepName) {
        return undefined;
      }
      return analytics.getContext(slideIndex, getStepName(slideIndex));
    },
    [analytics, getStepName],
  );

  const handleOpenDrawer = useCallback(() => {
    if (isTourEnabled && !hasSeenTour) {
      isClosingRef.current = false;
      closeSourceRef.current = "external";
      currentIndexRef.current = 0;
      hasTrackedOpenRef.current = false;
      setIsDrawerOpen(true);
    }
  }, [isTourEnabled, hasSeenTour]);

  useEffect(() => {
    if (hasAutoOpenedRef.current) {
      return;
    }
    if (isTourEnabled && !hasSeenTour) {
      hasAutoOpenedRef.current = true;
      if (!isDrawerOpen) {
        handleOpenDrawer();
      }
    }
  }, [handleOpenDrawer, hasSeenTour, isDrawerOpen, isTourEnabled]);

  const handleCloseDrawer = useCallback(() => {
    isClosingRef.current = true;
    setIsDrawerOpen(false);
    if (!hasSeenTour) {
      markTourAsSeen();
    }
  }, [markTourAsSeen, hasSeenTour]);

  const closeDrawer = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }
    if (analytics) {
      const context = getContext(currentIndexRef.current);
      if (context) analytics.trackCloseClick(context);
    } else {
      track(
        "button_clicked",
        withOptionalVariant(
          {
            button: "Close",
            page,
            card: currentIndexRef.current + 1,
          },
          variant,
        ),
      );
    }
    handleCloseDrawer();
  }, [analytics, getContext, handleCloseDrawer, page, variant]);

  const onHeaderClosePressed = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }
    closeSourceRef.current = "cross";
    const context = getContext(currentIndexRef.current);
    if (context) analytics?.trackCloseClick(context);
    handleCloseDrawer();
  }, [analytics, getContext, handleCloseDrawer]);

  const dismissDrawer = useCallback(() => {
    if (closeSourceRef.current !== "external") {
      closeSourceRef.current = "external";
      handleCloseDrawer();
      return;
    }

    const context = getContext(currentIndexRef.current);
    if (context) analytics?.trackDismissed(context);
    handleCloseDrawer();
  }, [analytics, getContext, handleCloseDrawer]);

  const onContinueClick = useCallback(
    (slideIndex: number, isLastSlide: boolean) => {
      currentIndexRef.current = slideIndex;
      const context = getContext(slideIndex);
      if (!context || !analytics) {
        return;
      }

      if (isLastSlide) {
        closeSourceRef.current = "internal";
        analytics.trackCompleted(context);
        return;
      }

      analytics.trackContinueClick(context);
    },
    [analytics, getContext],
  );

  const onSlideChange = useCallback(
    (index: number) => {
      currentIndexRef.current = index;
      if (analytics) {
        const context = getContext(index);
        if (context) analytics.trackStepNavigation(context);
        return;
      }
      track(
        "product_tour_card",
        withOptionalVariant(
          {
            page,
            card: index + 1,
          },
          variant,
        ),
      );
    },
    [analytics, getContext, page, variant],
  );

  useEffect(() => {
    if (!analytics) {
      return;
    }
    if (!isDrawerOpen) {
      hasTrackedOpenRef.current = false;
      return;
    }
    if (hasTrackedOpenRef.current) {
      return;
    }
    hasTrackedOpenRef.current = true;
    currentIndexRef.current = 0;
    const context = getContext(0);
    if (context) analytics.trackInitialStep(context);
  }, [analytics, getContext, isDrawerOpen]);

  return {
    isDrawerOpen,
    handleOpenDrawer,
    handleCloseDrawer,
    closeDrawer,
    onSlideChange,
    ...(analytics
      ? {
          onHeaderClosePressed,
          dismissDrawer,
          onContinueClick,
        }
      : {}),
  };
};

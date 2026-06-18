import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import {
  hasCompletedOnboardingSelector,
  hasSeenQ2TourSelector,
} from "~/renderer/reducers/settings";
import { setHasSeenQ2Tour } from "~/renderer/actions/settings";
import {
  getQ2TourAnalyticsContext,
  trackQ2TourCloseClick,
  trackQ2TourContinueClick,
  trackQ2TourDismissed,
  trackQ2TourCompleted,
  trackQ2TourInitialStep,
  trackQ2TourStepNavigation,
} from "../../analytics/q2TourCarouselAnalytics";
import { Q2_TOUR_SLIDES } from "../const";

export interface UseQ2TourDrawerViewModelOptions {
  /** When true and Q2 tour is enabled and not yet seen, the dialog will auto-open (e.g. on Portfolio page). */
  isOnPortfolioPage?: boolean;
}

export interface Q2TourDrawerViewModel {
  readonly isDialogOpen: boolean;
  readonly hasSeenTour: boolean;
  readonly handleOpenDialog: () => void;
  readonly handleCloseDialog: () => void;
  readonly closeDrawer: () => void;
  readonly dismissDrawer: () => void;
  readonly completeDrawer: () => void;
  readonly onSlideChange: (index: number) => void;
  readonly onContinueClick: (slideIndex: number, isLastSlide: boolean) => void;
}

export const useQ2TourDrawerViewModel = (
  options: UseQ2TourDrawerViewModelOptions = {},
): Q2TourDrawerViewModel => {
  const { isOnPortfolioPage = false } = options;
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const currentIndexRef = useRef(0);
  const isClosingRef = useRef(false);
  const hasTrackedOpenRef = useRef(false);

  const hasSeenTour = useSelector(hasSeenQ2TourSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const { shouldDisplayQ2Tour } = useWalletFeaturesConfig("desktop");

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getContext = useCallback(
    (slideIndex: number) => {
      const slide = Q2_TOUR_SLIDES[slideIndex];
      if (!slide) {
        return undefined;
      }
      return getQ2TourAnalyticsContext(slideIndex, t(slide.titleKey));
    },
    [t],
  );

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    dispatch(setHasSeenQ2Tour(true));
  }, [dispatch]);

  const closeDrawer = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    const context = getContext(currentIndexRef.current);
    if (context) {
      trackQ2TourCloseClick(context);
    }
    handleCloseDialog();
  }, [getContext, handleCloseDialog]);

  const dismissDrawer = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    const context = getContext(currentIndexRef.current);
    if (context) {
      trackQ2TourDismissed(context);
    }
    handleCloseDialog();
  }, [getContext, handleCloseDialog]);

  const completeDrawer = useCallback(() => {
    isClosingRef.current = true;
    handleCloseDialog();
  }, [handleCloseDialog]);

  const onSlideChange = useCallback(
    (index: number) => {
      currentIndexRef.current = index;
      const context = getContext(index);
      if (context) {
        trackQ2TourStepNavigation(context);
      }
    },
    [getContext],
  );

  const onContinueClick = useCallback(
    (slideIndex: number, isLastSlide: boolean) => {
      currentIndexRef.current = slideIndex;
      const context = getContext(slideIndex);
      if (!context) {
        return;
      }

      if (isLastSlide) {
        trackQ2TourCompleted(context);
        return;
      }

      trackQ2TourContinueClick(context);
    },
    [getContext],
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

    if (hasTrackedOpenRef.current) {
      return;
    }

    hasTrackedOpenRef.current = true;
    currentIndexRef.current = 0;
    const context = getContext(0);
    if (context) {
      trackQ2TourInitialStep(context);
    }
  }, [getContext, isDialogOpen]);

  useEffect(() => {
    if (isOnPortfolioPage && shouldDisplayQ2Tour && hasCompletedOnboarding && !hasSeenTour) {
      openDrawer();
    }
  }, [isOnPortfolioPage, shouldDisplayQ2Tour, hasCompletedOnboarding, hasSeenTour, openDrawer]);

  const handleOpenDialog = useCallback(() => {
    if (!shouldDisplayQ2Tour || hasSeenTour) return;
    openDrawer();
  }, [shouldDisplayQ2Tour, hasSeenTour, openDrawer]);

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

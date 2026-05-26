import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "LLD/hooks/redux";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalCarousel,
  type GenericAwarenessModalCarouselSlide,
  type GenericAwarenessModalContentCard,
} from "@ledgerhq/live-common/genericAwarenessModal";
import { openURL } from "~/renderer/linking";
import { closeGenericAwarenessModalDialog } from "../genericAwarenessModalDialog";
import {
  getCarouselAnalyticsContext,
  trackCarouselCloseClick,
  trackCarouselContinueClick,
  trackCarouselDismissed,
  trackCarouselInitialStep,
  trackCarouselPrimaryClick,
  trackCarouselStepNavigation,
  trackCarouselTourCompleted,
} from "../analytics/carouselAnalytics";
import type { AwarenessModalDismissMethod } from "../analytics/const";

export interface GenericAwarenessModalCarouselAnalyticsHandlers {
  readonly onSlideChange: (index: number) => void;
  readonly onSlidePrimaryClick: (slide: GenericAwarenessModalCarouselSlide) => void;
  readonly onContinueClick: (slideIndex: number, isLastSlide: boolean) => void;
  readonly onHeaderClose: () => void;
  readonly onDismiss: (dismissMethod: AwarenessModalDismissMethod) => void;
  readonly onClose: () => void;
}

const useGenericAwarenessModalCarouselAnalytics = (
  contentCard: GenericAwarenessModalContentCard | undefined,
  isOpen: boolean,
): GenericAwarenessModalCarouselAnalyticsHandlers => {
  const dispatch = useDispatch();
  const currentIndexRef = useRef(0);
  const hasTrackedOpenRef = useRef(false);

  const carousel: GenericAwarenessModalCarousel | undefined =
    contentCard?.layout === GenericAwarenessModalLayout.Carousel ? contentCard : undefined;

  const closeDialog = useCallback(() => {
    dispatch(closeGenericAwarenessModalDialog());
  }, [dispatch]);

  const getContext = useCallback(
    (slideIndex: number) => {
      if (!carousel) {
        return undefined;
      }
      return getCarouselAnalyticsContext(carousel, slideIndex);
    },
    [carousel],
  );

  useEffect(() => {
    if (!isOpen || !carousel) {
      hasTrackedOpenRef.current = false;
      return;
    }

    if (hasTrackedOpenRef.current) {
      return;
    }

    hasTrackedOpenRef.current = true;
    currentIndexRef.current = 0;
    trackCarouselInitialStep(carousel);
  }, [carousel, isOpen]);

  const onSlideChange = useCallback(
    (index: number) => {
      currentIndexRef.current = index;
      if (!carousel) {
        return;
      }
      trackCarouselStepNavigation(carousel, index);
    },
    [carousel],
  );

  const onSlidePrimaryClick = useCallback(
    (slide: GenericAwarenessModalCarouselSlide) => {
      const context = getContext(currentIndexRef.current);
      if (context) {
        trackCarouselPrimaryClick(context, slide.primaryButtonLabel);
      }
      openURL(slide.primaryButtonLink);
      closeDialog();
    },
    [closeDialog, getContext],
  );

  const onContinueClick = useCallback(
    (slideIndex: number, isLastSlide: boolean) => {
      currentIndexRef.current = slideIndex;
      const context = getContext(slideIndex);
      if (!context) {
        return;
      }

      trackCarouselContinueClick(context);
      if (isLastSlide) {
        trackCarouselTourCompleted(context);
      }
    },
    [getContext],
  );

  const onHeaderClose = useCallback(() => {
    const context = getContext(currentIndexRef.current);
    if (context) {
      trackCarouselCloseClick(context);
    }
    closeDialog();
  }, [closeDialog, getContext]);

  const onDismiss = useCallback(
    (dismissMethod: AwarenessModalDismissMethod) => {
      const context = getContext(currentIndexRef.current);
      if (context) {
        trackCarouselDismissed(context, dismissMethod);
      }
      closeDialog();
    },
    [closeDialog, getContext],
  );

  return {
    onSlideChange,
    onSlidePrimaryClick,
    onContinueClick,
    onHeaderClose,
    onDismiss,
    onClose: closeDialog,
  };
};

export default useGenericAwarenessModalCarouselAnalytics;

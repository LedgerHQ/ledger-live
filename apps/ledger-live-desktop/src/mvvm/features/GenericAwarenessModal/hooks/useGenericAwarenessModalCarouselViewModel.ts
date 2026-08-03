import { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch } from "LLD/hooks/redux";
import {
  GenericAwarenessModalLayout,
  resolveAwarenessModalActionLink,
  type GenericAwarenessModalCarousel,
  type GenericAwarenessModalCarouselSlide,
  type GenericAwarenessModalContentCard,
} from "@ledgerhq/live-common/genericAwarenessModal";
import { openURL } from "~/renderer/linking";
import {
  closeGenericAwarenessModalDialog,
  type CloseGenericAwarenessModalDialogOptions,
} from "../genericAwarenessModalDialog";
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
export interface GenericAwarenessModalCarouselViewModel {
  slides: GenericAwarenessModalCarouselSlide[];
  onSlidePrimaryClick: (slide: GenericAwarenessModalCarouselSlide) => void;
  onSlideChange: (index: number) => void;
  onContinueClick: (slideIndex: number, isLastSlide: boolean) => void;
  onHeaderClose: () => void;
  onDismiss: () => void;
  onCompleteClose: () => void;
}

const useGenericAwarenessModalCarouselViewModel = (
  contentCard: GenericAwarenessModalContentCard | undefined,
  isOpen: boolean,
  logClick: () => void,
  logDismiss: () => void,
): GenericAwarenessModalCarouselViewModel => {
  const dispatch = useDispatch();
  const currentIndexRef = useRef(0);
  const hasTrackedOpenRef = useRef(false);

  const carousel: GenericAwarenessModalCarousel | undefined =
    contentCard?.layout === GenericAwarenessModalLayout.Carousel ? contentCard : undefined;

  const closeDialog = useCallback(
    (options?: CloseGenericAwarenessModalDialogOptions) => {
      dispatch(closeGenericAwarenessModalDialog(options));
    },
    [dispatch],
  );

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
        trackCarouselPrimaryClick(context, slide.primaryButtonLabel, slide.primaryButtonLink);
      }
      const actionLink = resolveAwarenessModalActionLink(slide.primaryButtonLink);
      if (actionLink) {
        openURL(actionLink);
      }
      logClick();
      closeDialog({ dismissAppStart: true });
    },
    [closeDialog, getContext, logClick],
  );

  const onContinueClick = useCallback(
    (slideIndex: number, isLastSlide: boolean) => {
      currentIndexRef.current = slideIndex;
      const context = getContext(slideIndex);
      if (!context) {
        return;
      }

      if (isLastSlide) {
        trackCarouselTourCompleted(context);
        return;
      }

      trackCarouselContinueClick(context);
    },
    [getContext],
  );

  const onHeaderClose = useCallback(() => {
    const context = getContext(currentIndexRef.current);
    if (context) {
      trackCarouselCloseClick(context);
    }
    logDismiss();
    closeDialog({ dismissAppStart: true });
  }, [closeDialog, getContext, logDismiss]);

  const onDismiss = useCallback(() => {
    const context = getContext(currentIndexRef.current);
    if (context) {
      trackCarouselDismissed(context);
    }
    logDismiss();
    closeDialog({ dismissAppStart: true });
  }, [closeDialog, getContext, logDismiss]);

  const onCompleteClose = useCallback(() => {
    logDismiss();
    closeDialog({ dismissAppStart: true });
  }, [closeDialog, logDismiss]);

  return useMemo(
    () => ({
      slides: carousel?.data ?? [],
      onSlidePrimaryClick,
      onSlideChange,
      onContinueClick,
      onHeaderClose,
      onDismiss,
      onCompleteClose,
    }),
    [
      carousel?.data,
      onCompleteClose,
      onContinueClick,
      onDismiss,
      onHeaderClose,
      onSlideChange,
      onSlidePrimaryClick,
    ],
  );
};

export default useGenericAwarenessModalCarouselViewModel;

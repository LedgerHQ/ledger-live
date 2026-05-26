import { useMemo } from "react";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalCarouselSlide,
  type GenericAwarenessModalContentCard,
} from "@ledgerhq/live-common/genericAwarenessModal";
import type { AwarenessModalDismissMethod } from "../analytics/const";
import useGenericAwarenessModalCarouselAnalytics from "./useGenericAwarenessModalCarouselAnalytics";

export interface GenericAwarenessModalCarouselViewModel {
  slides: GenericAwarenessModalCarouselSlide[];
  onSlidePrimaryClick: (slide: GenericAwarenessModalCarouselSlide) => void;
  onSlideChange: (index: number) => void;
  onContinueClick: (slideIndex: number, isLastSlide: boolean) => void;
  onHeaderClose: () => void;
  onDismiss: (dismissMethod: AwarenessModalDismissMethod) => void;
  onClose: () => void;
}

const useGenericAwarenessModalCarouselViewModel = (
  contentCard: GenericAwarenessModalContentCard | undefined,
  isOpen: boolean,
): GenericAwarenessModalCarouselViewModel => {
  const carousel =
    contentCard?.layout === GenericAwarenessModalLayout.Carousel ? contentCard : undefined;

  const analytics = useGenericAwarenessModalCarouselAnalytics(contentCard, isOpen);

  return useMemo(
    () => ({
      slides: carousel?.data ?? [],
      onSlidePrimaryClick: analytics.onSlidePrimaryClick,
      onSlideChange: analytics.onSlideChange,
      onContinueClick: analytics.onContinueClick,
      onHeaderClose: analytics.onHeaderClose,
      onDismiss: analytics.onDismiss,
      onClose: analytics.onClose,
    }),
    [analytics, carousel?.data],
  );
};

export default useGenericAwarenessModalCarouselViewModel;

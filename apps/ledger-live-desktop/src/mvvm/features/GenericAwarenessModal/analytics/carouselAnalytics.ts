import type { GenericAwarenessModalCarousel } from "@ledgerhq/live-common/genericAwarenessModal";
import { track, trackPage } from "~/renderer/analytics/segment";
import {
  CAROUSEL_NAVIGATION_METHOD,
  PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL,
  type AwarenessModalDismissMethod,
} from "./const";

export type CarouselAnalyticsContext = {
  readonly page: typeof PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL;
  readonly contentId: string;
  readonly step: number;
  readonly totalSteps: number;
};

export const normalizeCarouselButtonName = (label: string): string => label.trim().toLowerCase();

export const getCarouselAnalyticsContext = (
  carousel: GenericAwarenessModalCarousel,
  slideIndex: number,
): CarouselAnalyticsContext => ({
  page: PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL,
  contentId: carousel.id,
  step: slideIndex + 1,
  totalSteps: carousel.data.length,
});

const getCarouselPageProperties = (
  context: CarouselAnalyticsContext,
  navigationMethod: string,
) => ({
  name: PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL,
  contentId: context.contentId,
  step: context.step,
  totalSteps: context.totalSteps,
  navigationMethod,
});

const getCarouselInteractionProperties = (context: CarouselAnalyticsContext) => ({
  page: context.page,
  contentId: context.contentId,
  step: context.step,
  totalSteps: context.totalSteps,
});

export const trackCarouselStepPage = (
  context: CarouselAnalyticsContext,
  navigationMethod: string,
): void => {
  trackPage(
    PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL,
    undefined,
    getCarouselPageProperties(context, navigationMethod),
    true,
    false,
  );
};

export const trackCarouselContinueClick = (context: CarouselAnalyticsContext): void => {
  track("button_clicked", {
    button: "continue",
    ...getCarouselInteractionProperties(context),
    ctaPosition: "secondary",
  });
};

export const trackCarouselPrimaryClick = (
  context: CarouselAnalyticsContext,
  buttonLabel: string,
): void => {
  track("button_clicked", {
    button: normalizeCarouselButtonName(buttonLabel),
    ...getCarouselInteractionProperties(context),
    ctaPosition: "primary",
  });
};

export const trackCarouselCloseClick = (context: CarouselAnalyticsContext): void => {
  track("button_clicked", {
    button: "close",
    ...getCarouselInteractionProperties(context),
  });
};

export const trackCarouselDismissed = (
  context: CarouselAnalyticsContext,
  dismissMethod: AwarenessModalDismissMethod,
): void => {
  track("drawer_dismissed", {
    drawer: PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL,
    page: context.page,
    contentId: context.contentId,
    step: context.step,
    totalSteps: context.totalSteps,
    dismissMethod,
  });
};

export const trackCarouselTourCompleted = (context: CarouselAnalyticsContext): void => {
  track("tour_completed", {
    ...getCarouselInteractionProperties(context),
    completed: "yes",
  });
};

export const trackCarouselInitialStep = (carousel: GenericAwarenessModalCarousel): void => {
  trackCarouselStepPage(
    getCarouselAnalyticsContext(carousel, 0),
    CAROUSEL_NAVIGATION_METHOD.initial,
  );
};

export const trackCarouselStepNavigation = (
  carousel: GenericAwarenessModalCarousel,
  slideIndex: number,
): void => {
  trackCarouselStepPage(
    getCarouselAnalyticsContext(carousel, slideIndex),
    CAROUSEL_NAVIGATION_METHOD.nextButton,
  );
};

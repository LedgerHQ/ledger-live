import type { GenericAwarenessModalCarousel } from "@ledgerhq/live-common/genericAwarenessModal";
import { track, trackPage } from "~/renderer/analytics/segment";
import { PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL } from "./const";

type CarouselAnalyticsContext = {
  readonly page: typeof PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL;
  readonly contentId: string;
  readonly step: number;
  readonly stepName: string;
  readonly totalSteps: number;
};

const normalizeCarouselButtonName = (label: string): string => label.trim().toLowerCase();

export const getCarouselAnalyticsContext = (
  carousel: GenericAwarenessModalCarousel,
  slideIndex: number,
): CarouselAnalyticsContext => ({
  page: PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL,
  contentId: carousel.id,
  step: slideIndex + 1,
  stepName: carousel.data[slideIndex]?.title ?? "",
  totalSteps: carousel.data.length,
});

const getCarouselPageProperties = (context: CarouselAnalyticsContext) => ({
  name: PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL,
  contentId: context.contentId,
  step: context.step,
  stepName: context.stepName,
  totalSteps: context.totalSteps,
});

const getCarouselInteractionProperties = (context: CarouselAnalyticsContext) => ({
  page: context.page,
  contentId: context.contentId,
  step: context.step,
  stepName: context.stepName,
  totalSteps: context.totalSteps,
});

const trackCarouselStepPage = (context: CarouselAnalyticsContext): void => {
  trackPage(
    PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL,
    undefined,
    getCarouselPageProperties(context),
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
  link: string,
): void => {
  track("button_clicked", {
    button: normalizeCarouselButtonName(buttonLabel),
    ...getCarouselInteractionProperties(context),
    ctaPosition: "primary",
    link,
  });
};

export const trackCarouselCloseClick = (context: CarouselAnalyticsContext): void => {
  track("button_clicked", {
    button: "close",
    ...getCarouselInteractionProperties(context),
  });
};

export const trackCarouselDismissed = (context: CarouselAnalyticsContext): void => {
  track("drawer_dismissed", {
    drawer: PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL,
    page: context.page,
    contentId: context.contentId,
    step: context.step,
    stepName: context.stepName,
    totalSteps: context.totalSteps,
  });
};

export const trackCarouselTourCompleted = (context: CarouselAnalyticsContext): void => {
  track("tour_completed", getCarouselInteractionProperties(context));
};

export const trackCarouselInitialStep = (carousel: GenericAwarenessModalCarousel): void => {
  trackCarouselStepPage(getCarouselAnalyticsContext(carousel, 0));
};

export const trackCarouselStepNavigation = (
  carousel: GenericAwarenessModalCarousel,
  slideIndex: number,
): void => {
  trackCarouselStepPage(getCarouselAnalyticsContext(carousel, slideIndex));
};

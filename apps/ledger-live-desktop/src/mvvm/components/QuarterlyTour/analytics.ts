import { track, trackPage } from "~/renderer/analytics/segment";
import type { QuarterlyTourAnalytics, QuarterlyTourAnalyticsContext } from "./types";

type CreateQuarterlyTourAnalyticsParams = {
  readonly page: string;
  readonly contentId: string;
  readonly totalSteps: number;
};

export const createQuarterlyTourAnalytics = ({
  page,
  contentId,
  totalSteps,
}: CreateQuarterlyTourAnalyticsParams): QuarterlyTourAnalytics => {
  const getContext = (slideIndex: number, stepName: string): QuarterlyTourAnalyticsContext => ({
    page,
    contentId,
    step: slideIndex + 1,
    stepName,
    totalSteps,
  });

  const getPageProperties = (context: QuarterlyTourAnalyticsContext) => ({
    name: page,
    contentId: context.contentId,
    step: context.step,
    stepName: context.stepName,
    totalSteps: context.totalSteps,
  });

  const getInteractionProperties = (context: QuarterlyTourAnalyticsContext) => ({
    page: context.page,
    contentId: context.contentId,
    step: context.step,
    stepName: context.stepName,
    totalSteps: context.totalSteps,
  });

  const trackStepPage = (context: QuarterlyTourAnalyticsContext): void => {
    trackPage(page, undefined, getPageProperties(context), true, false);
  };

  return {
    getContext,
    trackContinueClick: context => {
      track("button_clicked", {
        button: "continue",
        ...getInteractionProperties(context),
        ctaPosition: "secondary",
      });
    },
    trackCloseClick: context => {
      track("button_clicked", {
        button: "close",
        ...getInteractionProperties(context),
      });
    },
    trackDismissed: context => {
      track("drawer_dismissed", {
        drawer: page,
        ...getInteractionProperties(context),
      });
    },
    trackCompleted: context => {
      track("tour_completed", getInteractionProperties(context));
    },
    trackInitialStep: trackStepPage,
    trackStepNavigation: trackStepPage,
  };
};

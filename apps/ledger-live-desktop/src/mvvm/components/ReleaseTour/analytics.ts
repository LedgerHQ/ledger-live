import { track, trackPage } from "~/renderer/analytics/segment";
import type { ReleaseTourAnalytics, ReleaseTourAnalyticsContext } from "./types";

type CreateReleaseTourAnalyticsParams = {
  readonly page: string;
  readonly contentId: string;
  readonly totalSteps: number;
};

export const createReleaseTourAnalytics = ({
  page,
  contentId,
  totalSteps,
}: CreateReleaseTourAnalyticsParams): ReleaseTourAnalytics => {
  const getContext = (slideIndex: number, stepName: string): ReleaseTourAnalyticsContext => ({
    page,
    contentId,
    step: slideIndex + 1,
    stepName,
    totalSteps,
  });

  const getPageProperties = (context: ReleaseTourAnalyticsContext) => ({
    name: page,
    contentId: context.contentId,
    step: context.step,
    stepName: context.stepName,
    totalSteps: context.totalSteps,
  });

  const getInteractionProperties = (context: ReleaseTourAnalyticsContext) => ({
    page: context.page,
    contentId: context.contentId,
    step: context.step,
    stepName: context.stepName,
    totalSteps: context.totalSteps,
  });

  const trackStepPage = (context: ReleaseTourAnalyticsContext): void => {
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

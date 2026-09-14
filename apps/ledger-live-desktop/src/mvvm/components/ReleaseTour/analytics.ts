import { track, trackPage } from "~/renderer/analytics/segment";
import type { ReleaseTourAnalytics, ReleaseTourAnalyticsContext } from "./types";

type CreateReleaseTourAnalyticsParams = {
  readonly page: string;
  readonly contentId: string;
  readonly totalSteps: number;
  readonly variant?: string;
};

const withVariant = <T extends object>(properties: T, variant?: string) =>
  variant === undefined ? properties : { ...properties, variant };

export const createReleaseTourAnalytics = ({
  page,
  contentId,
  totalSteps,
  variant,
}: CreateReleaseTourAnalyticsParams): ReleaseTourAnalytics => {
  const getContext = (slideIndex: number, stepName: string): ReleaseTourAnalyticsContext =>
    withVariant(
      {
        page,
        contentId,
        step: slideIndex + 1,
        stepName,
        totalSteps,
      },
      variant,
    );

  const getPageProperties = (context: ReleaseTourAnalyticsContext) =>
    withVariant(
      {
        name: page,
        contentId: context.contentId,
        step: context.step,
        stepName: context.stepName,
        totalSteps: context.totalSteps,
      },
      context.variant,
    );

  const getInteractionProperties = (context: ReleaseTourAnalyticsContext) =>
    withVariant(
      {
        page: context.page,
        contentId: context.contentId,
        step: context.step,
        stepName: context.stepName,
        totalSteps: context.totalSteps,
      },
      context.variant,
    );

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

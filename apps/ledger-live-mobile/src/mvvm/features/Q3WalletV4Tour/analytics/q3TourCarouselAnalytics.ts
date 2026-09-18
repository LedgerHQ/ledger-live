import { screen, track } from "~/analytics";
import type {
  WalletV4TourAnalytics,
  WalletV4TourAnalyticsContext,
} from "LLM/components/WalletV4TourDrawer";
import type { Q3TourVariant } from "../Drawer/const";
import { PAGE_TRACKING_Q3_WALLET_V4_TOUR, Q3_TOUR_CONTENT_ID } from "./const";

type CtaPosition = "primary" | "secondary";

const withVariant = <T extends object>(properties: T, variant?: string) =>
  variant === undefined ? properties : { ...properties, variant };

export const createQ3WalletV4TourAnalytics = (
  totalSteps: number,
  variant: Q3TourVariant,
): WalletV4TourAnalytics => {
  const page = PAGE_TRACKING_Q3_WALLET_V4_TOUR;
  const ctaPosition: CtaPosition = "primary";

  const getContext = (slideIndex: number, stepName: string): WalletV4TourAnalyticsContext =>
    withVariant(
      {
        page,
        contentId: Q3_TOUR_CONTENT_ID,
        step: slideIndex + 1,
        stepName,
        totalSteps,
      },
      variant,
    );

  const getPageProperties = (context: WalletV4TourAnalyticsContext) =>
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

  const getInteractionProperties = (context: WalletV4TourAnalyticsContext) =>
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

  const trackStepPage = (context: WalletV4TourAnalyticsContext): void => {
    screen(page, undefined, getPageProperties(context), true, false);
  };

  const trackContinueClick = (context: WalletV4TourAnalyticsContext): void => {
    track("button_clicked", {
      button: "continue",
      ...getInteractionProperties(context),
      ctaPosition,
    });
  };

  return {
    getContext,
    trackContinueClick,
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
      trackContinueClick(context);
      track("tour_completed", getInteractionProperties(context));
    },
    trackInitialStep: trackStepPage,
    trackStepNavigation: trackStepPage,
  };
};

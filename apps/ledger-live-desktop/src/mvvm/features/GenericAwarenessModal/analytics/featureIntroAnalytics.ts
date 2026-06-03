import type { GenericAwarenessModalFeatureIntro } from "@ledgerhq/live-common/genericAwarenessModal";
import { track, trackPage } from "~/renderer/analytics/segment";
import { PAGE_TRACKING_AWARENESS_MODAL_FEATURE_INTRO } from "./const";

type FeatureIntroAnalyticsContext = {
  readonly page: typeof PAGE_TRACKING_AWARENESS_MODAL_FEATURE_INTRO;
  readonly contentId: string;
};

const normalizeFeatureIntroButtonName = (label: string): string => label.trim().toLowerCase();

export const getFeatureIntroAnalyticsContext = (
  featureIntro: GenericAwarenessModalFeatureIntro,
): FeatureIntroAnalyticsContext => ({
  page: PAGE_TRACKING_AWARENESS_MODAL_FEATURE_INTRO,
  contentId: featureIntro.id,
});

const getFeatureIntroPageProperties = (context: FeatureIntroAnalyticsContext) => ({
  name: PAGE_TRACKING_AWARENESS_MODAL_FEATURE_INTRO,
  contentId: context.contentId,
});

const getFeatureIntroInteractionProperties = (context: FeatureIntroAnalyticsContext) => ({
  page: context.page,
  contentId: context.contentId,
});

export const trackFeatureIntroPage = (featureIntro: GenericAwarenessModalFeatureIntro): void => {
  const context = getFeatureIntroAnalyticsContext(featureIntro);
  trackPage(
    PAGE_TRACKING_AWARENESS_MODAL_FEATURE_INTRO,
    undefined,
    getFeatureIntroPageProperties(context),
    true,
    false,
  );
};

export const trackFeatureIntroPrimaryClick = (
  context: FeatureIntroAnalyticsContext,
  buttonLabel: string,
  link: string,
): void => {
  track("button_clicked", {
    button: normalizeFeatureIntroButtonName(buttonLabel),
    ...getFeatureIntroInteractionProperties(context),
    ctaPosition: "primary",
    link,
  });
};

export const trackFeatureIntroSecondaryClick = (
  context: FeatureIntroAnalyticsContext,
  buttonLabel: string,
  link: string,
): void => {
  track("button_clicked", {
    button: normalizeFeatureIntroButtonName(buttonLabel),
    ...getFeatureIntroInteractionProperties(context),
    ctaPosition: "secondary",
    link,
  });
};

export const trackFeatureIntroCloseClick = (context: FeatureIntroAnalyticsContext): void => {
  track("button_clicked", {
    button: "close",
    ...getFeatureIntroInteractionProperties(context),
  });
};

export const trackFeatureIntroDismissed = (context: FeatureIntroAnalyticsContext): void => {
  track("drawer_dismissed", {
    drawer: PAGE_TRACKING_AWARENESS_MODAL_FEATURE_INTRO,
    page: context.page,
    contentId: context.contentId,
  });
};

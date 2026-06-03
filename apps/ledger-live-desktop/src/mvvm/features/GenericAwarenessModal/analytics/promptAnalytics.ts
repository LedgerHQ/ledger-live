import type { GenericAwarenessModalPrompt } from "@ledgerhq/live-common/genericAwarenessModal";
import { track, trackPage } from "~/renderer/analytics/segment";
import { PAGE_TRACKING_AWARENESS_MODAL_PROMPT } from "./const";

type PromptAnalyticsContext = {
  readonly page: typeof PAGE_TRACKING_AWARENESS_MODAL_PROMPT;
  readonly contentId: string;
};

const normalizePromptButtonName = (label: string): string => label.trim().toLowerCase();

export const getPromptAnalyticsContext = (
  prompt: GenericAwarenessModalPrompt,
): PromptAnalyticsContext => ({
  page: PAGE_TRACKING_AWARENESS_MODAL_PROMPT,
  contentId: prompt.id,
});

const getPromptPageProperties = (context: PromptAnalyticsContext) => ({
  name: PAGE_TRACKING_AWARENESS_MODAL_PROMPT,
  contentId: context.contentId,
});

const getPromptInteractionProperties = (context: PromptAnalyticsContext) => ({
  page: context.page,
  contentId: context.contentId,
});

export const trackPromptPage = (prompt: GenericAwarenessModalPrompt): void => {
  const context = getPromptAnalyticsContext(prompt);
  trackPage(
    PAGE_TRACKING_AWARENESS_MODAL_PROMPT,
    undefined,
    getPromptPageProperties(context),
    true,
    false,
  );
};

export const trackPromptPrimaryClick = (
  context: PromptAnalyticsContext,
  buttonLabel: string,
  link: string,
): void => {
  track("button_clicked", {
    button: normalizePromptButtonName(buttonLabel),
    ...getPromptInteractionProperties(context),
    ctaPosition: "primary",
    link,
  });
};

export const trackPromptSecondaryClick = (
  context: PromptAnalyticsContext,
  buttonLabel: string,
  link: string,
): void => {
  track("button_clicked", {
    button: normalizePromptButtonName(buttonLabel),
    ...getPromptInteractionProperties(context),
    ctaPosition: "secondary",
    link,
  });
};

export const trackPromptCloseClick = (context: PromptAnalyticsContext): void => {
  track("button_clicked", {
    button: "close",
    ...getPromptInteractionProperties(context),
  });
};

export const trackPromptDismissed = (context: PromptAnalyticsContext): void => {
  track("drawer_dismissed", {
    drawer: PAGE_TRACKING_AWARENESS_MODAL_PROMPT,
    page: context.page,
    contentId: context.contentId,
  });
};

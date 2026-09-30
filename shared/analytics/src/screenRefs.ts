import {
  getCurrentTrackingPageValue,
  getPreviousTrackingPageValue,
  resetTrackingPageValues,
  setCurrentTrackingPage,
} from "./internals/screenRefs.internals";

/** Route names for analytics, normalized to "" when unknown. */
export const getCurrentTrackingPage = ({ fallback = "" }: { fallback?: string } = {}): string =>
  getCurrentTrackingPageValue() ?? fallback;

export const getPreviousTrackingPage = ({ fallback = "" }: { fallback?: string } = {}): string =>
  getPreviousTrackingPageValue() ?? fallback;

/** Override the page name further screen events will report as their `source`. */
export const setTrackingSource = (source?: string): void => {
  setCurrentTrackingPage(source);
};

/** Clear the current and previous tracking pages. */
export const resetTrackingPages = (): void => {
  resetTrackingPageValues();
};

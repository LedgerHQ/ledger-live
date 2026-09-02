import type { TrackingRouteRef } from "../types";

export const previousRouteNameRef: TrackingRouteRef = { current: undefined };
export const currentRouteNameRef: TrackingRouteRef = { current: undefined };

/** Route names for analytics, normalized to "" when unknown. */
export const getCurrentTrackingPage = (): string => currentRouteNameRef.current ?? "";
export const getPreviousTrackingPage = (): string => previousRouteNameRef.current ?? "";

/** Override the page name further screen events will report as their `source`. */
export const setTrackingSource = (source?: string): void => {
  currentRouteNameRef.current = source;
};

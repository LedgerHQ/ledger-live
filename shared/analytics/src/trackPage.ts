/**
 * @module analytics/trackPage
 * @description
 * This module exports the trackPage function.
 *
 * @example
 * ```ts
 * import { trackPage } from "@shared/analytics";
 *
 * trackPage({ category: "Market" });
 * trackPage(
 *   { category: "Modal send", name: "step recipient", props: { flow: "send" } },
 *   { updateRoutes: true },
 * );
 * trackPage({ category: "Mandatory Page" }, { mandatory: true });
 * ```
 */

import { normalizeProps } from "./internals/normalizeProps";
import { trackEvent } from "./internals/trackEvent";
import { isEnabled } from "./registry";
import { currentRouteNameRef, getPreviousTrackingPage, previousRouteNameRef } from "./screenRefs";
import {
  buildFullScreenName,
  buildPageEventName,
  setLastPageEventName,
  shouldSkipDuplicatePageEvent,
} from "./internals/trackPage.internals";
import type { TrackPageOptions, TrackPagePayload } from "./types";

export function trackPage(
  { category, name, props }: TrackPagePayload,
  {
    mandatory = false,
    updateRoutes = false,
    refreshSource = false,
    avoidDuplicates = false,
  }: TrackPageOptions = {},
): void | Promise<void> {
  if (!(mandatory || isEnabled())) {
    return;
  }

  const fullScreenName = buildFullScreenName(category, name);
  const eventName = buildPageEventName(fullScreenName);
  const shouldSkip = shouldSkipDuplicatePageEvent(eventName, avoidDuplicates);

  if (shouldSkip) {
    return;
  }
  setLastPageEventName(eventName);

  if (updateRoutes) {
    previousRouteNameRef.current = currentRouteNameRef.current;
    if (refreshSource) {
      currentRouteNameRef.current = fullScreenName;
    }
  }

  const normalizedProps = normalizeProps(props);
  const source = getPreviousTrackingPage();
  const eventProps = source ? { source, ...normalizedProps } : normalizedProps;

  return trackEvent({ kind: "page", eventName, props: eventProps, mandatory });
}

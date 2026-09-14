/**
 * @module analytics/trackPage
 * @description
 * This module exports the trackPage function.
 *
 * @example
 * ```ts
 * import { trackPage } from "@shared/analytics";
 *
 * trackPage("Market");
 * trackPage("Modal send", "step recipient", { flow: "send" }, { updateRoutes: true });
 * trackPage("Mandatory Page", null, null, { mandatory: true });
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
import type { Props, TrackPageOptions } from "./types";

export function trackPage(
  category?: string,
  name?: string | null,
  props?: Error | Props | null,
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

  if (shouldSkipDuplicatePageEvent(eventName, avoidDuplicates)) {
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

  return trackEvent("page", eventName, eventProps, { mandatory });
}

import {
  currentRouteNameRef,
  previousRouteNameRef,
} from "./internals/screenRefs";
import { applyPropertyFilter, getAnalytics } from "./registry";
import { isTrackingEnabled } from "./internals/enabled";
import { send } from "./internals/send";
import type { Props, TrackingRouteRef } from "./types";

const lastScreenEventName: TrackingRouteRef = { current: undefined };

export function track(
  event: string,
  properties?: Error | Props | null,
  { mandatory = false }: { mandatory?: boolean } = {}
): void | Promise<void> {
  if (!isTrackingEnabled() && !mandatory) {
    return;
  }

  const base = applyPropertyFilter({
    page: currentRouteNameRef.current,
    ...properties,
  });

  return send("track", event, base, mandatory);
}

export function trackPage(
  category: string,
  name?: string | null,
  properties?: Props | null,
  updateRoutes?: boolean,
  refreshSource?: boolean,
  { mandatory = false }: { mandatory?: boolean } = {}
): void | Promise<void> {
  const { eventName, screenName } = getScreenName(category, name);

  if (currentRouteNameRef.current !== screenName) {
    previousRouteNameRef.current = currentRouteNameRef.current;
    if (refreshSource) {
      currentRouteNameRef.current = screenName;
    }
  }

  if (!isTrackingEnabled() && !mandatory) {
    return;
  }

  const base = applyPropertyFilter({
    source: previousRouteNameRef.current ?? undefined,
    ...properties,
  });
  return send("page", eventName, base, mandatory);
}

function getScreenName(
  category?: string,
  name?: string | null
): {
  eventName: string;
  screenName: string;
} {
  const screenName =
    category && name ? `${category} ${name}` : category || name || "";

  return {
    eventName: `Page ${screenName}`,
    screenName: screenName,
  };
}

/**
 * Track an event named `Page ${category}${name ? " " + name : ""}`, where both parts are optional.
 *
 * Same route-name logic as {@link trackPage}, plus de-duplication against the last screen event.
 */
export function trackScreen(
  category?: string,
  name?: string | null,
  properties?: Props | null,
  updateRoutes?: boolean,
  refreshSource?: boolean,
  /**
   * Drop the event when the last screen event emitted was the same one. Practical in case a
   * `<TrackScreen>` gets remounted.
   */
  avoidDuplicates?: boolean,
  { mandatory = false }: { mandatory?: boolean } = {}
): void | Promise<void> {
  const { eventName, screenName: screenName } = getScreenName(category, name);

  if (avoidDuplicates && eventName === lastScreenEventName.current) return;
  lastScreenEventName.current = eventName;

  if (updateRoutes) {
    previousRouteNameRef.current = currentRouteNameRef.current;
    if (refreshSource) {
      currentRouteNameRef.current = screenName;
    }
  }

  if (!isTrackingEnabled() && !mandatory) {
    return;
  }

  const base = applyPropertyFilter({
    source: previousRouteNameRef.current ?? undefined,
    ...properties,
  });

  return send("page", eventName, base, mandatory);
}

export async function flush(): Promise<void> {
  await getAnalytics()?.flush?.();
}

export async function closeAndFlush(): Promise<void> {
  await getAnalytics()?.closeAndFlush?.();
}

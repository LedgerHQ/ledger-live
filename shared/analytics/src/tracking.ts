import { getIsTracking } from "./consent";
import { emit, isThenable } from "./internals/emit";
import { currentRouteNameRef, previousRouteNameRef } from "./internals/screenRefs";
import {
  applyPropertyFilter,
  getAnalytics,
  getAnalyticsState,
  resolveExtraProperties,
} from "./registry";
import { trackSubject } from "./trackSubject";
import type { LoggableEventProperties, Props, TrackingResult, TrackingRouteRef } from "./types";

const lastScreenEventName: TrackingRouteRef = { current: undefined };

/**
 * A blocked event is reported only when there is no store yet — a consent-off event is silent, so
 * the in-app consoles never reveal what a user who refused tracking would have sent.
 */
function reportBlocked(
  result: TrackingResult,
  eventName: string,
  eventProperties: LoggableEventProperties | undefined,
): void {
  if (result.enabled || result.reason !== "store not initialised") return;
  trackSubject.next({
    eventName,
    eventProperties,
    date: new Date(),
    deliveryStatus: "skipped_no_store",
  });
}

/**
 * Resolves the enricher without forcing a microtask when it is synchronous: desktop asserts on
 * `trackSubject` synchronously after render, mobile awaits native permission state.
 *
 * A rejecting async enricher drops the event rather than sending it half-enriched, and never
 * rejects: callers are fire-and-forget effects, so a rejection here would go unhandled.
 */
function send(
  kind: "track" | "page",
  eventName: string,
  base: Props,
  state: unknown,
  mandatory?: boolean | null,
): void | Promise<void> {
  const dispatch = (extras: Props | undefined) =>
    emit({
      kind,
      eventName,
      eventProperties: { ...base, ...extras },
      eventPropertiesWithoutExtra: base,
    });

  const extras = resolveExtraProperties(state, mandatory);
  if (!isThenable<Props>(extras)) return dispatch(extras);

  return extras.then(dispatch, () => {
    trackSubject.next({
      eventName,
      eventProperties: base,
      eventPropertiesWithoutExtra: base,
      date: new Date(),
      deliveryStatus: "failed",
    });
  });
}

export function track(
  event: string,
  properties?: Error | Props | null,
  mandatory?: boolean | null,
): void | Promise<void> {
  const state = getAnalyticsState();
  const isTracking = getIsTracking(state, mandatory);
  if (!isTracking.enabled) {
    reportBlocked(
      isTracking,
      event,
      properties instanceof Error ? undefined : (properties ?? undefined),
    );
    return;
  }

  const base = applyPropertyFilter({ page: currentRouteNameRef.current, ...properties });
  return send("track", event, base, state, mandatory);
}

/**
 * Track an event named `Page ${category}${name ? " " + name : ""}`.
 *
 * Extra logic to update the route names used in the "page" and "source" properties of further
 * events can be enabled with `updateRoutes` and `refreshSource`.
 */
export function trackPage(
  /** First part of the event name string. */
  category: string,
  /**
   * Second part of the event name string, concatenated to `category` after a whitespace if
   * defined.
   */
  name?: string | null,
  properties?: Props | null,
  /**
   * Should this call update the previous & current route names, which are used to track:
   * - the `page` property in non-page events (for instance `button_clicked` events)
   * - the `source` property in further page events
   */
  updateRoutes?: boolean,
  /**
   * Should this call update the current route name, so the full page name becomes the `source` of
   * further page events. Requires `updateRoutes`.
   */
  refreshSource?: boolean,
  /** Send the event even when standard analytics tracking is disabled. */
  mandatory?: boolean,
): void | Promise<void> {
  const fullScreenName = category + (name ? ` ${name}` : "");
  const eventName = `Page ${fullScreenName}`;

  if (updateRoutes) {
    previousRouteNameRef.current = currentRouteNameRef.current;
    if (refreshSource) {
      currentRouteNameRef.current = fullScreenName;
    }
  }

  const state = getAnalyticsState();
  const isTracking = getIsTracking(state, mandatory);
  if (!isTracking.enabled) {
    reportBlocked(isTracking, eventName, properties ?? undefined);
    return;
  }

  const base = applyPropertyFilter({
    source: previousRouteNameRef.current ?? undefined,
    ...properties,
  });
  return send("page", eventName, base, state, mandatory);
}

/**
 * Track an event named `Page ${category}${name ? " " + name : ""}`, where both parts are optional.
 *
 * Same route-name logic as {@link trackPage}, plus de-duplication against the last screen event.
 */
export function screen(
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
  mandatory?: boolean,
): void | Promise<void> {
  const fullScreenName = (category || "") + (category && name ? " " : "") + (name || "");
  const eventName = `Page ${fullScreenName}`;
  if (avoidDuplicates && eventName === lastScreenEventName.current) return;
  lastScreenEventName.current = eventName;

  if (updateRoutes) {
    previousRouteNameRef.current = currentRouteNameRef.current;
    if (refreshSource) {
      currentRouteNameRef.current = fullScreenName;
    }
  }

  const state = getAnalyticsState();
  const isTracking = getIsTracking(state, mandatory);
  if (!isTracking.enabled) {
    reportBlocked(isTracking, eventName, properties ?? undefined);
    return;
  }

  const base = applyPropertyFilter({ source: previousRouteNameRef.current, ...properties });
  return send("page", eventName, base, state, mandatory);
}

export async function flush(): Promise<void> {
  await getAnalytics()?.flush?.();
}

export async function closeAndFlush(): Promise<void> {
  await getAnalytics()?.closeAndFlush?.();
}

/**
 * @module analytics/analyticsEvents
 * @description
 * This module exports the analytics events stream.
 *
 * @example
 * ```ts
 * import { analyticsEvents$ } from "@shared/analytics";
 *
 * analyticsEvents$.subscribe(event => {
 *   console.log(event);
 * });
 * ```
 */

import type { AnalyticsEvent } from "./types";
import { publishEvent } from "./internals/eventLog";

/**
 * @deprecated Intended only to support unmigrated `updateIdentify` behavior. Prefer events published by the analytics pipeline.
 */
export const publishAnalyticsEvent = (event: AnalyticsEvent) => publishEvent(event);

export { analyticsEvents$ } from "./internals/eventLog";

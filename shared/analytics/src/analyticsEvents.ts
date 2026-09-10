/**
 * @module analytics/analyticsEvents
 * @description
 * This module exports the analytics events stream.
 *
 * @example
 * ```ts
 * import { analyticsEvents$ } from "@ledgerhq/analytics/analyticsEvents";
 *
 * analyticsEvents$.subscribe(event => {
 *   console.log(event);
 * });
 */

export { analyticsEvents$ } from "./internals/eventLog";

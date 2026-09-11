/**
 * @module analytics/flush
 * @description
 * This module exports flush helpers that delegate to the registered analytics client.
 *
 * @example
 * ```ts
 * import { closeAndFlush, flush } from "@shared/analytics";
 *
 * await flush();
 * await closeAndFlush();
 * ```
 */

import { getAnalytics } from "./registry";

export async function flush(): Promise<void> {
  await getAnalytics()?.flush?.();
}

export async function closeAndFlush(): Promise<void> {
  await getAnalytics()?.closeAndFlush?.();
}

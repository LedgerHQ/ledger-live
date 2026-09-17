/**
 * @module analytics/track
 * @description
 * This module exports the track function.
 *
 * @example
 * ```ts
 * import { track } from "@shared/analytics";
 *
 * track("myEvent", { prop: "value" });
 * track("myEvent", { prop: "value" }, { mandatory: true });
 * ```
 */

import { normalizeProps } from "./internals/normalizeProps";
import { isEnabled } from "./registry";
import { getCurrentTrackingPage } from "./screenRefs";
import { trackEvent } from "./internals/trackEvent";
import type { Props, TrackOptions } from "./types";

export function track(
  event: string,
  props?: Error | Props | null,
  { mandatory = false }: TrackOptions = {},
): void | Promise<void> {
  if (mandatory || isEnabled()) {
    const normalizedProps = normalizeProps(props);
    const page = getCurrentTrackingPage();

    return trackEvent({
      kind: "track",
      eventName: event,
      props: page ? { page, ...normalizedProps } : normalizedProps,
      mandatory,
    });
  }
}

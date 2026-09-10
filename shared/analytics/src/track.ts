import { normalizeProps } from "./internals/normalizeProps";
import { isEnabled } from "./registry";
import { trackEvent } from "./internals/trackEvent";
import type { Props } from "./types";

export function track(
  event: string,
  props?: Error | Props | null,
  { mandatory = false }: { mandatory?: boolean } = {},
): void | Promise<void> {
  if (!isEnabled() && !mandatory) {
    return;
  }

  return trackEvent("track", event, normalizeProps(props), mandatory);
}

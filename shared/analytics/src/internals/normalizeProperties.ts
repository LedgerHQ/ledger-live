import type { Props } from "src/types";

export function normalizeProperties(properties?: Error | Props | null): Props {
  if (properties == null) {
    return {};
  }

  if (properties instanceof Error) {
    return { error: properties };
  }

  return { ...properties };
}

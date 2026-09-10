import type { Props } from "../types";

export function normalizeProps(props?: Error | Props | null): Props {
  if (props == null) {
    return {};
  }

  if (props instanceof Error) {
    return { error: props };
  }

  return { ...props };
}

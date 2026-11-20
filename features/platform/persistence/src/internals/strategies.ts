import debounce from "lodash/debounce";
import throttle from "lodash/throttle";
import type { WriteStrategy } from "../bindings";

export type WriteScheduler = {
  schedule(): void;
  flush(): void;
  cancel(): void;
};

/** The lodash calls of the legacy save code: a trailing debounce, or a leading and trailing throttle. */
export function createWriteScheduler(strategy: WriteStrategy, fire: () => void): WriteScheduler {
  if (strategy === "immediate") return { schedule: fire, flush: () => {}, cancel: () => {} };
  const scheduled =
    "debounceMs" in strategy
      ? debounce(fire, strategy.debounceMs)
      : throttle(fire, strategy.throttleMs);
  return { schedule: scheduled, flush: scheduled.flush, cancel: scheduled.cancel };
}

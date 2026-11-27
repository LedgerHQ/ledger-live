import { setAnalytics, setEnabledFn, setExtraPropsFn } from "@shared/analytics";

/**
 * Delivers every tracked event to a fake vendor, which receives it a few ticks later.
 * `sequence` gets `track` when an event is tracked, in call order.
 */
export function listenToAnalytics(sequence: string[] = []) {
  const vendor = jest.fn<void, [string, Record<string, unknown>]>();
  setEnabledFn(() => true);
  setAnalytics({
    track(event, props) {
      vendor(event, props);
    },
  });
  setExtraPropsFn(() => {
    sequence.push("track");
    return {};
  });
  return vendor;
}

/** Unregisters the fake vendor of `listenToAnalytics`. */
export function stopAnalytics() {
  setAnalytics(undefined);
  setEnabledFn(undefined);
  setExtraPropsFn(undefined);
}

/** Waits until the events tracked so far reached the fake vendor. */
export function flushAnalytics(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

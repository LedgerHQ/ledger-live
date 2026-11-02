import { resetTrackingPages, setAnalytics, setEnabledFn } from "@shared/analytics";

/**
 * Records what the real analytics pipeline sends, as `[event, props]` pairs.
 * The test file must use the real `@shared/analytics`, not the global mock.
 */
export function recordAnalytics() {
  const sent: [string, Record<string, unknown>][] = [];

  beforeEach(() => {
    sent.length = 0;
    resetTrackingPages();
    setEnabledFn(() => true);
    setAnalytics({
      track: (event, props) => {
        sent.push([event, props]);
      },
    });
  });

  // track() is async: let it finish before reading.
  return async () => {
    for (let tick = 0; tick < 10; tick++) await Promise.resolve();
    return sent;
  };
}

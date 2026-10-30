import { resetTrackingPages, setAnalytics, setEnabledFn } from "@shared/analytics";

/**
 * Records what the real `@shared/analytics` pipeline delivers, for the test file that calls it.
 * The returned function waits for the async delivery and gives `[event, props]` pairs.
 */
export function recordAnalytics() {
  const sink = jest.fn();

  beforeEach(() => {
    sink.mockReset();
    resetTrackingPages();
    setEnabledFn(() => true);
    setAnalytics({ track: sink });
  });

  afterAll(() => {
    setAnalytics(undefined);
    setEnabledFn(undefined);
  });

  const read = async (): Promise<[string, Record<string, unknown>][]> => {
    for (let tick = 0; tick < 10; tick++) await Promise.resolve();
    return sink.mock.calls.map(([event, props]) => [event, props]);
  };
  /** Forgets what was delivered so far. */
  const clear = () => sink.mockClear();
  return Object.assign(read, { clear });
}

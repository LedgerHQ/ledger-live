const allTimes = new Map<string, Array<[number, number]>>();
const timeouts = new Map<string, number>();

/* NOTE: Not a Rozenite tool
 * WARN: Usages of this function should not be committed.
 * This is just meant as a debugging utility to be used in development only
 */
/* Usage:
 * ```ts
 * const stop = logTimeSpent("myLabel", 5_000);
 * // code to measure
 * stop();
 * ```
 * This will log the total time spent running the measured code every 5 seconds in the console.
 */
export function logTimeSpent(label: string, observedWindow = 10_000) {
  // Currently this function logs its results in the console so it will crash on non dev builds
  // until the result are logged somewhere else there is no point running it even on staging builds.
  if (!__DEV__) return () => {};

  const startT = performance.now();
  return () => {
    const stopT = performance.now();

    const times = allTimes.get(label) ?? [];
    if (times.length === 0) allTimes.set(label, times);

    times.push([startT, stopT]);

    if (timeouts.has(label)) return;
    timeouts.set(
      label,
      window.setTimeout(() => {
        const spent = times.reduce((acc, t) => acc + t[1] - t[0], 0);
        // eslint-disable-next-line no-console
        console.log(`${label} - ${spent} ms over ${times.length} samples`);

        timeouts.delete(label);
        times.splice(0, times.length);
      }, observedWindow),
    );
  };
}

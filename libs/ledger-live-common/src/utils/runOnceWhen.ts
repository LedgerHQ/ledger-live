export function runOnceWhen(
  conditionFunc: () => boolean,
  callback: () => void,
  maxWaitTimeMS: number = 5000,
) {
  const interval = setInterval(() => {
    if (conditionFunc()) {
      clearInterval(interval);
      callback();
    }
  }, 100); // Check every 100ms

  setTimeout(() => {
    // if the conditional function does not return
    // true after maxWaitTimeMS has passed then
    // clear the interval and stop checking.
    clearInterval(interval);
  }, maxWaitTimeMS);
}

export function debounce<F extends (...args: never[]) => void>(
  func: F,
  waitMilliseconds: number,
  immediate = false,
) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<F>): void => {
    const doLater = () => {
      timeoutId = undefined;
      if (!immediate) {
        func(...args);
      }
    };

    const shouldCallNow = immediate && timeoutId === undefined;

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(doLater, waitMilliseconds);

    if (shouldCallNow) {
      func(...args);
    }
  };
}

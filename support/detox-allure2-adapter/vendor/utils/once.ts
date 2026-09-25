export function once<T>(fn: () => T): () => T {
  let result: T | undefined;
  let called = false;

  return () => {
    if (called) {
      return result!;
    }

    called = true;
    result = fn();
    return result;
  };
}

export function isThenable<T>(value: T | Promise<T>): value is Promise<T> {
  return typeof (value as PromiseLike<T> | undefined)?.then === "function";
}

export const isThenable = <T>(value: unknown): value is Promise<T> =>
  typeof (value as Promise<T> | null | undefined)?.then === "function";

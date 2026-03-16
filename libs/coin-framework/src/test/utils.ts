/**
 * Recursively makes all properties optional.
 * Arrays keep their element type (but each element is deeply partial).
 * Primitives and built-in value types (Date, RegExp) are preserved as-is.
 */
export type DeepPartial<T> = T extends (infer U)[]
  ? DeepPartial<U>[]
  : T extends Date | RegExp
    ? T
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

/**
 * Re-types a function so its return value is wrapped in `Promise<DeepPartial<…>>`,
 * while keeping the original parameter types intact.
 *
 * Useful for typing Jest mock functions that return partial RPC/API data:
 * ```ts
 * const mock = jest.fn() as jest.MockedFunction<DeepPartialReturn<SomeApi["method"]>>;
 * mock.mockResolvedValue({ onlyTheFieldsWeNeed: true });
 * ```
 */
export type DeepPartialReturn<F extends (...args: never[]) => unknown> = (
  ...args: Parameters<F>
) => Promise<DeepPartial<Awaited<ReturnType<F>>>>;

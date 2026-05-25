import type { Reducer } from "redux";

export type ExtendedState<TExtension extends Record<string, unknown>> = TExtension & {
  [key: string]: unknown;
};

export type RegisterSliceOptions<S> = {
  name: string;
  reducer: Reducer<S>;
};

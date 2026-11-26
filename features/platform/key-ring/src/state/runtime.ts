import type { KeyRingState } from "@domain/entity-key-ring";
import type { KeyRingRuntime, KeyRingRuntimeExtra } from "../types";
import { findRuntime, toRuntime } from "../internals/runtime";
import { createV1Runtime } from "../internals/v1/runtime";

/**
 * Builds the key ring runtime of a store and returns this package's slice of its thunk
 * `extraArgument`. Build it once, before the store, with a `getState` that reads the store lazily,
 * and pass the same `keyRingRuntime` to `createKeyRingIdentityProvider` and `createKeyRingClient`.
 *
 * @example
 * ```ts
 * const keyRing = keyRingRuntimeExtra({ getState: () => store.getState() });
 * const store = configureStore({
 *   reducer,
 *   middleware: getDefaultMiddleware =>
 *     getDefaultMiddleware({ thunk: { extraArgument: { ...keyRing } } }).concat(
 *       createAuthMiddleware(keyRing.keyRingRuntime),
 *     ),
 * });
 * ```
 */
export function keyRingRuntimeExtra({ getState }: KeyRingRuntimeSources): KeyRingRuntimeExtra {
  return { keyRingRuntime: toRuntime(createV1Runtime(() => getState().trustchain)) };
}

/**
 * The key ring runtime of a thunk `extraArgument`. Throws `KeyRingRuntimeMissingError` when it
 * holds no `keyRingRuntimeExtra`.
 *
 * @example
 * ```ts
 * const runtime = dispatch((_dispatch, _getState, extra) => readKeyRingRuntime(extra));
 * ```
 */
export function readKeyRingRuntime(extra: unknown): KeyRingRuntime {
  const runtime = findRuntime(extra);
  if (!runtime) throw new KeyRingRuntimeMissingError();
  return runtime;
}

/** A key ring thunk or reader ran on a store built without `keyRingRuntimeExtra`. */
export class KeyRingRuntimeMissingError extends Error {
  override name = "KeyRingRuntimeMissingError";
  constructor() {
    super(
      "No key ring runtime in the thunk extraArgument: spread `keyRingRuntimeExtra(...)` into it",
    );
  }
}

/** What `keyRingRuntimeExtra` reads: the app state, which mounts the key ring slice under `trustchain`. */
export type KeyRingRuntimeSources = Readonly<{
  getState: () => Readonly<{ trustchain: KeyRingState }>;
}>;

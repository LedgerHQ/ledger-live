import { useMemo } from "react";
import { readKeyRingRuntime, type KeyRingRuntime } from "@features/platform-key-ring";
import { useLedgerSyncDispatch } from "../internals/store";

/**
 * The key ring runtime of the store, from its thunk `extraArgument`, for the app's key ring client.
 * Throws `KeyRingRuntimeMissingError` when the store was built without `keyRingRuntimeExtra`.
 *
 * @example
 * ```ts
 * const client = createKeyRingClient({ ...setup, deviceBridge, runtime: useKeyRingRuntime() });
 * ```
 */
export function useKeyRingRuntime(): KeyRingRuntime {
  const dispatch = useLedgerSyncDispatch();
  return useMemo(
    () => dispatch((_dispatch, _getState, extra: unknown) => readKeyRingRuntime(extra)),
    [dispatch],
  );
}

import type { KeyRingAction, KeyRingRuntime } from "../types";
import type { V1KeyStore } from "./v1/sliceKeyStore";

/** Wraps `parts` in the opaque value the store extra, the identity provider and the client take. */
export function toRuntime(parts: RuntimeParts): KeyRingRuntime {
  const runtime: KeyRingRuntime = Object.freeze({ kind: "KeyRingRuntime" });
  runtimes.set(runtime, parts);
  return runtime;
}

/** What `runtime` holds. Throws on a runtime this package did not build. */
export function runtimePartsOf(runtime: KeyRingRuntime): RuntimeParts {
  const parts = runtimes.get(runtime);
  if (!parts) throw new Error("Unknown key ring runtime");
  return parts;
}

/** The runtime of a thunk `extraArgument`, or undefined when it holds none this package built. */
export function findRuntime(extra: unknown): KeyRingRuntime | undefined {
  if (typeof extra !== "object" || extra === null || !("keyRingRuntime" in extra)) return undefined;
  const runtime = extra.keyRingRuntime as KeyRingRuntime;
  return runtimes.has(runtime) ? runtime : undefined;
}

/**
 * Dispatches the action a runtime answered: in the same tick when it answered at once, as the v1
 * runtime does, once it resolves otherwise.
 */
export function dispatchAnswer(
  dispatch: (action: KeyRingAction) => unknown,
  answer: RuntimeAnswer<KeyRingAction>,
): Promise<void> {
  if (answer instanceof Promise) {
    return answer.then(action => {
      dispatch(action);
    });
  }
  dispatch(answer);
  return Promise.resolve();
}

/** A value a runtime returns at once, or later for a storage that answers asynchronously. */
export type RuntimeAnswer<T> = T | Promise<T>;

/** The key store of this instance and the state transitions the key ring thunks dispatch. */
export type RuntimeParts = Readonly<{
  /** The v1 adapter signs with the raw key, so it needs the v1 store's escape hatch. */
  keyStore: V1KeyStore;
  /** The action that loads the persisted state at boot, with a new member key when needed. */
  importState(persisted: unknown): RuntimeAnswer<KeyRingAction>;
  /** The action that leaves the key tree and keeps a new member key only. */
  reset(): RuntimeAnswer<KeyRingAction>;
}>;

const runtimes = new WeakMap<KeyRingRuntime, RuntimeParts>();

import type { KeyRingState } from "@domain/entity-key-ring";
import type { KeyRingPersistedState } from "../types";

/** The slice state as the opaque value the app persists. The JSON is the slice state itself. */
export function toPersisted(state: KeyRingState): KeyRingPersistedState {
  return state as unknown as KeyRingPersistedState;
}

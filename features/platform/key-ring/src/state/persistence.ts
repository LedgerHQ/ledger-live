import {
  keyRingInitialState,
  selectKeyRingSecrets,
  type KeyRingState,
} from "@domain/entity-key-ring";
import type { KeyRingPersistedState } from "../types";
import { toPersisted } from "../internals/persistedValue";

/** The persisted value of a fresh install, for a storage layer that needs a default. */
export const keyRingPersistedInitialState: KeyRingPersistedState = toPersisted(keyRingInitialState);

/**
 * What the app writes to disk for the key ring: its persistence lens. Opaque: the persistence
 * layer serializes it as is. Banned in the apps outside their persistence files.
 */
export function selectPersistedKeyRingState(
  state: Readonly<{ trustchain: KeyRingState }>,
): KeyRingPersistedState {
  return toPersisted(selectKeyRingSecrets(state));
}

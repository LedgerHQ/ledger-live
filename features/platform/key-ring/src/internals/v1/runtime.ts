import { keyRingReset, keyRingStateImported, type KeyRingState } from "@domain/entity-key-ring";
import type { RuntimeParts } from "../runtime";
import { v1ImportedState } from "./persistence";
import { createSliceKeyStore, generateV1MemberKey } from "./sliceKeyStore";

/**
 * The v1 runtime on the slice state `readState` returns, read at each call. It answers at once, so
 * an import or a reset stores the new member key in the same dispatch as before.
 */
export function createV1Runtime(readState: () => KeyRingState): RuntimeParts {
  return {
    keyStore: createSliceKeyStore(readState),
    importState(persisted) {
      return keyRingStateImported(v1ImportedState(persisted));
    },
    reset() {
      return keyRingReset(generateV1MemberKey());
    },
  };
}

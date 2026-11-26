import {
  keyRingMemberKeySet,
  keyRingReset,
  keyRingStateImported,
  keyRingTreeSet,
} from "@domain/entity-key-ring";
import type { KeyRingMemberKeyUpdate, KeyRingThunk, KeyRingTreeUpdate } from "../types";
import { memberKeyRecordOf, treeRecordOf } from "../internals/handles";
import { generateV1MemberKey } from "../internals/v1/sliceKeyStore";
import { v1ImportedState } from "../internals/v1/persistence";

/**
 * Loads the persisted key ring state at boot. A value without a valid member key is replaced by
 * an empty state with a new member key; a valid one is kept as is, so it is saved back unchanged.
 * The v1 adapter stores it within the dispatch; await the result where a later step needs it.
 *
 * @example
 * ```ts
 * store.dispatch(importPersistedKeyRingState(await getKey("app", "trustchain")));
 * ```
 */
export function importPersistedKeyRingState(persisted: unknown): KeyRingThunk {
  return function importKeyRingState(dispatch) {
    dispatch(keyRingStateImported(v1ImportedState(persisted)));
    return Promise.resolve();
  };
}

/**
 * Leaves the key tree and starts over with a new member key. Dispatch it after `destroy`, or when
 * the key ring reports this instance removed. The v1 adapter stores it within the dispatch.
 */
export function resetKeyRingState(): KeyRingThunk {
  return function resetKeyRing(dispatch) {
    dispatch(keyRingReset(generateV1MemberKey()));
    return Promise.resolve();
  };
}

/**
 * The action that stores a key tree a `KeyRingClient` operation returned. Until it is
 * dispatched, the session still holds the previous key tree. Throws on an update this package
 * did not create.
 *
 * @example
 * ```ts
 * const tree = await client.restore(selectKeyRingSession(getState()));
 * dispatch(commitKeyRingTree(tree));
 * ```
 */
export function commitKeyRingTree(update: KeyRingTreeUpdate) {
  return keyRingTreeSet(treeRecordOf(update));
}

/**
 * The action that stores the member key `KeyRingClient.createMemberKey` returned. Throws on an
 * update this package did not create.
 *
 * @example
 * ```ts
 * dispatch(commitKeyRingMemberKey(await client.createMemberKey()));
 * ```
 */
export function commitKeyRingMemberKey(update: KeyRingMemberKeyUpdate) {
  return keyRingMemberKeySet(memberKeyRecordOf(update));
}

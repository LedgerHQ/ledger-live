import {
  KeyRingMemberKeyRecordSchema,
  keyRingInitialState,
  type KeyRingState,
} from "@domain/entity-key-ring";
import { z } from "zod";
import { generateV1MemberKey } from "./sliceKeyStore";

/**
 * The state v1 imports at boot: the persisted value as is when its member key is valid, an empty
 * state with a new member key otherwise. Only the member key is validated, as v1 always did.
 */
export function v1ImportedState(persisted: unknown): KeyRingState {
  return PersistedMemberKeySchema.safeParse(persisted).success
    ? (persisted as KeyRingState)
    : { ...keyRingInitialState, memberCredentials: generateV1MemberKey() };
}

const PersistedMemberKeySchema = z.looseObject({
  memberCredentials: KeyRingMemberKeyRecordSchema,
});

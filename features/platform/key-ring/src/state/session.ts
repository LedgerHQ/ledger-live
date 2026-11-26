import {
  selectHasKeyRingMemberKey,
  selectKeyRingSecrets,
  type KeyRingState,
} from "@domain/entity-key-ring";
import type { KeyRingMemberId, KeyRingSession } from "../types";
import { KeyRingMemberRemovedError } from "../errors";
import { sessionOf, stateOf } from "../internals/handles";

/**
 * The session of this instance, to pass to `KeyRingClient` methods. Opaque, and the same value
 * until the key ring state changes, so it is safe in `useSelector` and in hook dependencies.
 *
 * @example
 * ```ts
 * const session = useSelector(selectKeyRingSession);
 * const members = await client.listMembers(session);
 * ```
 */
export function selectKeyRingSession(state: KeyRingRootState): KeyRingSession {
  return sessionOf(selectKeyRingSecrets(state));
}

/** True when `memberId` is this instance in the members list. */
export function isCurrentKeyRingMember(
  session: KeyRingSession,
  memberId: KeyRingMemberId,
): boolean {
  return memberKeyOf(session) === memberId;
}

/** True when both sessions have the same member key: no reset happened in between. */
export function isSameKeyRingMember(a: KeyRingSession, b: KeyRingSession): boolean {
  return memberKeyOf(a) === memberKeyOf(b);
}

/** True when the session has a member key, whether or not it joined a key tree. */
export function hasKeyRingMemberKey(session: KeyRingSession): boolean {
  return selectHasKeyRingMemberKey(rootOf(session));
}

/**
 * Throws unless this instance has a member key and a key tree. The error classifies as
 * `member-removed`, so callers handle it like an instance removed by another one.
 */
export function assertKeyRingMember(session: KeyRingSession): void {
  const { trustchain, memberCredentials } = selectKeyRingSecrets(rootOf(session));
  if (!trustchain || !memberCredentials) {
    throw new KeyRingMemberRemovedError("trustchain or memberCredentials is not set");
  }
}

type KeyRingRootState = Readonly<{ trustchain: KeyRingState }>;

function rootOf(session: KeyRingSession): KeyRingRootState {
  return { trustchain: stateOf(session) };
}

function memberKeyOf(session: KeyRingSession): string | undefined {
  return selectKeyRingSecrets(rootOf(session)).memberCredentials?.pubkey;
}

import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { CHALLENGE } from "@ledgerhq/ledger-key-ring-protocol/__mocks__/challenge";
import { liveAuthentication } from "@ledgerhq/ledger-key-ring-protocol/utils";
import type { KeyRingTreeRecord } from "@domain/entity-key-ring";
import type { KeyRingClient, KeyRingTreeUpdate } from "./types";
import { treeUpdateOf } from "./internals/handles";

/** A valid Keycloak challenge of the key ring broker, for API auth tests. */
export const keyRingAuthChallengeFixture = Object.freeze({
  tlv: CHALLENGE.tlv,
  json: CHALLENGE.json,
});

/** The attestation the identity provider sends for an instance of `treeId`. */
export function keyRingAttestationFixture(treeId: string): string {
  return crypto.to_hex(liveAuthentication(treeId));
}

/**
 * A key ring client whose every method throws unless the test stubs it, so a test fails on the
 * first call it did not expect. The lifecycle is a no-op and `forDeviceSession` returns the same
 * fake unless stubbed.
 *
 * @example
 * ```ts
 * const client = fakeKeyRingClient({
 *   listMembers: jest.fn().mockResolvedValue([member]),
 *   openStream: () => null,
 * });
 * ```
 */
export function fakeKeyRingClient(stubs: Partial<KeyRingClient> = {}): KeyRingClient {
  const client: KeyRingClient = {
    lifecycle: { onKeyRotation: () => () => undefined, subscribe: () => () => undefined },
    forDeviceSession: () => client,
    createMemberKey: notStubbed,
    activate: notStubbed,
    restore: notStubbed,
    listMembers: notStubbed,
    removeMember: notStubbed,
    destroy: notStubbed,
    hostPairing: notStubbed,
    joinPairing: notStubbed,
    openStream: notStubbed,
    invalidateAuth: notStubbed,
    ...stubs,
  };
  return client;
}

/**
 * A key tree update a fake client can return; `commitKeyRingTree` stores `record`.
 *
 * @example
 * ```ts
 * const client = fakeKeyRingClient({
 *   restore: async () => keyRingTreeUpdateFixture(treeRecord),
 * });
 * ```
 */
export function keyRingTreeUpdateFixture(record: KeyRingTreeRecord): KeyRingTreeUpdate {
  return treeUpdateOf(record);
}

function notStubbed(): never {
  throw new Error("KeyRingClient method not stubbed in this test");
}

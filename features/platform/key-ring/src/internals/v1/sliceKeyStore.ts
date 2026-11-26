import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import type { KeyRingMemberKeyRecord, KeyRingState } from "@domain/entity-key-ring";
import {
  convertLiveCredentialsToKeyPair,
  initMemberCredentials,
} from "@ledgerhq/ledger-key-ring-protocol/utils";
import type { KeyAlgorithm, KeyHandle, KeyStore } from "../keyStore";

/**
 * The v1 key store on the slice state `readState` returns, read at each call. Generating stores
 * nothing: the caller dispatches the new key into the slice, which is where v1 keeps it.
 */
export function createSliceKeyStore(readState: () => KeyRingState): V1KeyStore {
  const generated = new WeakMap<KeyHandle, KeyRingMemberKeyRecord>();

  function record(handle: KeyHandle): KeyRingMemberKeyRecord | null {
    if (handle.alias !== MEMBER_KEY.alias) return null;
    return generated.get(handle) ?? readState().memberCredentials;
  }

  function requireRecord(handle: KeyHandle): KeyRingMemberKeyRecord {
    const found = record(handle);
    if (!found) throw new Error(`No key ring key for ${handle.alias}`);
    return found;
  }

  return {
    async current() {
      return readState().memberCredentials ? MEMBER_KEY : null;
    },
    async generate(alias, algorithm) {
      if (alias !== MEMBER_KEY.alias || algorithm !== V1_ALGORITHM) {
        throw new Error(`The v1 key store only holds the ${V1_ALGORITHM} member key`);
      }
      const handle: KeyHandle = Object.freeze({ alias, algorithm });
      const memberKey = generateV1MemberKey();
      generated.set(handle, memberKey);
      return { handle, publicKey: crypto.from_hex(memberKey.pubkey) };
    },
    async publicKey(handle) {
      const found = record(handle);
      return found ? crypto.from_hex(found.pubkey) : null;
    },
    // The v1 SDK signs with the raw key it gets from `memberCredentials`: `sign` is the v2 contract.
    async sign(handle, message) {
      return crypto.sign(message, convertLiveCredentialsToKeyPair(requireRecord(handle)));
    },
    async delete() {
      // v1 keeps the key in the slice: the reset that replaces it is the deletion.
    },
    memberCredentials() {
      return readState().memberCredentials;
    },
  };
}

/**
 * A new member key, generated in software the way v1 always did. Synchronous, so a boot import or
 * a reset stores the new key in the same dispatch as before.
 */
export function generateV1MemberKey(): KeyRingMemberKeyRecord {
  return initMemberCredentials();
}

/**
 * The v1 key store: the member key sits in the persisted `trustchain` slice. The v1 SDK takes
 * the key itself, so this implementation alone also hands it to the v1 adapter.
 */
export interface V1KeyStore extends KeyStore {
  /** The member key record of the slice, as the v1 SDK takes it, or null without one. */
  memberCredentials(): KeyRingMemberKeyRecord | null;
}

const V1_ALGORITHM: KeyAlgorithm = "ecdsa-secp256k1";
const MEMBER_KEY: KeyHandle = Object.freeze({ alias: "member", algorithm: V1_ALGORITHM });

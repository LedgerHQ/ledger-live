import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import type { KeyPair } from "@ledgerhq/hw-ledger-key-ring-protocol/Crypto";
import type { MemberCredentials } from "./types";

export function convertLiveCredentialsToKeyPair(memberCredentials: MemberCredentials): KeyPair {
  return {
    publicKey: crypto.from_hex(memberCredentials.pubkey),
    privateKey: crypto.from_hex(memberCredentials.privatekey),
  };
}

// spec https://ledgerhq.atlassian.net/wiki/spaces/TA/pages/4335960138/ARCH+LedgerLive+Auth+specifications
export function liveAuthentication(rootId: string): Uint8Array {
  const trustchainId = new TextEncoder().encode(rootId);
  const att = new Uint8Array(2 + trustchainId.length);
  att[0] = 0x02; // Prefix tag
  att[1] = trustchainId.length;
  att.set(trustchainId, 2);
  return att;
}

export function credentialForPubKey(publicKey: string) {
  return { version: 0, curveId: 33, signAlgorithm: 1, publicKey };
}

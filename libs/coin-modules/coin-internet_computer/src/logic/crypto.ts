import { DerEncodedPublicKey } from "@icp-sdk/core/agent";
import { Secp256k1PublicKey } from "@icp-sdk/core/identity/secp256k1";
import { Principal } from "@icp-sdk/core/principal";
import { AccountIdentifier } from "./accountIdentifier";

export const derivePrincipalFromPubkey = (publicKey: string): Principal =>
  Principal.selfAuthenticating(pubkeyToDer(publicKey));

export const deriveAddressFromPubkey = (publicKey: string): string => {
  const principal = derivePrincipalFromPubkey(publicKey);
  return AccountIdentifier.fromPrincipal({ principal }).toHex();
};

export const pubkeyToDer = (publicKey: string): DerEncodedPublicKey =>
  Secp256k1PublicKey.fromRaw(new Uint8Array(Buffer.from(publicKey, "hex"))).toDer();

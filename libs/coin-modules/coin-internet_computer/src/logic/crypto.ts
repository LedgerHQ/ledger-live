import { DerEncodedPublicKey } from "@dfinity/agent";
import { Secp256k1PublicKey } from "@dfinity/identity-secp256k1";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";

export const derivePrincipalFromPubkey = (publicKey: string): Principal => {
  const pubkey = Secp256k1PublicKey.fromRaw(new Uint8Array(Buffer.from(publicKey, "hex")).buffer);
  return Principal.selfAuthenticating(new Uint8Array(pubkey.toDer()));
};

export const deriveAddressFromPubkey = (publicKey: string): string => {
  const principal = derivePrincipalFromPubkey(publicKey);
  return AccountIdentifier.fromPrincipal({ principal }).toHex();
};

export const pubkeyToDer = (publicKey: string): DerEncodedPublicKey => {
  const pubkey = Secp256k1PublicKey.fromRaw(new Uint8Array(Buffer.from(publicKey, "hex")).buffer);
  return pubkey.toDer();
};

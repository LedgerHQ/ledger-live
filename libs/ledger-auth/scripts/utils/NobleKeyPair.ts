import { secp256k1 } from "@noble/curves/secp256k1.js";
import type { KeyPair, MemberCredentials } from "./types";

export class NobleKeyPair implements KeyPair {
  static fromMemberCredentials(creds: Pick<MemberCredentials, "pubkey" | "privatekey">): KeyPair {
    return new NobleKeyPair(Buffer.from(creds.privatekey, "hex"), Buffer.from(creds.pubkey, "hex"));
  }

  constructor(
    private readonly privateKey: Buffer,
    public readonly publicKey = Buffer.from(secp256k1.getPublicKey(privateKey)),
  ) {}

  sign(message: Buffer): Buffer {
    return Buffer.from(secp256k1.sign(message, this.privateKey, { format: "der", prehash: true }));
  }
}

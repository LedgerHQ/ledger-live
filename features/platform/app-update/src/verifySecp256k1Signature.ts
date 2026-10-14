import crypto from "crypto";
import { secp256k1 } from "@noble/curves/secp256k1";
import keyto from "@trust/keyto";

// Electron replaced OpenSSL with BoringSSL, which has no secp256k1: verify with noble instead
export function verifySecp256k1Signature(
  msgContent: string,
  sigContent: Buffer,
  pubKeyContent: string,
): boolean {
  try {
    const message = crypto.createHash("sha256").update(msgContent).digest();
    const signature = secp256k1.Signature.fromBytes(sigContent, "der");
    const jwk = keyto.from(pubKeyContent, "pem");
    const publicKey = Buffer.from(jwk.toString("blk", "public"), "hex");
    return secp256k1.verify(signature.toBytes("compact"), message, publicKey, { prehash: false });
  } catch {
    return false;
  }
}

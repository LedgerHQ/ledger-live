import crypto from "crypto";
import { verifySecp256k1Signature } from "@features/platform-app-update";
import { UpdateIncorrectSig } from "../../errors";

export async function getFingerprint(pubKey: string) {
  const hash = crypto.createHash("sha256");
  hash.update(pubKey);
  const result = hash.digest("hex");
  return result;
}

export async function verify(msgContent: string, sigContent: Buffer, pubKeyContent: string) {
  if (!verifySecp256k1Signature(msgContent, sigContent, pubKeyContent)) {
    throw new UpdateIncorrectSig();
  }
}

export async function sign(msgContent: string, privKeyContent: string) {
  const sign = crypto.createSign("sha256");
  sign.update(msgContent);
  const signature = sign.sign(privKeyContent);
  return signature;
}

import crypto from "crypto";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { verifySecp256k1Signature } from "./verifySecp256k1Signature";

const generateKeyPair = () =>
  crypto.generateKeyPairSync("ec", {
    namedCurve: "secp256k1",
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

const sign = (message: string, privateKey: string) => {
  const der = crypto.createSign("sha256").update(message).sign(privateKey);
  const sig = secp256k1.Signature.fromBytes(der, "der");
  const lowS = sig.hasHighS()
    ? new secp256k1.Signature(sig.r, secp256k1.Point.Fn.ORDER - sig.s)
    : sig;
  return Buffer.from(lowS.toBytes("der"));
};

describe("verifySecp256k1Signature", () => {
  const message = "update hash file content";
  const { publicKey, privateKey } = generateKeyPair();

  it("accepts a valid signature", () => {
    expect(verifySecp256k1Signature(message, sign(message, privateKey), publicKey)).toBe(true);
  });

  it("rejects a signature of another message", () => {
    expect(verifySecp256k1Signature(message, sign("other", privateKey), publicKey)).toBe(false);
  });

  it("rejects a signature from another key", () => {
    const other = generateKeyPair();
    expect(verifySecp256k1Signature(message, sign(message, other.privateKey), publicKey)).toBe(
      false,
    );
  });

  it("rejects malformed input instead of throwing", () => {
    expect(verifySecp256k1Signature(message, Buffer.from("not a signature"), publicKey)).toBe(
      false,
    );
    expect(verifySecp256k1Signature(message, sign(message, privateKey), "not a pem")).toBe(false);
  });
});

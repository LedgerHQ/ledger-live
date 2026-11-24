import crypto from "crypto";
import fs from "fs";

const secp256k1Order = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

export function generatePrivateKey() {
  const { privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "secp256k1" });
  return privateKey.export({ type: "pkcs8", format: "pem" }).toString();
}

export function getPub(privateKey: string) {
  return crypto.createPublicKey(privateKey).export({ type: "spki", format: "pem" }).toString();
}

export function parsePrivateKey(pem: string) {
  const key = crypto.createPrivateKey(pem);
  if (key.asymmetricKeyDetails?.namedCurve !== "secp256k1") {
    throw new Error("The private key must be a secp256k1 key");
  }
  return key;
}

export function sha512(file: string, encoding: crypto.BinaryToTextEncoding) {
  return crypto.createHash("sha512").update(fs.readFileSync(file)).digest(encoding);
}

// The app verifier (@noble/curves) rejects high-S signatures, which OpenSSL emits half the time.
export function signLowS(message: string, key: crypto.KeyObject) {
  const raw = crypto.sign("sha256", Buffer.from(message), { key, dsaEncoding: "ieee-p1363" });
  const r = BigInt(`0x${raw.subarray(0, 32).toString("hex")}`);
  const s = BigInt(`0x${raw.subarray(32).toString("hex")}`);
  return derSequence([r, s > secp256k1Order / 2n ? secp256k1Order - s : s]);
}

function derSequence(integers: bigint[]) {
  const body = Buffer.concat(integers.map(derInteger));
  return Buffer.concat([Buffer.from([0x30, body.length]), body]);
}

function derInteger(value: bigint) {
  const hex = value.toString(16);
  const bytes = Buffer.from(hex.length % 2 ? `0${hex}` : hex, "hex");
  const content = bytes[0] >= 0x80 ? Buffer.concat([Buffer.from([0]), bytes]) : bytes;
  return Buffer.concat([Buffer.from([0x02, content.length]), content]);
}

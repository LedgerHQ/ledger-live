import crypto from "crypto";
import * as ecc from "@bitcoinerlab/secp256k1";
import * as asn1 from "asn1.js";
import keyto from "@trust/keyto";
import { UpdateIncorrectSig } from "@ledgerhq/errors";

export async function getFingerprint(pubKey: string) {
  const hash = crypto.createHash("sha256");
  hash.update(pubKey);
  const result = hash.digest("hex");
  return result;
}

// From libs/ledgerjs/packages/hw-app-exchange/src/DerUtils.ts
const ECDSASignature = asn1.define("ECDSASignature", function () {
  this.seq().obj(this.key("r").int(), this.key("s").int());
});

function signatureImport(sig: Uint8Array): Buffer {
  try {
    const decoded = ECDSASignature.decode(sig, "der");

    const rBigInt = decoded.r;
    const sBigInt = decoded.s;

    let rHex = rBigInt.toString(16);
    let sHex = sBigInt.toString(16);

    rHex = rHex.padStart(64, "0");
    sHex = sHex.padStart(64, "0");

    const r = new Uint8Array(32);
    const s = new Uint8Array(32);

    for (let i = 0; i < 32; i++) {
      r[i] = parseInt(rHex.substr(i * 2, 2), 16);
      s[i] = parseInt(sHex.substr(i * 2, 2), 16);
    }

    const signature64 = new Uint8Array(64);
    signature64.set(r, 0);
    signature64.set(s, 32);

    return Buffer.from(signature64);
  } catch (error) {
    throw new Error(`Failed to import DER signature: ${error}`);
  }
}

function signatureNormalize(derSignature: Uint8Array): Uint8Array {
  try {
    const decoded = ECDSASignature.decode(derSignature, "der");

    const r = decoded.r;
    let s = decoded.s;

    // https://neuromancer.sk/std/secg/secp256k1
    const n = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
    const halfN = n / 2n;

    if (s > halfN) {
      s = n - s;
    }

    const normalizedSigObject = { r, s };
    const normalizedDER = ECDSASignature.encode(normalizedSigObject, "der");

    return new Uint8Array(normalizedDER);
  } catch (error) {
    throw new Error(`Failed to normalize DER signature: ${error}`);
  }
}

export async function verify(msgContent: string, sigContent: Buffer, pubKeyContent: string) {
  try {
    // Since Electron replaced OpenSSL with BoringSSL, we lost native support for secp256k1 curve
    // We instead rely on bitcoin-core secp256k1 lib which expects values in slightly different format

    // Let's hash the content to be verified
    const hash = crypto.createHash("sha256");
    hash.update(msgContent);
    const message = new Uint8Array(hash.digest());

    // Convert signature for secp256k1 lib compat
    const sigImport = signatureImport(new Uint8Array(sigContent));
    const signature = signatureNormalize(new Uint8Array(sigImport));

    // Convert public key
    // Parse pem key to JWK
    const jwk = keyto.from(pubKeyContent, "pem");
    // Transform parsed key to Bitcoin format
    const blk = jwk.toString("blk", "public");
    const publicKey = new Uint8Array(Buffer.from(blk, "hex"));
    const verified = ecc.verify(signature, message, publicKey);

    if (!verified) {
      throw new UpdateIncorrectSig();
    }
  } catch {
    throw new UpdateIncorrectSig();
  }
}

export async function sign(msgContent: string, privKeyContent: string) {
  const sign = crypto.createSign("sha256");
  sign.update(msgContent);
  const signature = sign.sign(privKeyContent);
  return signature;
}

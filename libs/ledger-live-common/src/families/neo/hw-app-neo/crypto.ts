// from https://github.com/CityOfZion/neon-js
import hexEncoding from "crypto-js/enc-hex";
import SHA256 from "crypto-js/sha256";
import RIPEMD160 from "crypto-js/ripemd160";
import base58 from "bs58";
import { ab2hexstring, hexstring2ab, reverseHex } from "../../../convert";
const ADDR_VERSION = "17";

function hash(hex, hashingFunction) {
  const hexEncoded = hexEncoding.parse(hex);
  const result = hashingFunction(hexEncoded);
  return result.toString(hexEncoding);
}

function ripemd160(hex: string): string {
  return hash(hex, RIPEMD160);
}

function hash160(hex: string): string {
  const sha = sha256(hex);
  return ripemd160(sha);
}

function hash256(hex: string): string {
  const firstSha = sha256(hex);
  return sha256(firstSha);
}

function sha256(hex: string): string {
  return hash(hex, SHA256);
}

/**
 * Encodes a public key.
 * @param unencodedKey unencoded public key
 * @return encoded public key
 */
function getPublicKeyEncoded(unencodedKey: string): string {
  const publicKeyArray = new Uint8Array(hexstring2ab(unencodedKey));

  if (publicKeyArray[64] % 2 === 1) {
    return "03" + ab2hexstring(publicKeyArray.slice(1, 33));
  } else {
    return "02" + ab2hexstring(publicKeyArray.slice(1, 33));
  }
}

/**
 * Converts a public key to verification script form.
 * VerificationScript serves a very niche purpose.
 * It is attached as part of the signature when signing a transaction.
 * Thus, the name 'scriptHash' instead of 'keyHash' is because we are hashing the verificationScript and not the PublicKey.
 */
const getVerificationScriptFromPublicKey = (publicKey: string): string => {
  return "21" + publicKey + "ac";
};

/**
 * Converts a public key to scripthash.
 */
export const getScriptHashFromPublicKey = (publicKey: string): string => {
  // if unencoded
  if (publicKey.substring(0, 2) === "04") {
    publicKey = getPublicKeyEncoded(publicKey);
  }

  const verificationScript = getVerificationScriptFromPublicKey(publicKey);
  return reverseHex(hash160(verificationScript));
};

/**
 * Converts a scripthash to address.
 */
export const getAddressFromScriptHash = (scriptHash: string): string => {
  scriptHash = reverseHex(scriptHash);
  const shaChecksum = hash256(ADDR_VERSION + scriptHash).substr(0, 8);
  return base58.encode(
    Buffer.from(ADDR_VERSION + scriptHash + shaChecksum, "hex")
  );
};

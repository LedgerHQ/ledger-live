import { CASPER_CHECKSUM_HEX_LEN, CASPER_SMALL_BYTES_COUNT } from "../../consts";

import { Account, Address } from "@ledgerhq/types-live";
import { CLPublicKey, CLPublicKeyTag } from "casper-js-sdk";
import { blake2bFinal, blake2bInit, blake2bUpdate } from "blakejs";
import { InvalidAddress } from "@ledgerhq/errors";

export const getAddress = (a: Account): Address =>
  a.freshAddresses.length > 0
    ? a.freshAddresses[0]
    : { address: a.freshAddress, derivationPath: a.freshAddressPath };

export const getPubKeySignature = (pubKey: string): CLPublicKeyTag => {
  const signature = pubKey.substring(0, 2);

  if (signature === "01") return CLPublicKeyTag.ED25519;

  if (signature === "02") return CLPublicKeyTag.SECP256K1;

  throw new Error("casper pubkey signature not know");
};

function numberToBin(num: number) {
  let binStr = (num >>> 0).toString(2);
  while (binStr.length < 8) {
    binStr = "0" + binStr;
  }
  return binStr.split("").reverse().join("");
}

function bytesToBitsString(buf: Buffer | Uint8Array) {
  const bitsArray: string[] = [];

  for (const num of buf) {
    const bin = numberToBin(num);
    bitsArray.push(bin);
  }

  return bitsArray.join("");
}

/**
 * Returns the bytes encoded as hexadecimal with mixed-case based checksums following a scheme
 * similar to [EIP-55](https://eips.ethereum.org/EIPS/eip-55).
 */
export function casperAddressEncode(inputBytes: Buffer): string {
  const context = blake2bInit(CASPER_CHECKSUM_HEX_LEN);
  blake2bUpdate(context, inputBytes);
  const blakeHash = blake2bFinal(context);

  const nibbles = inputBytes
    .toString("hex")
    .split("")
    .map(v => parseInt(v, 16));

  const bitsArray = bytesToBitsString(blakeHash);

  const res: Array<number | string> = [];

  let steamIndex = -1;
  for (const num of nibbles) {
    if (num < 10) res.push(num);
    else {
      steamIndex += 1;
      if (parseInt(bitsArray[steamIndex], 10)) res.push(num.toString(16).toUpperCase());
      else res.push(num.toString(16).toLowerCase());
    }
  }

  return res.join("");
}

// Decodes a mixed-case hexadecimal string
// Checksum hex encoding for casper docs: https://docs.casperlabs.io/design/checksummed-hex/
function casperAddressDecode(inputString: string): string {
  if (Buffer.from(inputString, "hex").length > CASPER_SMALL_BYTES_COUNT) return inputString;

  if (inputString.toLowerCase() === inputString) return inputString;
  if (inputString.toUpperCase() === inputString) return inputString;

  const encoded = casperAddressEncode(Buffer.from(inputString, "hex"));

  for (let i = 0; i < encoded.length; i++) {
    if (encoded.charAt(i) !== inputString.charAt(i))
      throw Error("Checksum invalid, decoding failed.");
  }

  return inputString;
}

export function isAddressValid(address: string): boolean {
  try {
    const pubKey = getPublicKeyFromCasperAddress(address);
    new CLPublicKey(Buffer.from(pubKey, "hex"), getPubKeySignature(address));
    casperAddressDecode(pubKey);
    return true;
  } catch (err) {
    return false;
  }
}

export function getPublicKeyFromCasperAddress(address: string): string {
  if (address.length !== 68) throw new InvalidAddress("Invalid address size, expected 34 bytes");
  return address.substring(2);
}

export function casperAddressFromPubKey(pubkey: Buffer): string {
  const checksumed = casperAddressEncode(pubkey);

  return `02${checksumed}`;
}

export function casperPubKeyToAccountHash(pubKey: string): string {
  const clPubKey = new CLPublicKey(
    Buffer.from(pubKey.substring(2), "hex"),
    getPubKeySignature(pubKey),
  );

  return casperAddressEncode(Buffer.from(clPubKey.toAccountRawHashStr(), "hex"));
}

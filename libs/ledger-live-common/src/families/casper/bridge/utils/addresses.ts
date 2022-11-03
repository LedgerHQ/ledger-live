import { SMALL_BYTES_COUNT } from "../../consts";

import { Account, Address } from "@ledgerhq/types-live";
import { CLPublicKeyTag } from "casper-js-sdk";
import { blake2bFinal, blake2bInit, blake2bUpdate } from "blakejs";

export const getAddress = (a: Account): Address =>
  a.freshAddresses.length > 0
    ? a.freshAddresses[0]
    : { address: a.freshAddress, derivationPath: a.freshAddressPath };

export const getPublicKey = (a: Account): string => {
  const address =
    a.freshAddresses.length > 0
      ? a.freshAddresses[0]
      : { address: a.freshAddress, derivationPath: a.freshAddressPath };

  return address.address.substring(2);
};

export const getPubKeySignature = (pubKey: string): CLPublicKeyTag => {
  const signature = pubKey.substring(0, 2);

  if (signature === "01") return CLPublicKeyTag.ED25519;

  if (signature === "02") return CLPublicKeyTag.SECP256K1;

  return 0;
};

function numberToBin(num: number) {
  return (num >>> 0).toString(2);
}

function bytesToBitsString(buf: Buffer) {
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
function encode(inputBytes: Buffer) {
  const context = blake2bInit(inputBytes.length);
  blake2bUpdate(context, inputBytes);
  const hashBuf = Buffer.from(blake2bFinal(context));

  const nibbles = inputBytes
    .toString("hex")
    .split("")
    .map((v) => parseInt(v, 16));

  const bitsArray = bytesToBitsString(hashBuf);

  const res: Array<number | string> = [];

  let steamIndex = -1;
  for (const num of nibbles) {
    if (num < 10) res.push(num);
    else {
      steamIndex++;
      if (parseInt(bitsArray[steamIndex], 10))
        res.push(num.toString(16).toUpperCase());
      else res.push(num.toString(16).toLowerCase());
    }
  }

  return res.join("");
}

// Decodes a mixed-case hexadecimal string
// Checksum hex encoding for casper docs: https://docs.casperlabs.io/design/checksummed-hex/
function decode(inputString: string): string {
  if (Buffer.from(inputString, "hex").length > SMALL_BYTES_COUNT)
    return inputString;

  if (inputString.toLowerCase() === inputString) return inputString;
  if (inputString.toUpperCase() === inputString) return inputString;

  const encoded = encode(Buffer.from(inputString, "hex"));

  for (let i = 0; i < encode.length; i++) {
    if (encoded.charAt(i) !== inputString.charAt(i))
      throw Error("Checksum invalid, decoding failed.");
  }

  return inputString;
}

export function validateAddress(address: string): { isValid: boolean } {
  try {
    decode(address);
    return { isValid: true };
  } catch (err) {
    return { isValid: false };
  }
}

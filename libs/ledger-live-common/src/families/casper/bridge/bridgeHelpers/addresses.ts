import { Account, Address } from "@ledgerhq/types-live";
import { CLPublicKey, CLPublicKeyTag } from "casper-js-sdk";
import { blake2bFinal, blake2bInit, blake2bUpdate } from "blakejs";
import { CASPER_CHECKSUM_HEX_LEN } from "../../consts";

export const getAddress = (a: Account): Address =>
  a.freshAddresses.length > 0
    ? a.freshAddresses[0]
    : { address: a.freshAddress, derivationPath: a.freshAddressPath };

export function isAddressValid(pubKey: string): boolean {
  try {
    casperGetCLPublicKey(pubKey);
    return true;
  } catch (err) {
    return false;
  }
}

export function casperGetCLPublicKey(pubkey: string): CLPublicKey {
  let checksummed = true;

  if (pubkey.toLowerCase() === pubkey) checksummed = false;
  if (pubkey.toUpperCase() === pubkey) checksummed = false;

  return CLPublicKey.fromHex(pubkey, checksummed);
}

export function casperAccountHashFromPublicKey(
  pubKey: string,
  checksummed: boolean = false,
): string {
  const accountHashBuff = casperGetCLPublicKey(pubKey).toAccountHash();

  if (checksummed === false) return Buffer.from(accountHashBuff).toString("hex");

  return casperAddressEncode(Buffer.from(accountHashBuff));
}

export function casperAddressFromPubKey(pubkey: Buffer, keySig: CLPublicKeyTag): string {
  return `${keySig.toString()}${pubkey}`;
}

export function getCLPublicKey(address: string): CLPublicKey {
  let checksummed = true;

  if (address.toLowerCase() === address) checksummed = false;
  if (address.toUpperCase() === address) checksummed = false;

  return CLPublicKey.fromHex(address, checksummed);
}

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

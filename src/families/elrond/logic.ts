import type { Account } from "../../types";
import type { Transaction } from "./types";
import { bech32 } from "bech32";

/**
 * The human-readable-part of the bech32 addresses.
 */
const HRP = "erd";

/**
 * The length (in bytes) of a public key (from which a bech32 address can be obtained).
 */
const PUBKEY_LENGTH = 32;

export const compareVersions = (versionA: string, versionB: string): number => {
  let i, diff;
  const regExStrip0 = /(\.0+)+$/;
  const segmentsA = versionA.replace(regExStrip0, "").split(".");
  const segmentsB = versionB.replace(regExStrip0, "").split(".");
  const minVersionLength = Math.min(segmentsA.length, segmentsB.length);

  for (i = 0; i < minVersionLength; i++) {
    diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);

    if (diff == 0) {
      continue;
    }

    if (diff < 0) {
      return -1;
    }

    return 1;
  }

  return segmentsA.length - segmentsB.length;
};

function fromBech32(value: string): string {
  let decoded;

  try {
    decoded = bech32.decode(value);
  } catch (err) {
    throw new Error("Erd address can't be created");
  }

  const prefix = decoded.prefix;
  if (prefix != HRP) {
    throw new Error("Bad HRP");
  }

  const pubkey = Buffer.from(bech32.fromWords(decoded.words));
  if (pubkey.length != PUBKEY_LENGTH) {
    throw new Error("Erd address can't be created");
  }

  return value;
}

/**
 * Returns true if address is a valid bech32
 *
 * @param {string} address
 */
export const isValidAddress = (address: string): boolean => {
  try {
    fromBech32(address);
    return true;
  } catch (error) {
    return false;
  }
};
export const isSelfTransaction = (a: Account, t: Transaction): boolean => {
  return t.recipient === a.freshAddress;
};

/**
 * Returns nonce for an account
 *
 * @param {Account} a
 */
export const getNonce = (a: Account): number => {
  const lastPendingOp = a.pendingOperations[0];
  const nonce = Math.max(
    a.elrondResources?.nonce || 0,
    lastPendingOp && typeof lastPendingOp.transactionSequenceNumber === "number"
      ? lastPendingOp.transactionSequenceNumber + 1
      : 0
  );
  return nonce;
};

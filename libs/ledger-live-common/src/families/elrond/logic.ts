import { decode, fromWords } from "bech32";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type {
  Transaction,
  ElrondTransactionMode,
  ElrondDelegation,
} from "./types";

/**
 * The human-readable-part of the bech32 addresses.
 */
const HRP = "erd";

/**
 * The length (in bytes) of a public key (from which a bech32 address can be obtained).
 */
const PUBKEY_LENGTH = 32;

function fromBech32(value: string): string {
  let decoded;

  try {
    decoded = decode(value);
  } catch (err) {
    throw new Error("Erd address can't be created");
  }

  const prefix = decoded.prefix;
  if (prefix != HRP) {
    throw new Error("Bad HRP");
  }

  const pubkey = Buffer.from(fromWords(decoded.words));
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

// For some transaction modes the amount doesn't belong to the account's balance
export const isAmountSpentFromBalance = (mode: ElrondTransactionMode) => {
  return ["send", "delegate"].includes(mode);
};

export const computeDelegationBalance = (
  delegations: ElrondDelegation[]
): BigNumber => {
  let totalDelegationBalance = new BigNumber(0);

  for (const delegation of delegations) {
    let delegationBalance = new BigNumber(delegation.userActiveStake).plus(
      new BigNumber(delegation.claimableRewards)
    );

    for (const undelegation of delegation.userUndelegatedList) {
      delegationBalance = delegationBalance.plus(
        new BigNumber(undelegation.amount)
      );
    }

    totalDelegationBalance = totalDelegationBalance.plus(delegationBalance);
  }

  return totalDelegationBalance;
};

export const addPrefixToken = (tokenId: string) => `elrond/esdt/${tokenId}`;

export const extractTokenId = (tokenId: string) => {
  return tokenId.split("/")[2];
};

import { CoinType } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import bs58check from "bs58check";
import { MINA_DECODED_ADDRESS_LENGTH } from "../consts";
import { Transaction, MinaAccount } from "../types/common";

/*
 * Validate a Mina address.
 */
export function isValidAddress(address: string) {
  try {
    if (!address.toLowerCase().startsWith("b62")) {
      return false;
    }
    const decodedAddress = Buffer.from(bs58check.decode(address)).toString("hex");
    return !!decodedAddress && decodedAddress.length === MINA_DECODED_ADDRESS_LENGTH;
  } catch {
    return false;
  }
}

// Get the account number from the path
export const getAccountNumFromPath = (path: string): number | undefined => {
  const parts = path.split("'/");

  if (parts.length === 3) {
    return;
  }

  if (parts[1] !== `${CoinType.MINA}`) {
    return;
  }

  try {
    const acc = parseInt(parts[2], 10);
    if (acc >= 0) {
      return acc;
    }
    return;
  } catch {
    return;
  }
};

/*
 * Get the max amount that can be spent, taking into account tx type and pending operations.
 */
export const getMaxAmount = (a: MinaAccount, _t: Transaction, fees?: BigNumber): BigNumber => {
  let maxAmount;

  let pendingDefaultAmount = new BigNumber(0);

  a.pendingOperations.forEach(({ value }) => {
    pendingDefaultAmount = pendingDefaultAmount.plus(value);
  });

  maxAmount = a.spendableBalance.minus(pendingDefaultAmount);
  if (fees) {
    maxAmount = maxAmount.minus(fees);
  }
  if (maxAmount === undefined || maxAmount.lt(0)) {
    return new BigNumber(0);
  }

  return maxAmount;
};

export const getTotalSpent = (a: MinaAccount, t: Transaction, fees: BigNumber): BigNumber => {
  if (t.useAllAmount) {
    return a.spendableBalance;
  }

  return new BigNumber(t.amount).plus(fees);
};

// reEncodeRawSignature takes a raw signature in the form of a 128-character hex string and returns a re-encoded version of it.
export function reEncodeRawSignature(rawSignature: string) {
  function shuffleBytes(hex: string) {
    const bytes = hex.match(/.{2}/g);
    if (!bytes) {
      throw "Invalid hex input";
    }
    bytes.reverse();
    return bytes.join("");
  }

  if (rawSignature.length !== 128) {
    throw "Invalid raw signature input";
  }
  const field = rawSignature.substring(0, 64);
  const scalar = rawSignature.substring(64);
  return shuffleBytes(field) + shuffleBytes(scalar);
}

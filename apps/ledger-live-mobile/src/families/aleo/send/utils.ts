import { BigNumber } from "bignumber.js";
import type { AleoAccount, Transaction } from "@ledgerhq/coin-aleo/types";
import {
  isPrivateTransaction,
  isPublicTransaction,
} from "@ledgerhq/coin-aleo/logic/utils";
import { TRANSACTION_TYPE } from "@ledgerhq/coin-aleo/constants";

/**
 * Get the available balance for a given Aleo transaction mode.
 * Returns public balance for public transfers, private balance for private transfers.
 */
export function getBalanceForMode(
  account: AleoAccount,
  transaction: Transaction,
): BigNumber {
  if (isPrivateTransaction(transaction)) {
    return account.aleoResources?.privateBalance ?? new BigNumber(0);
  }

  if (isPublicTransaction(transaction)) {
    return account.aleoResources?.transparentBalance ?? new BigNumber(0);
  }

  return new BigNumber(0);
}

/**
 * Check if the transaction is in private mode (transfer_private or convert_private_to_public)
 */
export function isPrivateMode(transaction: Transaction): boolean {
  return isPrivateTransaction(transaction);
}

/**
 * Check if the transaction is in public mode (transfer_public or convert_public_to_private)
 */
export function isPublicMode(transaction: Transaction): boolean {
  return isPublicTransaction(transaction);
}

/**
 * Get the default transaction mode for regular transfers (not self-transfers)
 */
export function getDefaultTransferMode(): typeof TRANSACTION_TYPE.TRANSFER_PUBLIC {
  return TRANSACTION_TYPE.TRANSFER_PUBLIC;
}

/**
 * Initialize properties for private transaction mode
 */
export function initializePrivateProperties() {
  return {
    amountRecordCommitments: [],
    feeRecordCommitment: null,
  };
}

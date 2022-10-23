import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { BigNumber } from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import type { IconAccount, Transaction } from "./types";

import {
  BERLIN_TESTNET_NID,
  ICON_API_ENDPOINT,
  ICON_RPC_ENDPOINT,
  ICON_TESTNET_API_ENDPOINT,
  ICON_TESTNET_RPC_ENDPOINT,
  MAINNET_NID,
} from "./constants";

export const MAX_AMOUNT = 5000;

/**
 * Returns true if address is a valid md5
 *
 * @param {string} address
 */
export const isValidAddress = (address: string): boolean => {
  if (!address) return false;

  return !!address.match(/^[a-z0-9]{42}$/);
};

export const isSelfTransaction = (a: Account, t: Transaction): boolean => {
  return t.recipient === a.freshAddress;
};

/**
 * Returns true if transaction amount is less than MAX AMOUNT and > 0
 *
 * @param {BigNumber} amount
 */
export const specificCheck = (amount: BigNumber): boolean => {
  return amount.gt(0) && amount.lte(MAX_AMOUNT);
};

/**
 * Returns nonce for an account
 *
 * @param {Account} a
 */
export const getNonce = (a: IconAccount): number => {
  const lastPendingOp = a.pendingOperations[0];

  const nonce = Math.max(
    a.iconResources?.nonce || 0,
    lastPendingOp && typeof lastPendingOp.transactionSequenceNumber === "number"
      ? lastPendingOp.transactionSequenceNumber + 1
      : 0
  );

  return nonce;
};

/**
 * Returns true if the current currency is testnet
 *
 * @param {currency} CryptoCurrency
 */
export function isTestnet(currency: CryptoCurrency): boolean {
  return getCryptoCurrencyById(currency.id).isTestnetFor ? true : false;
}

/**
 * Returns Testnet RPC URL if the current currency is testnet
 *
 * @param {currency} CryptoCurrency
 */
export function getRpcUrl(currency: CryptoCurrency): string {
  let rpcUrl = ICON_RPC_ENDPOINT;
  if (isTestnet(currency)) {
    rpcUrl = ICON_TESTNET_RPC_ENDPOINT;
  }
  return rpcUrl;
}

/**
 * Returns Testnet API URL if the current currency is testnet
 *
 * @param {currency} CryptoCurrency
 */
export function getApiUrl(currency: CryptoCurrency): string {
  let apiUrl = ICON_API_ENDPOINT;
  if (isTestnet(currency)) {
    apiUrl = ICON_TESTNET_API_ENDPOINT;
  }
  return apiUrl;
}

export function getNid(currency: CryptoCurrency): number {
  let nid = MAINNET_NID;
  if (isTestnet(currency)) {
    nid = BERLIN_TESTNET_NID;
  }
  return nid;
}

import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { BigNumber } from "bignumber.js";
import IconService from "icon-sdk-js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import type { IconAccount, Transaction } from "./types";
const { IconAmount } = IconService;
import { BERLIN_TESTNET_NID, IISS_SCORE_ADDRESS, MAINNET_NID } from "./constants";

export const MAX_AMOUNT = 5000;

/**
 * @param {string|number|BigNumber} value value as loop
 * @returns {BigNumber} value as ICX
 */
export const convertLoopToIcx = (value: any): BigNumber => {
  return new BigNumber(
    IconAmount.of(value, IconAmount.Unit.LOOP).convertUnit(IconAmount.Unit.ICX).value,
  );
};

/**
 * Returns true if address is a valid md5
 *
 * @param {string} address
 */
export const isValidAddress = (address: string): boolean => {
  if (!address) return false;

  return !!address.match(/^[a-z0-9]{42}$/);
};

/**
 * Returns true if transaction is a self transaction
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export const isSelfTransaction = (a: Account, t: Transaction): boolean => {
  return t.recipient === a.freshAddress;
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
      : 0,
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

export function getNid(currency: CryptoCurrency): number {
  let nid = MAINNET_NID;
  if (isTestnet(currency)) {
    nid = BERLIN_TESTNET_NID;
  }
  return nid;
}

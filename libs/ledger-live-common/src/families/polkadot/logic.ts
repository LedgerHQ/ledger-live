import { BigNumber } from "bignumber.js";
import type { Account, OperationType } from "../../types";
import type { Transaction } from "./types";
import { getCurrentPolkadotPreloadData } from "./preload";

export const EXISTENTIAL_DEPOSIT = new BigNumber(10000000000);
export const EXISTENTIAL_DEPOSIT_RECOMMENDED_MARGIN = new BigNumber(1000000000); // Polkadot recommended Existential Deposit error margin
export const MAX_NOMINATIONS = 16;
export const MAX_UNLOCKINGS = 32;
export const PRELOAD_MAX_AGE = 60 * 1000;
export const MAX_AMOUNT_INPUT = 0xffffffffffffffff;
export const FEES_SAFETY_BUFFER = new BigNumber(1000000000); // Arbitrary buffer for paying fees of next transactions

/**
 * Returns true if account is a stash.
 * When the account is a stash, we have the information of which account is the controller
 *
 * @param {Account} a
 */
export const isStash = (a: Account): boolean => {
  return !!a.polkadotResources?.controller;
};

/**
 * Returns true if account is a controller.
 * when account is a controller, we have the information of which stash it controls
 *
 * @param {Account} a
 */
export const isController = (a: Account): boolean => {
  return !!a.polkadotResources?.stash;
};

/**
 * Returns true if account is controlled by an external account (not self)
 *
 * @param {Account} a
 */
export const hasExternalController = (a: Account): boolean => {
  return a.polkadotResources?.controller
    ? a.polkadotResources?.controller !== a.freshAddress
    : false;
};

/**
 * Returns true if account controls an external stash (not self)
 *
 * @param {Account} a
 */
export const hasExternalStash = (a: Account): boolean => {
  return a.polkadotResources?.stash
    ? a.polkadotResources?.stash !== a.freshAddress
    : false;
};

/**
 * Must have the minimum balance to bond
 *
 * @param {Account} a
 */
export const canBond = (a: Account): boolean => {
  const { balance } = a;
  return EXISTENTIAL_DEPOSIT.lte(balance);
};

/**
 * Get the minimum bond amount required to bond/rebond
 *
 * @param {Account} a
 */
export const getMinimumAmountToBond = (
  a: Account,
  minimumBondBalance: BigNumber | undefined
): BigNumber => {
  const currentlyBondedBalance = calculateMaxUnbond(a);

  if (minimumBondBalance && currentlyBondedBalance.lt(minimumBondBalance)) {
    return minimumBondBalance.minus(currentlyBondedBalance);
  }

  return new BigNumber(0);
};

/**
 * Return true if the account has at least the current minimum bonded balance required by the network
 *
 * @param {Account} a
 */
export const hasMinimumBondBalance = (a: Account): boolean => {
  const { minimumBondBalance } = getCurrentPolkadotPreloadData();
  return (
    !a.polkadotResources ||
    a.polkadotResources.lockedBalance.gte(new BigNumber(minimumBondBalance))
  );
};

/**
 * Return true if some operation with type is pending and not yet synchronized
 *
 * @param {Account} a
 */
export const hasPendingOperationType = (
  a: Account,
  type: OperationType
): boolean => {
  return a.pendingOperations?.some((op) => op.type === type) ?? false;
};

/**
 * Retyrns true if has reached the maximum of unlocking slots
 *
 * @param {Account} a
 */
export const hasMaxUnlockings = (a: Account) => {
  const { unlockings = [] } = a.polkadotResources || {};
  return (unlockings?.length || 0) >= MAX_UNLOCKINGS;
};

/**
 * Return true if account has enough Locked Balance to rebond
 *
 * @param {Account} a
 */
export const hasLockedBalance = (a: Account) => {
  const {
    lockedBalance = new BigNumber(0),
    unlockingBalance = new BigNumber(0),
  } = a.polkadotResources || {};
  return lockedBalance.minus(unlockingBalance).gt(0);
};

/**
 * Must have locked Balance
 *
 * @param {Account} a
 */
export const canUnbond = (a: Account): boolean => {
  return hasLockedBalance(a) && !hasMaxUnlockings(a);
};

/**
 * Returns true if an account can nominate
 *
 * @param {Account} a
 */
export const canNominate = (a: Account): boolean => isController(a);

/**
 * Returns true if account must do a first bond - false for a bond extra
 *
 * @param {Account} a
 */
export const isFirstBond = (a: Account): boolean => !isStash(a);

/**
 * Returns nonce for an account
 *
 * @param {Account} a
 */
export const getNonce = (a: Account): number => {
  const lastPendingOp = a.pendingOperations[0];
  const nonce = Math.max(
    a.polkadotResources?.nonce || 0,
    lastPendingOp && typeof lastPendingOp.transactionSequenceNumber === "number"
      ? lastPendingOp.transactionSequenceNumber + 1
      : 0
  );
  return nonce;
};

/**
 * Calculate max bond which is the actual spendable minus a safety buffer,
 * so the user still has funds to pay the fees for next transactions
 *
 * @param {*} a
 * @param {*} t
 */
const calculateMaxBond = (a: Account, t: Transaction): BigNumber => {
  const amount = a.spendableBalance
    .minus(t.fees || 0)
    .minus(FEES_SAFETY_BUFFER);
  return amount.lt(0) ? new BigNumber(0) : amount;
};

/**
 * Calculates max unbond amount which is the remaining active locked balance (not unlocking)
 *
 * @param {*} account
 */
const calculateMaxUnbond = (a: Account): BigNumber => {
  return (
    a.polkadotResources?.lockedBalance.minus(
      a.polkadotResources.unlockingBalance
    ) ?? new BigNumber(0)
  );
};

/**
 * Calculates max rebond amount which is the current unlocking balance (including unlocked)
 *
 * @param {*} account
 */
const calculateMaxRebond = (a: Account): BigNumber => {
  return a.polkadotResources?.unlockingBalance ?? new BigNumber(0);
};

/**
 * Calculate the real spendable
 *
 * @param {*} a
 * @param {*} t
 */
const calculateMaxSend = (a: Account, t: Transaction): BigNumber => {
  const amount = a.spendableBalance.minus(t.fees || 0);
  return amount.lt(0) ? new BigNumber(0) : amount;
};

/**
 * Calculates correct amount if useAllAmount
 *
 * @param {*} param
 */
export const calculateAmount = ({
  a,
  t,
}: {
  a: Account;
  t: Transaction;
}): BigNumber => {
  let amount = t.amount;

  if (t.useAllAmount) {
    switch (t.mode) {
      case "send":
        amount = calculateMaxSend(a, t);
        break;

      case "bond":
        amount = calculateMaxBond(a, t);
        break;

      case "unbond":
        amount = calculateMaxUnbond(a);
        break;

      case "rebond":
        amount = calculateMaxRebond(a);
        break;

      default:
        amount = a.spendableBalance.minus(t.fees || 0);
        break;
    }
  } else if (t.amount.gt(MAX_AMOUNT_INPUT)) {
    return new BigNumber(MAX_AMOUNT_INPUT);
  }

  return amount.lt(0) ? new BigNumber(0) : amount;
};
export const getMinimumBalance = (a: Account): BigNumber => {
  const lockedBalance = a.balance.minus(a.spendableBalance);
  return lockedBalance.lte(EXISTENTIAL_DEPOSIT)
    ? EXISTENTIAL_DEPOSIT.minus(lockedBalance)
    : new BigNumber(0);
};

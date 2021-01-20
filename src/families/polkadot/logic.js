// @flow
import { BigNumber } from "bignumber.js";
import { decodeAddress } from "@polkadot/util-crypto";
import type { Account, OperationType } from "../../types";

import type { Transaction } from "./types";

export const EXISTENTIAL_DEPOSIT = BigNumber(10000000000);
export const MINIMUM_BOND_AMOUNT = BigNumber(10000000000);
export const MAX_NOMINATIONS = 16;
export const MAX_UNLOCKINGS = 32;
export const PRELOAD_MAX_AGE = 60 * 1000;
export const MAX_AMOUNT_INPUT = 0xffffffffffffffff;

/**
 * Returns true if address is valid, false if it's invalid (can't parse or wrong checksum)
 *
 * @param {*} address
 */
export const isValidAddress = (address: string): boolean => {
  if (!address) return false;
  try {
    decodeAddress(address);
    return true;
  } catch (err) {
    return false;
  }
};

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
 * Get the minimum bond amount required to rebond
 *
 * @param {Account} a
 */
export const getMinimalLockedBalance = (a: Account): BigNumber => {
  const remainingActiveLockedBalance = calculateMaxUnbond(a);

  if (remainingActiveLockedBalance.lt(MINIMUM_BOND_AMOUNT)) {
    return MINIMUM_BOND_AMOUNT.minus(remainingActiveLockedBalance);
  }
  return BigNumber(0);
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
  const { lockedBalance = BigNumber(0), unlockingBalance = BigNumber(0) } =
    a.polkadotResources || {};
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
 * Calculates max unbond amount which is the remaining active locked balance (not unlocking)
 *
 * @param {*} account
 */
const calculateMaxUnbond = (a: Account): BigNumber => {
  return (
    a.polkadotResources?.lockedBalance.minus(
      a.polkadotResources.unlockingBalance
    ) ?? BigNumber(0)
  );
};

/**
 * Calculates max rebond amount which is the current unlocking balance (including unlocked)
 *
 * @param {*} account
 */
const calculateMaxRebond = (a: Account): BigNumber => {
  return a.polkadotResources?.unlockingBalance ?? BigNumber(0);
};

/**
 * Calculate the real spendable
 *
 * @param {*} a
 */
const calculateMaxSend = (a: Account, t: Transaction): BigNumber => {
  const amount = a.spendableBalance
    .minus(getMinimumBalance(a))
    .minus(t.fees || 0);
  return amount.lt(0) ? BigNumber(0) : amount;
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
  a: Account,
  t: Transaction,
}): BigNumber => {
  let amount = t.amount;
  if (t.useAllAmount) {
    switch (t.mode) {
      case "send":
        amount = calculateMaxSend(a, t);
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
    return BigNumber(MAX_AMOUNT_INPUT);
  }

  return amount.lt(0) ? BigNumber(0) : amount;
};

export const getMinimumBalance = (a: Account): BigNumber => {
  const lockedBalance = a.balance.minus(a.spendableBalance);

  return lockedBalance.lte(EXISTENTIAL_DEPOSIT)
    ? EXISTENTIAL_DEPOSIT.minus(lockedBalance)
    : BigNumber(0);
};

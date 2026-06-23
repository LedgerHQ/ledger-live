import {
  NotEnoughBalance,
  NotEnoughBalanceInParentAccount,
  RecipientRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  FeeNotLoaded,
  FeeTooHigh,
  InvalidAddress,
} from "@ledgerhq/errors";
import { findSubAccountById } from "@ledgerhq/ledger-wallet-framework/account/index";
import { AccountBridge } from "@ledgerhq/types-live";
import { isValidSuiAddress } from "@mysten/sui/utils";
import { BigNumber } from "bignumber.js";
import { ONE_SUI } from "../constants";
import {
  OneSuiMinForStake,
  OneSuiMinForUnstake,
  OneSuiMinForUnstakeToBeLeft,
  SomeSuiForUnstake,
} from "../errors";
import type { SuiAccount, Transaction, TransactionStatus } from "../types";
import { ensureAddressFormat } from "../utils";
import { addressBalanceSpendCap } from "./utils";
/**
 * Get the status of a transaction.
 * @function getTransactionStatus
 * @param {SuiAccount} account - The account associated with the transaction.
 * @param {Transaction} transaction - The transaction object containing details such as amount, fees, and recipient.
 * @returns {Promise<Object>} A promise that resolves to an object containing the transaction status, including errors, warnings, estimated fees, amount, and total spent.
 */
export const getTransactionStatus: AccountBridge<
  Transaction,
  SuiAccount,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const amount = new BigNumber(transaction?.amount || 0);
  // Displayed fee/total use the accurate dry-run gas (what the tx actually pays), so the
  // confirmation screen and the optimistic op match the eventually-synced confirmed op.
  const estimatedFees = new BigNumber(transaction?.fees || 0);
  // Balance validation reserves the gas BUDGET (≥ fee): Sui requires the gas coins to cover the
  // budget, so insufficient-balance is checked against it — not the smaller actual fee. Staking
  // reserves a fixed ONE_SUI/10 until a dry-run budget is available.
  let gasBudget = new BigNumber(transaction?.gasBudget || 0);
  if (gasBudget.lt(estimatedFees)) gasBudget = estimatedFees;
  if (gasBudget.eq(0) && transaction.mode === "delegate") {
    gasBudget = BigNumber(ONE_SUI).div(10);
  }
  const totalSpent = transaction.subAccountId ? amount : amount.plus(estimatedFees);
  const requiredBalance = transaction.subAccountId ? amount : amount.plus(gasBudget);
  let accountBalance = account.balance;

  if (transaction.subAccountId) {
    const subAccount = findSubAccountById(account, transaction.subAccountId);
    accountBalance = subAccount?.balance ?? new BigNumber(0);
  }

  if (amount.lte(0) && !transaction.useAllAmount) {
    errors.amount = new AmountRequired();
  } else if (estimatedFees.times(10).gt(amount) && !transaction.subAccountId) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  if (!transaction.fees) {
    errors.fees = new FeeNotLoaded();
  }

  if (transaction.mode === "undelegate") {
    const stakes = account.suiResources?.stakes?.flatMap(({ stakes }) => stakes) ?? [];
    const stake = stakes.find(s => s.stakedSuiId === transaction.stakedSuiId);
    if (stake) {
      if (!transaction.useAllAmount && amount.lt(ONE_SUI)) {
        errors.amount = new OneSuiMinForUnstake();
      }
      const stakeLeft = BigNumber(stake?.principal).minus(amount);
      if (!transaction.useAllAmount && stakeLeft.lt(ONE_SUI) && stakeLeft.gt(0)) {
        errors.amount = new OneSuiMinForUnstakeToBeLeft();
      }
    }
  } else {
    if (!transaction.recipient) {
      errors.recipient = new RecipientRequired();
    } else if (!isValidSuiAddress(transaction.recipient)) {
      errors.recipient = new InvalidAddress(undefined, {
        currencyName: account.currency.name,
      });
    }

    if (ensureAddressFormat(account.freshAddress) === ensureAddressFormat(transaction.recipient)) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    }

    if (totalSpent.eq(0) && transaction.useAllAmount && !errors.amount) {
      errors.amount = new NotEnoughBalance();
    }

    if (transaction.subAccountId && gasBudget.gt(account.balance)) {
      errors.amount = new NotEnoughBalanceInParentAccount();
    }

    if (requiredBalance.gt(accountBalance) && !errors.amount) {
      errors.amount = new NotEnoughBalance();
    }

    // SIP-58 safety net: when real coin objects can't cover the gas budget, gas is withdrawn from
    // the address balance together with the transfer — so the address balance, not the total, must
    // cover `amount + gasBudget`. Without this the tx builds and dry-runs fine but the node rejects
    // the withdrawal reservation at broadcast ("Invalid withdraw reservation").
    if (!transaction.subAccountId && !errors.amount) {
      const cap = addressBalanceSpendCap(account, gasBudget);
      if (cap !== null && amount.gt(cap)) {
        errors.amount = new NotEnoughBalance();
      }
    }
  }
  if (transaction.mode === "delegate") {
    if (amount.lt(new BigNumber(ONE_SUI))) {
      errors.amount = new OneSuiMinForStake();
    }

    // 0.1 SUI
    if (account.balance.minus(transaction.amount).lt(ONE_SUI / 10))
      warnings.amount = new SomeSuiForUnstake();
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount: amount.lt(0) ? new BigNumber(0) : amount,
    totalSpent,
  };
};

export default getTransactionStatus;

import { getAccountCurrency } from "@ledgerhq/coin-framework/account";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  InvalidAddressBecauseDestinationIsAlsoSource,
  FeeTooHigh,
  AmountRequired,
} from "@ledgerhq/errors";
import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { DECIMALS_LIMIT, MIN_DELEGATION_AMOUNT } from "./constants";
import {
  MultiversXDecimalsLimitReached,
  MultiversXMinDelegatedAmountError,
  MultiversXMinUndelegatedAmountError,
  MultiversXDelegationBelowMinimumError,
  NotEnoughEGLDForFees,
} from "./errors";
import { isValidAddress, isSelfTransaction, isAmountSpentFromBalance } from "./logic";
import type { MultiversXAccount, Transaction, TransactionStatus } from "./types";

export const getTransactionStatus: AccountBridge<
  Transaction,
  MultiversXAccount,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (isSelfTransaction(account, transaction)) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!isValidAddress(transaction.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  }

  if (!transaction.fees) {
    errors.fees = new FeeNotLoaded();
  }

  if (
    !errors.amount &&
    transaction.amount.eq(0) &&
    !transaction.useAllAmount &&
    !["unDelegate", "withdraw", "reDelegateRewards", "claimRewards"].includes(transaction.mode)
  ) {
    errors.amount = new AmountRequired();
  }

  let totalSpent = new BigNumber(0); // Will be in token amount for token transactions
  let totalSpentEgld = new BigNumber(0); // Amount spent in main currency (EGLD)

  const tokenAccount =
    (transaction.subAccountId &&
      account.subAccounts &&
      account.subAccounts.find(ta => ta.id === transaction.subAccountId)) ||
    null;

  if (tokenAccount) {
    totalSpent = transaction.amount;
    totalSpentEgld = transaction.fees || new BigNumber(0);

    if (!errors.amount && transaction.amount.gt(tokenAccount.balance)) {
      errors.amount = new NotEnoughBalance();
    }

    if (!errors.amount && !totalSpentEgld.decimalPlaces(DECIMALS_LIMIT).isEqualTo(totalSpentEgld)) {
      errors.amount = new MultiversXDecimalsLimitReached();
    }
  } else {
    totalSpent = totalSpentEgld = isAmountSpentFromBalance(transaction.mode)
      ? transaction.fees?.plus(transaction.amount) || transaction.amount
      : transaction.fees || new BigNumber(0);

    if (
      transaction.mode === "send" &&
      transaction.fees &&
      transaction.amount.div(10).lt(transaction.fees)
    ) {
      warnings.feeTooHigh = new FeeTooHigh();
    }

    // All delegate and undelegate transactions must have an amount >= 1 EGLD
    if (!errors.amount && transaction.amount.lt(MIN_DELEGATION_AMOUNT)) {
      const formattedAmount = formatCurrencyUnit(
        getAccountCurrency(account).units[0],
        MIN_DELEGATION_AMOUNT,
        {
          showCode: true,
        },
      );
      if (transaction.mode === "delegate") {
        errors.amount = new MultiversXMinDelegatedAmountError("", {
          formattedAmount,
        });
      } else if (transaction.mode === "unDelegate") {
        errors.amount = new MultiversXMinUndelegatedAmountError("", {
          formattedAmount,
        });
      }
    }

    // When undelegating, unless undelegating all, the delegation must remain >= 1 EGLD
    const delegationBalance = account.multiversxResources.delegations.find(
      d => d.contract === transaction.recipient,
    )?.userActiveStake;

    const delegationRemainingBalance = new BigNumber(delegationBalance || 0).minus(
      transaction.amount,
    );

    const delegationBalanceForbidden =
      delegationRemainingBalance.gt(0) && delegationRemainingBalance.lt(MIN_DELEGATION_AMOUNT);

    if (!errors.amount && transaction.mode === "unDelegate" && delegationBalanceForbidden) {
      const formattedAmount = formatCurrencyUnit(
        getAccountCurrency(account).units[0],
        MIN_DELEGATION_AMOUNT,
        {
          showCode: true,
        },
      );
      errors.amount = new MultiversXDelegationBelowMinimumError("", {
        formattedAmount,
      });
    }
  }

  if (!errors.amount && totalSpentEgld.gt(account.spendableBalance)) {
    errors.amount =
      tokenAccount || !["delegate", "send"].includes(transaction.mode)
        ? new NotEnoughEGLDForFees()
        : new NotEnoughBalance();
  }

  return {
    errors,
    warnings,
    estimatedFees: transaction.fees || new BigNumber(0),
    amount: transaction.amount,
    totalSpent,
  };
};

export default getTransactionStatus;

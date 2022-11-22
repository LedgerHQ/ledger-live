import BigNumber from "bignumber.js";
import {
  NotEnoughBalance,
  NotEnoughBalanceInParentAccount,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  InvalidAddressBecauseDestinationIsAlsoSource,
  FeeTooHigh,
  AmountRequired,
} from "@ledgerhq/errors";
import { formatCurrencyUnit } from "../../currencies";
import { getAccountUnit } from "../../account";
import { DECIMALS_LIMIT, MIN_DELEGATION_AMOUNT } from "./constants";
import type { ElrondAccount, Transaction, TransactionStatus } from "./types";
import {
  isValidAddress,
  isSelfTransaction,
  isAmountSpentFromBalance,
} from "./logic";
import {
  ElrondDecimalsLimitReached,
  ElrondMinDelegatedAmountError,
  ElrondMinUndelegatedAmountError,
  ElrondDelegationBelowMinimumError,
} from "./errors";

const getTransactionStatus = async (
  a: ElrondAccount,
  t: Transaction
): Promise<TransactionStatus> => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  if (!t.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (isSelfTransaction(a, t)) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!isValidAddress(t.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: a.currency.name,
    });
  }

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  if (!errors.amount && t.amount.eq(0) && !t.useAllAmount) {
    errors.amount = new AmountRequired();
  }

  let totalSpent = new BigNumber(0);

  const tokenAccount =
    (t.subAccountId &&
      a.subAccounts &&
      a.subAccounts.find((ta) => ta.id === t.subAccountId)) ||
    null;

  if (tokenAccount) {
    totalSpent = t.fees || new BigNumber(0); // totalSpent in EGLD, not token currency

    if (!errors.amount && t.amount.gt(tokenAccount.balance)) {
      errors.amount = new NotEnoughBalance();
    }

    if (
      !errors.amount &&
      !totalSpent.decimalPlaces(DECIMALS_LIMIT).isEqualTo(totalSpent)
    ) {
      errors.amount = new ElrondDecimalsLimitReached();
    }
  } else {
    totalSpent = isAmountSpentFromBalance(t.mode)
      ? t.fees?.plus(t.amount) || t.amount
      : t.fees || new BigNumber(0);

    if (t.mode === "send" && t.fees && t.amount.div(10).lt(t.fees)) {
      warnings.feeTooHigh = new FeeTooHigh();
    }

    // All delegate and undelegate transactions must have an amount >= 1 EGLD
    if (!errors.amount && t.amount.lt(MIN_DELEGATION_AMOUNT)) {
      const formattedAmount = formatCurrencyUnit(
        getAccountUnit(a),
        MIN_DELEGATION_AMOUNT,
        {
          showCode: true,
        }
      );
      if (t.mode === "delegate") {
        errors.amount = new ElrondMinDelegatedAmountError("", {
          formattedAmount,
        });
      } else if (t.mode === "unDelegate") {
        errors.amount = new ElrondMinUndelegatedAmountError("", {
          formattedAmount,
        });
      }
    }

    // All delegations must be >= 1 EGLD
    const delegationBalance = a.elrondResources.delegations.find(
      (d) => d.contract === t.recipient
    )?.userActiveStake;

    const delegationBalanceBelowMinimum =
      delegationBalance &&
      new BigNumber(delegationBalance)
        .minus(t.amount)
        .lt(MIN_DELEGATION_AMOUNT);

    if (
      !errors.amount &&
      t.mode === "unDelegate" &&
      delegationBalanceBelowMinimum
    ) {
      const formattedAmount = formatCurrencyUnit(
        getAccountUnit(a),
        MIN_DELEGATION_AMOUNT,
        {
          showCode: true,
        }
      );
      errors.amount = new ElrondDelegationBelowMinimumError("", {
        formattedAmount,
      });
    }
  }

  if (!errors.amount && totalSpent.gt(a.spendableBalance)) {
    errors.amount = tokenAccount
      ? new NotEnoughBalanceInParentAccount()
      : new NotEnoughBalance();
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees: t.fees || new BigNumber(0),
    amount: t.amount,
    totalSpent,
  });
};

export default getTransactionStatus;

import BigNumber from "bignumber.js";
import {
  NotEnoughBalance,
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
import { isValidAddress, isSelfTransaction, isAmountSpentFromBalance } from "./logic";
import {
  ElrondDecimalsLimitReached,
  ElrondMinDelegatedAmountError,
  ElrondMinUndelegatedAmountError,
  ElrondDelegationBelowMinimumError,
  NotEnoughEGLDForFees,
} from "./errors";

const getTransactionStatus = async (
  a: ElrondAccount,
  t: Transaction,
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

  if (
    !errors.amount &&
    t.amount.eq(0) &&
    !t.useAllAmount &&
    !["unDelegate", "withdraw", "reDelegateRewards", "claimRewards"].includes(t.mode)
  ) {
    errors.amount = new AmountRequired();
  }

  let totalSpent = new BigNumber(0); // Will be in token amount for token transacations
  let totalSpentEgld = new BigNumber(0); // Amount spent in main currency (EGLD)

  const tokenAccount =
    (t.subAccountId && a.subAccounts && a.subAccounts.find(ta => ta.id === t.subAccountId)) || null;

  if (tokenAccount) {
    totalSpent = t.amount;
    totalSpentEgld = t.fees || new BigNumber(0);

    if (!errors.amount && t.amount.gt(tokenAccount.balance)) {
      errors.amount = new NotEnoughBalance();
    }

    if (!errors.amount && !totalSpentEgld.decimalPlaces(DECIMALS_LIMIT).isEqualTo(totalSpentEgld)) {
      errors.amount = new ElrondDecimalsLimitReached();
    }
  } else {
    totalSpent = totalSpentEgld = isAmountSpentFromBalance(t.mode)
      ? t.fees?.plus(t.amount) || t.amount
      : t.fees || new BigNumber(0);

    if (t.mode === "send" && t.fees && t.amount.div(10).lt(t.fees)) {
      warnings.feeTooHigh = new FeeTooHigh();
    }

    // All delegate and undelegate transactions must have an amount >= 1 EGLD
    if (!errors.amount && t.amount.lt(MIN_DELEGATION_AMOUNT)) {
      const formattedAmount = formatCurrencyUnit(getAccountUnit(a), MIN_DELEGATION_AMOUNT, {
        showCode: true,
      });
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

    // When undelegating, unless undelegating all, the delegation must remain >= 1 EGLD
    const delegationBalance = a.elrondResources.delegations.find(
      d => d.contract === t.recipient,
    )?.userActiveStake;

    const delegationRemainingBalance = new BigNumber(delegationBalance || 0).minus(t.amount);

    const delegationBalanceForbidden =
      delegationRemainingBalance.gt(0) && delegationRemainingBalance.lt(MIN_DELEGATION_AMOUNT);

    if (!errors.amount && t.mode === "unDelegate" && delegationBalanceForbidden) {
      const formattedAmount = formatCurrencyUnit(getAccountUnit(a), MIN_DELEGATION_AMOUNT, {
        showCode: true,
      });
      errors.amount = new ElrondDelegationBelowMinimumError("", {
        formattedAmount,
      });
    }
  }

  if (!errors.amount && totalSpentEgld.gt(a.spendableBalance)) {
    errors.amount =
      tokenAccount || !["delegate", "send"].includes(t.mode)
        ? new NotEnoughEGLDForFees()
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

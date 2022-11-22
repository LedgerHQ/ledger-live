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
import { getCryptoCurrencyById, formatCurrencyUnit } from "../../currencies";
import { DECIMALS_LIMIT, MIN_DELEGATION_AMOUNT } from "./constants";
import type { ElrondAccount, Transaction, TransactionStatus } from "./types";
import {
  isValidAddress,
  isSelfTransaction,
  isAmountSpentFromBalance,
} from "./logic";
import {
  DecimalsLimitReached,
  MinDelegatedAmountError,
  MinUndelegatedAmountError,
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
      errors.amount = new DecimalsLimitReached();
    }
  } else {
    totalSpent = isAmountSpentFromBalance(t.mode)
      ? t.fees?.plus(t.amount) || t.amount
      : t.fees || new BigNumber(0);

    if (t.mode === "send" && t.fees && t.amount.div(10).lt(t.fees)) {
      warnings.feeTooHigh = new FeeTooHigh();
    }

    if (!errors.amount && t.amount.lt(MIN_DELEGATION_AMOUNT)) {
      const egld = getCryptoCurrencyById("elrond").units[0];
      const formattedAmount = formatCurrencyUnit(egld, MIN_DELEGATION_AMOUNT, {
        showCode: true,
      });
      if (t.mode === "delegate") {
        errors.amount = new MinDelegatedAmountError("", {
          formattedAmount,
        });
      } else if (t.mode === "unDelegate") {
        errors.amount = new MinUndelegatedAmountError("", {
          formattedAmount,
        });
      }
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

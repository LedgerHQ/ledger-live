import {
  AmountRequired,
  FeeNotLoaded,
  FeeRequired,
  FeeTooHigh,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalanceBecauseDestinationNotCreated,
  NotEnoughSpendableBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import { isValidClassicAddress } from "ripple-address-codec";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { getServerInfos } from "../network";
import { cachedRecipientIsNew, parseAPIValue } from "../logic";
import { Transaction, TransactionStatus } from "../types";

export const getTransactionStatus: AccountBridge<
  Transaction,
  Account,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const serverInfos = await getServerInfos();
  const reserveBaseXRP = parseAPIValue(
    serverInfos.info.validated_ledger.reserve_base_xrp.toString(),
  );
  const estimatedFees = new BigNumber(transaction.fee || 0);
  const totalSpent = new BigNumber(transaction.amount).plus(estimatedFees);
  const amount = new BigNumber(transaction.amount);

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  if (!transaction.fee) {
    errors.fee = new FeeNotLoaded();
  } else if (transaction.fee.eq(0)) {
    errors.fee = new FeeRequired();
  } else if (totalSpent.gt(account.balance.minus(reserveBaseXRP))) {
    errors.amount = new NotEnoughSpendableBalance("", {
      minimumAmount: formatCurrencyUnit(account.currency.units[0], reserveBaseXRP, {
        disableRounding: true,
        useGrouping: false,
        showCode: true,
      }),
    });
  } else if (
    transaction.recipient &&
    (await cachedRecipientIsNew(transaction.recipient)) &&
    transaction.amount.lt(reserveBaseXRP)
  ) {
    errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
      minimalAmount: formatCurrencyUnit(account.currency.units[0], reserveBaseXRP, {
        disableRounding: true,
        useGrouping: false,
        showCode: true,
      }),
    });
  }

  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (account.freshAddress === transaction.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!isValidClassicAddress(transaction.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  }

  if (!errors.amount && amount.eq(0)) {
    errors.amount = new AmountRequired();
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};

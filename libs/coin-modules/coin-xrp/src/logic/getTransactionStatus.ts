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
import { isValidClassicAddress } from "ripple-address-codec";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { getServerInfos } from "../network";
import { cachedRecipientIsNew, parseAPIValue } from ".";
import { Transaction, TransactionValidation, Account } from "@ledgerhq/coin-framework/api/types";

export const getTransactionStatus = async (
  account: Account,
  transaction: Transaction,
): Promise<TransactionValidation> => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const serverInfos = await getServerInfos();
  const reserveBaseXRP = parseAPIValue(
    serverInfos.info.validated_ledger.reserve_base_xrp.toString(),
  );
  const estimatedFees = transaction.fee || 0n;
  const totalSpent = transaction.amount + estimatedFees;
  const amount = transaction.amount;

  if (amount > 0 && estimatedFees * 10n > amount) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  if (!transaction.fee) {
    errors.fee = new FeeNotLoaded();
  } else if (transaction.fee == 0n) {
    errors.fee = new FeeRequired();
  } else if (totalSpent > account.balance - BigInt(reserveBaseXRP.toString())) {
    errors.amount = new NotEnoughSpendableBalance("", {
      minimumAmount: formatCurrencyUnit(account.currencyUnit, reserveBaseXRP, {
        disableRounding: true,
        useGrouping: false,
        showCode: true,
      }),
    });
  } else if (
    transaction.recipient &&
    (await cachedRecipientIsNew(transaction.recipient)) &&
    transaction.amount < BigInt(reserveBaseXRP.toString())
  ) {
    errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
      minimalAmount: formatCurrencyUnit(account.currencyUnit, reserveBaseXRP, {
        disableRounding: true,
        useGrouping: false,
        showCode: true,
      }),
    });
  }

  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (account.address === transaction.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!isValidClassicAddress(transaction.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currencyName,
    });
  }

  if (!errors.amount && amount == 0n) {
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

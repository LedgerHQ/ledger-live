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
import { cachedRecipientIsNew } from "./utils";
import { parseAPIValue } from "./common";
import {
  Transaction,
  TransactionValidation,
  Account,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/types";
import { XrpMapMemo } from "../types";
import { getBalance } from "./getBalance";

export const getTransactionStatus = async (
  transactionIntent: TransactionIntent<XrpMapMemo>,
): Promise<TransactionValidation> => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const serverInfos = await getServerInfos();
  const reserveBaseXRP = parseAPIValue(
    serverInfos.info.validated_ledger.reserve_base_xrp.toString(),
  );
  const estimatedFees = transactionIntent.fees || 0n;
  const totalSpent = transactionIntent.amount + estimatedFees;
  const amount = transactionIntent.amount;

  if (amount > 0 && estimatedFees * 10n > amount) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  const balances = await getBalance(transactionIntent.sender);
  const nativeBalance = balances.find(b => b.asset.type === "native");
  if (nativeBalance === undefined) {
    throw Error("Shouldn't happen");
  }

  let account = {
    currencyName: transactionIntent.asset, // FIXME: assetname,
    // currencyUnit: transactionIntent.asset // FIXME: asset currency unit?,
  };

  if (!transactionIntent.fees) {
    errors.fee = new FeeNotLoaded();
  } else if (transactionIntent.fees == 0n) {
    errors.fee = new FeeRequired();
  } else if (totalSpent > nativeBalance.value - BigInt(reserveBaseXRP.toString())) {
    errors.amount = new NotEnoughSpendableBalance("", {
      minimumAmount: 0,
      // FIXME: fix this
      // minimumAmount: formatCurrencyUnit(account.currencyUnit, reserveBaseXRP, {
      //   disableRounding: true,
      //   useGrouping: false,
      //   showCode: true,
      // }),
    });
  } else if (
    transactionIntent.recipient &&
    (await cachedRecipientIsNew(transactionIntent.recipient)) &&
    transactionIntent.amount < BigInt(reserveBaseXRP.toString())
  ) {
    errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
      minimalAmount: 0,
      // minimalAmount: formatCurrencyUnit(account.currencyUnit, reserveBaseXRP, {
      //   disableRounding: true,
      //   useGrouping: false,
      //   showCode: true,
      // }),
    });
  }

  if (!transactionIntent.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (transactionIntent.sender === transactionIntent.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!isValidClassicAddress(transactionIntent.recipient)) {
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

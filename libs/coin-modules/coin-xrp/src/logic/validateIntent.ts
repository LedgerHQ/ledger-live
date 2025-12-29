import {
  AmountRequired,
  FeeNotLoaded,
  FeeTooHigh,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalanceBecauseDestinationNotCreated,
  NotEnoughSpendableBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { isValidClassicAddress } from "ripple-address-codec";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import {
  TransactionValidation,
  TransactionIntent,
  FeeEstimation,
} from "@ledgerhq/coin-framework/api/types";
import { getServerInfos } from "../network";
import { XrpMapMemo } from "../types";
import { cachedRecipientIsNew } from "./utils";
import { parseAPIValue } from "./common";
import { getBalance } from "./getBalance";

export const validateIntent = async (
  transactionIntent: TransactionIntent<XrpMapMemo>,
  customFees?: FeeEstimation,
): Promise<TransactionValidation> => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const serverInfos = await getServerInfos();
  const reserveBaseXRP = parseAPIValue(
    serverInfos.info.validated_ledger.reserve_base_xrp.toString(),
  );
  const estimatedFees = customFees?.value || 0n;
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

  if (!estimatedFees) {
    errors.fee = new FeeNotLoaded();
  } else if (totalSpent > nativeBalance.value - BigInt(reserveBaseXRP.toString())) {
    errors.amount = new NotEnoughSpendableBalance("", {
      minimumAmount: transactionIntent.asset.unit
        ? formatCurrencyUnit(transactionIntent.asset.unit, reserveBaseXRP, {
            disableRounding: true,
            useGrouping: false,
            showCode: true,
          })
        : "Unknown unit",
    });
  } else if (
    transactionIntent.recipient &&
    (await cachedRecipientIsNew(transactionIntent.recipient)) &&
    transactionIntent.amount < BigInt(reserveBaseXRP.toString())
  ) {
    errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
      minimalAmount: transactionIntent.asset.unit
        ? formatCurrencyUnit(transactionIntent.asset.unit, reserveBaseXRP, {
            disableRounding: true,
            useGrouping: false,
            showCode: true,
          })
        : "Unknown unit",
    });
  }

  if (!transactionIntent.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (transactionIntent.sender === transactionIntent.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!isValidClassicAddress(transactionIntent.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: transactionIntent.asset.name ?? "",
    });
  }

  if (!errors.amount && amount === 0n) {
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

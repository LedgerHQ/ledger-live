import BigNumber from "bignumber.js";
import {
  AmountRequired,
  NotEnoughBalance,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  RecipientRequired,
} from "@ledgerhq/errors";
import { AccountId } from "@hashgraph/sdk";
import type { AccountBridge } from "@ledgerhq/types-live";
import { calculateAmount, getEstimatedFees } from "./utils";
import type { HederaAccount, Transaction } from "../types";
import { isUpdateAccountTransaction } from "../logic";
import { getCurrentHederaPreloadData } from "../preload-data";
import { HederaInvalidStakedNodeIdError, HederaRedundantStakedNodeIdError } from "../errors";

export const getTransactionStatus: AccountBridge<
  Transaction,
  HederaAccount
>["getTransactionStatus"] = async (account, transaction) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const isUpdateAccountFlow = isUpdateAccountTransaction(transaction);

  if (isUpdateAccountFlow) {
    const { validators } = getCurrentHederaPreloadData(account.currency);
    const estimatedFees = await getEstimatedFees(account, "CryptoUpdate");
    const amount = BigNumber(0);
    const totalSpent = amount.plus(estimatedFees);

    // FIXME: review
    if (["delegate", "redelegate"].includes(transaction.properties.mode)) {
      if (typeof transaction.properties.stakedNodeId !== "number") {
        errors.missingStakedNodeId = new HederaInvalidStakedNodeIdError("Validator must be set");
      } else {
        const isValid = validators.some(validator => {
          return validator.nodeId === transaction.properties.stakedNodeId;
        });

        if (!isValid) {
          errors.stakedNodeId = new HederaInvalidStakedNodeIdError();
        }
      }

      if (account.hederaResources?.delegation?.nodeId === transaction.properties.stakedNodeId) {
        errors.stakedNodeId = new HederaRedundantStakedNodeIdError();
      }
    }

    return {
      amount: new BigNumber(0),
      estimatedFees,
      totalSpent,
      errors,
      warnings,
    };
  }

  if (!transaction.recipient || transaction.recipient.length === 0) {
    errors.recipient = new RecipientRequired("");
  } else {
    if (account.freshAddress === transaction.recipient) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource("");
    }

    try {
      AccountId.fromString(transaction.recipient);
    } catch (err) {
      errors.recipient = new InvalidAddress("", {
        currencyName: account.currency.name,
      });
    }
  }

  const { amount, totalSpent } = await calculateAmount({
    transaction,
    account,
  });

  if (transaction.amount.eq(0) && !transaction.useAllAmount) {
    errors.amount = new AmountRequired();
  } else if (account.balance.isLessThan(totalSpent)) {
    errors.amount = new NotEnoughBalance("");
  }

  const estimatedFees = await getEstimatedFees(account, "CryptoTransfer");

  return {
    amount,
    estimatedFees,
    totalSpent,
    errors,
    warnings,
  };
};

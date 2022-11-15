import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import {
  AmountRequired,
  NotEnoughBalance,
  FeeNotLoaded,
  DustLimit,
  FeeTooHigh,
  FeeRequired,
} from "@ledgerhq/errors";
import type { Account } from "@ledgerhq/types-live";

import type { Transaction, TransactionStatus } from "./types";
import { calculateFees, validateRecipient, isTaprootRecipient } from "./cache";
import { TaprootNotActivated } from "./errors";
import { computeDustAmount } from "./wallet-btc/utils";
import { Currency } from "./wallet-btc";
import cryptoFactory from "./wallet-btc/crypto/factory";

const getTransactionStatus = async (
  a: Account,
  t: Transaction
): Promise<TransactionStatus> => {
  const errors: any = {};
  const warnings: any = {};
  const useAllAmount = !!t.useAllAmount;
  const { recipientError, recipientWarning } = await validateRecipient(
    a.currency,
    t.recipient
  );

  if (recipientError) {
    errors.recipient = recipientError;
  }

  if (recipientWarning) {
    warnings.recipient = recipientWarning;
  }

  // Safeguard before Taproot activation
  if (
    t.recipient &&
    !errors.recipient &&
    a.currency.id === "bitcoin" &&
    a.blockHeight <= 709632
  ) {
    const isTaproot = await isTaprootRecipient(a.currency, t.recipient);
    if (isTaproot) {
      errors.recipient = new TaprootNotActivated();
    }
  }

  let txInputs;
  let txOutputs;
  let estimatedFees = new BigNumber(0);

  if (!t.feePerByte) {
    errors.feePerByte = new FeeNotLoaded();
  } else if (t.feePerByte.eq(0)) {
    errors.feePerByte = new FeeRequired();
  } else if (t.recipient && !errors.recipient) {
    await calculateFees({
      account: a,
      transaction: t,
    }).then(
      (res) => {
        txInputs = res.txInputs;
        txOutputs = res.txOutputs;
        estimatedFees = res.fees;
      },
      (error) => {
        if (error.name === "NotEnoughBalance") {
          errors.amount = error;
        } else if (error.name === "DustLimit") {
          errors.dustLimit = error;
        } else {
          throw error;
        }
      }
    );
  }

  const sumOfInputs = (txInputs || []).reduce(
    (sum, input) => sum.plus(input.value),
    new BigNumber(0)
  );

  const sumOfChanges = (txOutputs || [])
    .filter((o) => o.isChange)
    .reduce((sum, output) => sum.plus(output.value), new BigNumber(0));

  if (txInputs) {
    log("bitcoin", `${txInputs.length} inputs, sum: ${sumOfInputs.toString()}`);
  }

  if (txOutputs) {
    log(
      "bitcoin",
      `${txOutputs.length} outputs, sum of changes: ${sumOfChanges.toString()}`
    );
  }

  const totalSpent = sumOfInputs.minus(sumOfChanges);
  const amount = useAllAmount ? totalSpent.minus(estimatedFees) : t.amount;
  log(
    "bitcoin",
    `totalSpent ${totalSpent.toString()} amount ${amount.toString()}`
  );

  if (!errors.amount && !amount.gt(0)) {
    errors.amount = useAllAmount
      ? new NotEnoughBalance()
      : new AmountRequired();
  }

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  const txSize = Math.ceil(estimatedFees.toNumber() / t.feePerByte!.toNumber());
  const crypto = cryptoFactory(a.currency.id as Currency);
  const dustAmount = computeDustAmount(crypto, txSize);

  if (amount.gt(0) && amount.lt(dustAmount)) {
    errors.dustLimit = new DustLimit();
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
    txInputs,
    txOutputs,
  };
};

export default getTransactionStatus;

import {
  AmountRequired,
  NotEnoughBalance,
  FeeNotLoaded,
  DustLimit,
  FeeTooHigh,
  FeeRequired,
  OpReturnDataSizeLimit,
} from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import type { Account, AccountBridge } from "@ledgerhq/types-live";
import type { BitcoinInput, BitcoinOutput, Transaction, TransactionStatus } from "./types";
import { calculateFees, validateRecipient, isTaprootRecipient } from "./cache";
import { OP_RETURN_DATA_SIZE_LIMIT } from "./wallet-btc/crypto/base";
import cryptoFactory from "./wallet-btc/crypto/factory";
import { computeDustAmount } from "./wallet-btc/utils";
import { TaprootNotActivated } from "./errors";
import { Currency } from "./wallet-btc";
import { isAddressSanctioned } from "@ledgerhq/coin-framework/sanction/index";
import { AddressesSanctionedError } from "@ledgerhq/coin-framework/sanction/errors";

export const MAX_BLOCK_HEIGHT_FOR_TAPROOT = 709632;

export const getTransactionStatus: AccountBridge<
  Transaction,
  Account,
  TransactionStatus
>["getTransactionStatus"] = async (account: Account, transaction: Transaction) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const useAllAmount = !!transaction.useAllAmount;
  const { recipientError, recipientWarning } = await validateRecipient(
    account.currency,
    transaction.recipient,
  );

  // For a PSBT tx we do not provide the recipient so we do not throw a RecipientRequired error
  if (recipientError && !transaction.psbt) {
    errors.recipient = recipientError;
  }

  if (recipientWarning && !transaction.psbt) {
    warnings.recipient = recipientWarning;
  }

  // Safeguard before Taproot activation
  if (
    transaction.recipient &&
    !errors.recipient &&
    account.currency.id === "bitcoin" &&
    account.blockHeight <= MAX_BLOCK_HEIGHT_FOR_TAPROOT
  ) {
    const isTaproot = await isTaprootRecipient(account.currency, transaction.recipient);
    if (isTaproot) {
      errors.recipient = new TaprootNotActivated();
    }
  }

  let txInputs: BitcoinInput[] = [];
  let txOutputs: BitcoinOutput[] = [];
  let estimatedFees = new BigNumber(0);
  const { opReturnData } = transaction;

  if (!transaction.feePerByte) {
    errors.feePerByte = new FeeNotLoaded();
  } else if (transaction.feePerByte.eq(0)) {
    errors.feePerByte = new FeeRequired();
  } else if (transaction.recipient && !errors.recipient) {
    await calculateFees({
      account: account,
      transaction: transaction,
    }).then(
      res => {
        txInputs = res.txInputs;
        txOutputs = res.txOutputs;
        estimatedFees = res.fees;
      },
      error => {
        if (error.name === "NotEnoughBalance") {
          errors.amount = error;
        } else if (error.name === "DustLimit") {
          errors.dustLimit = error;
        } else {
          throw error;
        }
      },
    );
  }

  const sumOfInputs = txInputs.reduce((sum, input) => sum.plus(input.value ?? 0), new BigNumber(0));

  const sumOfChanges = txOutputs
    .filter(o => o.isChange)
    .reduce((sum, output) => sum.plus(output.value), new BigNumber(0));

  if (txInputs) {
    log("bitcoin", `${txInputs.length} inputs, sum: ${sumOfInputs.toString()}`);

    const sanctionedAddresses: string[] = [];
    for (const input of txInputs) {
      if (input.address) {
        const addressIsSanctioned = await isAddressSanctioned(account.currency, input.address);
        if (addressIsSanctioned) {
          sanctionedAddresses.push(input.address);
        }
      }
    }

    if (sanctionedAddresses.length > 0) {
      errors.sender = new AddressesSanctionedError("AddressesSanctionedError", {
        addresses: sanctionedAddresses,
      });
    }
  }

  if (txOutputs) {
    log("bitcoin", `${txOutputs.length} outputs, sum of changes: ${sumOfChanges.toString()}`);
  }

  const totalSpent = sumOfInputs.minus(sumOfChanges);
  const amount = useAllAmount ? totalSpent.minus(estimatedFees) : transaction.amount;
  log("bitcoin", `totalSpent ${totalSpent.toString()} amount ${amount.toString()}`);

  if (!errors.amount && !amount.gt(0)) {
    errors.amount = useAllAmount ? new NotEnoughBalance() : new AmountRequired();

    // For a PSBT tx we do not provide the amount so we do not throw AmountRequired error
    if (transaction.psbt && !useAllAmount) {
      delete errors.amount;
    }
  }

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  if (transaction.feePerByte) {
    const txSize = Math.ceil(estimatedFees.toNumber() / transaction.feePerByte.toNumber());
    const crypto = cryptoFactory(account.currency.id as Currency);
    const dustAmount = computeDustAmount(crypto, txSize);

    if (amount.gt(0) && amount.lt(dustAmount)) {
      errors.dustLimit = new DustLimit();
    }
  }

  if (opReturnData && opReturnData.length > OP_RETURN_DATA_SIZE_LIMIT) {
    errors.opReturnSizeLimit = new OpReturnDataSizeLimit();
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    opReturnData: opReturnData?.toString(),
    totalSpent,
    txInputs,
    txOutputs,
  };
};

export default getTransactionStatus;

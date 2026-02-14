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
  const { recipientError, recipientWarning, changeAddressError, changeAddressWarning } =
    await validateRecipient(account.currency, transaction.recipient, transaction?.changeAddress);

  if (recipientError) {
    errors.recipient = recipientError;
  }

  if (recipientWarning) {
    warnings.recipient = recipientWarning;
  }

  if (changeAddressError) {
    errors.changeAddress = changeAddressError;
  }

  if (changeAddressWarning) {
    warnings.changeAddress = changeAddressWarning;
  }

  // Safeguard before Taproot activation
  if (
    transaction.recipient &&
    !errors.recipient &&
    !errors.changeAddress &&
    account.currency.id === "bitcoin" &&
    account.blockHeight <= MAX_BLOCK_HEIGHT_FOR_TAPROOT
  ) {
    const isTaproot = await isTaprootRecipient(account.currency, transaction.recipient);
    const changeAddressIsTaproot = transaction.changeAddress
      ? await isTaprootRecipient(account.currency, transaction.changeAddress)
      : false;
    if (isTaproot) {
      errors.recipient = new TaprootNotActivated();
    }
    if (changeAddressIsTaproot) {
      errors.changeAddress = new TaprootNotActivated();
    }
  }

  let txInputs: BitcoinInput[] = [];
  let txOutputs: BitcoinOutput[] = [];
  let estimatedFees = new BigNumber(0);
  const { opReturnData, changeAddress } = transaction;

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

  // For RBF cancel transactions, we're sending the same amount as the original tx but to ourselves (change address)
  // The recipient is the change address, so the external amount is effectively cancelled
  const isRbfCancel =
    transaction.replaceTxId && transaction.recipient === transaction.changeAddress;

  if (!errors.amount && !amount.gt(0) && !isRbfCancel) {
    errors.amount = useAllAmount ? new NotEnoughBalance() : new AmountRequired();
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
    changeAddress,
  };
};

export default getTransactionStatus;

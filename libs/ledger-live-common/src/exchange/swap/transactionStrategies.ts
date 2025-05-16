import { BigNumber } from "bignumber.js";
import {
  CosmosTransaction,
  ElrondTransaction,
  RippleTransaction,
  SolanaTransaction,
  StellarTransaction,
  TonTransaction,
  Transaction,
} from "@ledgerhq/wallet-api-core";
import { TransactionWithCustomFee } from "./types";
export type { SwapLiveError } from "@ledgerhq/wallet-api-exchange-module";

export function defaultTransaction({
  family,
  amount,
  recipient,
  customFeeConfig,
}: TransactionWithCustomFee): Transaction {
  return {
    family,
    amount,
    recipient,
    ...customFeeConfig,
  } as Transaction;
}

export function modeSendTransaction({
  family,
  amount,
  recipient,
  customFeeConfig,
}: TransactionWithCustomFee): Transaction {
  return {
    ...defaultTransaction({ family, amount, recipient, customFeeConfig }),
    mode: "send",
  };
}

export function stellarTransaction({
  family,
  amount,
  recipient,
  customFeeConfig,
  payinExtraId,
  customErrorType,
}: TransactionWithCustomFee): StellarTransaction {
  if (!payinExtraId)
    throw {
      error: new Error("Missing payinExtraId"),
      step: "PayinExtraIdStepError",
      customErrorType,
    };

  return {
    ...defaultTransaction({ family, amount, recipient, customFeeConfig }),
    memoValue: payinExtraId,
    memoType: "MEMO_TEXT",
  } as StellarTransaction;
}

export function rippleTransaction({
  family,
  amount,
  recipient,
  customFeeConfig,
  payinExtraId,
  customErrorType,
}: TransactionWithCustomFee): RippleTransaction {
  if (!payinExtraId)
    throw {
      error: new Error("Missing payinExtraId"),
      step: "PayinExtraIdStepError",
      customErrorType,
    };

  return {
    ...defaultTransaction({ family, amount, recipient, customFeeConfig }),
    tag: new BigNumber(payinExtraId).toNumber(),
  } as RippleTransaction;
}

// Function to remove gasLimit from customFeeConfig for Ethereum or Bitcoin
export function withoutGasLimitTransaction({
  family,
  amount,
  recipient,
  customFeeConfig,
  extraTransactionParameters,
}: TransactionWithCustomFee): Transaction {
  delete customFeeConfig.gasLimit;
  if (extraTransactionParameters) {
    return {
      family,
      amount,
      recipient,
      ...customFeeConfig,
      data: Buffer.from(extraTransactionParameters, "hex"),
    } as Transaction;
  }
  return defaultTransaction({ family, amount, recipient, customFeeConfig });
}

export function bitcoinTransaction({
  family,
  amount,
  recipient,
  customFeeConfig,
  extraTransactionParameters,
}: TransactionWithCustomFee): Transaction {
  if (extraTransactionParameters) {
    return {
      family,
      amount,
      recipient,
      ...customFeeConfig,
      opReturnData: Buffer.from(extraTransactionParameters, "utf-8"),
    } as Transaction;
  }
  return {
    family,
    amount,
    recipient,
    ...customFeeConfig,
  } as Transaction;
}

export function solanaTransaction({
  family,
  amount,
  recipient,
  customFeeConfig,
}: TransactionWithCustomFee): SolanaTransaction {
  return {
    ...defaultTransaction({ family, amount, recipient, customFeeConfig }),
    model: { kind: "transfer", uiState: {} },
  } as SolanaTransaction;
}

export function elrondTransaction({
  family,
  amount,
  recipient,
  customFeeConfig,
}: TransactionWithCustomFee): ElrondTransaction {
  return {
    ...modeSendTransaction({ family, amount, recipient, customFeeConfig }),
    gasLimit: 0, // FIXME: Placeholder, adjust as needed
  } as ElrondTransaction;
}

export function tonTransaction({
  family,
  amount,
  recipient,
  customFeeConfig,
}: TransactionWithCustomFee): TonTransaction {
  return {
    ...defaultTransaction({ family, amount, recipient, customFeeConfig }),
    comment: { isEncrypted: false, text: "" },
    fees: new BigNumber(0), // Set default value as completeExchange call prepareTransaction, which set again fees.
  } as TonTransaction;
}

export function cosmosTransaction({
  family,
  amount,
  recipient,
  customFeeConfig,
  payinExtraId,
}: TransactionWithCustomFee): CosmosTransaction {
  return {
    ...defaultTransaction({ family, amount, recipient, customFeeConfig }),
    memo: payinExtraId ?? undefined,
  } as CosmosTransaction;
}

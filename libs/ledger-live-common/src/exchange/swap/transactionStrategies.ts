import { BigNumber } from "bignumber.js";

import {
  CosmosTransaction,
  ElrondTransaction,
  RippleTransaction,
  SolanaTransaction,
  StellarTransaction,
  TonTransaction,
  Transaction,
  TransactionCommon,
} from "@ledgerhq/wallet-api-client";

export type { SwapLiveError } from "@ledgerhq/wallet-api-exchange-module";

export function defaultTransaction({
  family,
  amount,
  recipient,
  customFeeConfig,
}: TransactionWithCustomFee): Transaction {
  return <Transaction>{
    family,
    amount,
    recipient,
    ...customFeeConfig,
  };
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
    family: "stellar",
    memoValue: payinExtraId,
    memoType: "MEMO_TEXT",
  };
}

export function rippleTransaction({
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

  const transaction: RippleTransaction = {
    family: "ripple",
    amount,
    recipient,
    ...customFeeConfig,
    tag: new BigNumber(payinExtraId).toNumber(),
  };
  return transaction;
}

// Function to remove gasLimit from customFeeConfig for Ethereum or Bitcoin
export function withoutGasLimitTransaction({
  family,
  amount,
  recipient,
  customFeeConfig,
  extraTransactionParameters,
}: TransactionWithCustomFee): Transaction {
  if (customFeeConfig?.gasLimit) {
    delete customFeeConfig.gasLimit;
  }

  if (extraTransactionParameters) {
    return <Transaction>{
      family,
      amount,
      recipient,
      ...customFeeConfig,
      data: Buffer.from(extraTransactionParameters, "hex"),
    };
  }
  return defaultTransaction({ family, amount, recipient, customFeeConfig });
}

export function bitcoinTransaction({
  amount,
  recipient,
  customFeeConfig,
  extraTransactionParameters,
}: TransactionWithCustomFee): Transaction {
  if (extraTransactionParameters) {
    return {
      family: "bitcoin",
      amount,
      recipient,
      ...customFeeConfig,
      opReturnData: Buffer.from(extraTransactionParameters, "utf-8"),
    };
  }
  return {
    family: "bitcoin",
    amount,
    recipient,
    ...customFeeConfig,
  };
}

export function solanaTransaction({
  family,
  amount,
  recipient,
  customFeeConfig,
}: TransactionWithCustomFee): SolanaTransaction {
  return {
    ...defaultTransaction({ family, amount, recipient, customFeeConfig }),
    family: "solana",
    model: { kind: "transfer", uiState: {} },
  };
}

export function elrondTransaction({
  amount,
  recipient,
  customFeeConfig,
}: TransactionWithCustomFee): ElrondTransaction {
  const transaction: ElrondTransaction = {
    family: "elrond",
    amount,
    recipient,
    mode: "send",
    ...customFeeConfig,
    gasLimit: 0, // FIXME: Placeholder, adjust as needed
  };
  return transaction;
}

function tonTransaction({
  family,
  amount,
  recipient,
  customFeeConfig,
}: TransactionWithCustomFee): TonTransaction {
  return {
    ...defaultTransaction({ family, amount, recipient, customFeeConfig }),
    family: "ton",
    comment: { isEncrypted: false, text: "" },
    fees: new BigNumber(0), // Set default value as completeExchange call prepareTransaction, which set again fees.
  };
}

export function cosmosTransaction({
  family,
  amount,
  recipient,
  customFeeConfig,
  payinExtraId,
}: TransactionWithCustomFee): CosmosTransaction {
  return <CosmosTransaction>{
    ...defaultTransaction({ family, amount, recipient, customFeeConfig }),
    family: "cosmos",
    mode: "send",
    memo: payinExtraId ?? undefined,
  };
}

export type TransactionWithCustomFee = TransactionCommon & {
  customFeeConfig: {
    [key: string]: BigNumber;
  };
  payinExtraId?: string;
  customErrorType?: "swap";
  extraTransactionParameters?: string;
};

// Define a specific type for the strategy functions, assuming they might need parameters
export type TransactionStrategyFunction = (params: TransactionWithCustomFee) => Transaction;

export const transactionStrategy: {
  [K in Transaction["family"]]: TransactionStrategyFunction;
} = {
  algorand: defaultTransaction,
  aptos: defaultTransaction,
  bitcoin: bitcoinTransaction,
  cardano: modeSendTransaction,
  celo: defaultTransaction,
  cosmos: cosmosTransaction,
  crypto_org: defaultTransaction,
  elrond: elrondTransaction,
  ethereum: withoutGasLimitTransaction,
  filecoin: defaultTransaction,
  hedera: defaultTransaction,
  near: modeSendTransaction,
  neo: defaultTransaction,
  polkadot: defaultTransaction,
  ripple: rippleTransaction,
  solana: solanaTransaction,
  stacks: defaultTransaction,
  stellar: stellarTransaction,
  tezos: modeSendTransaction,
  ton: tonTransaction,
  tron: modeSendTransaction,
  vechain: defaultTransaction,
  casper: defaultTransaction,
  sui: defaultTransaction,
  internet_computer: defaultTransaction,
};

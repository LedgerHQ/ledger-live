import { BigNumber } from "bignumber.js";

import { Transaction } from "../../generated/types";
import { TransactionCommon } from "@ledgerhq/types-live";
import { createStepError, StepError, CustomErrorType } from "../../wallet-api/Exchange";
import { getFeature } from "../../featureFlags";

export type { SwapLiveError } from "@ledgerhq/wallet-api-exchange-module";

export function defaultTransaction({
  family,
  amount,
  recipient,
  customFeeConfig,
}: TransactionWithCustomFee): Partial<Transaction> {
  // Type assertion needed because each Transaction family has different required properties
  // This function provides base properties that are then extended by family-specific functions
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {
    family,
    amount,
    recipient,
    ...customFeeConfig,
  } as Partial<Transaction>;
}

export function cardanoTransaction({
  amount,
  recipient,
  customFeeConfig,
}: TransactionWithCustomFee): Partial<Extract<Transaction, { family: "cardano" }>> {
  return {
    family: "cardano",
    amount,
    recipient,
    mode: "send",
    ...customFeeConfig,
  };
}

export function nearTransaction({
  amount,
  recipient,
  customFeeConfig,
}: TransactionWithCustomFee): Extract<Transaction, { family: "near" }> {
  return {
    family: "near",
    amount,
    recipient,
    mode: "send",
    ...customFeeConfig,
  };
}

export function tezosTransaction({
  amount,
  recipient,
  customFeeConfig,
}: TransactionWithCustomFee): Partial<Extract<Transaction, { family: "tezos" }>> {
  return {
    family: "tezos",
    amount,
    recipient,
    mode: "send",
    ...customFeeConfig,
  };
}

export function tronTransaction({
  amount,
  recipient,
  customFeeConfig,
}: TransactionWithCustomFee): Partial<Extract<Transaction, { family: "tron" }>> {
  return {
    family: "tron",
    amount,
    recipient,
    mode: "send",
    ...customFeeConfig,
  };
}

export function stellarTransaction({
  amount,
  recipient,
  customFeeConfig,
  payinExtraId,
  customErrorType,
}: TransactionWithCustomFee): Extract<Transaction, { family: "stellar" }> {
  if (!payinExtraId)
    throw createStepError({
      error: new Error("Missing payinExtraId"),
      step: StepError.PAYIN_EXTRA_ID,
      customErrorType,
    });

  return {
    family: "stellar",
    mode: "send",
    amount,
    recipient,
    ...customFeeConfig,
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
}: TransactionWithCustomFee): Partial<Extract<Transaction, { family: "xrp" }>> {
  if (!payinExtraId)
    throw createStepError({
      error: new Error("Missing payinExtraId"),
      step: StepError.PAYIN_EXTRA_ID,
      customErrorType,
    });

  return {
    family: "xrp",
    amount,
    recipient,
    ...customFeeConfig,
    tag: new BigNumber(payinExtraId).toNumber(),
  };
}

export function evmTransaction({
  amount,
  recipient,
  customFeeConfig,
  extraTransactionParameters,
  sponsored,
}: TransactionWithCustomFee): Partial<Extract<Transaction, { family: "evm" }>> {
  if (customFeeConfig?.gasLimit) {
    delete customFeeConfig.gasLimit;
  }

  if (extraTransactionParameters) {
    return {
      family: "evm" as const,
      amount,
      recipient,
      ...customFeeConfig,
      data: Buffer.from(extraTransactionParameters, "hex"),
      sponsored,
    };
  }
  return {
    family: "evm" as const,
    amount,
    recipient,
    ...customFeeConfig,
    sponsored,
  };
}

export function bitcoinTransaction({
  amount,
  recipient,
  customFeeConfig,
  extraTransactionParameters,
}: TransactionWithCustomFee): Partial<Extract<Transaction, { family: "bitcoin" }>> {
  const baseTransaction = {
    family: "bitcoin" as const,
    amount,
    recipient,
    ...customFeeConfig,
  };

  if (extraTransactionParameters) {
    return {
      ...baseTransaction,
      opReturnData: Buffer.from(extraTransactionParameters, "utf-8"),
    };
  }

  return baseTransaction;
}

export function solanaTransaction({
  amount,
  recipient,
  customFeeConfig: _customFeeConfig,
  extraTransactionParameters,
}: TransactionWithCustomFee): Extract<Transaction, { family: "solana" }> {
  let templateId: string | undefined = undefined;
  let raw: string | undefined = undefined;
  const lifiSolanaFeature = getFeature({ key: "lifiSolana" });

  if (lifiSolanaFeature?.enabled && extraTransactionParameters) {
    try {
      const parsed = JSON.parse(extraTransactionParameters);
      if (typeof parsed?.solanaTransaction?.templateId === "string") {
        templateId = parsed.solanaTransaction.templateId;
      } else {
        console.warn(
          `Template id "${templateId}" found in extraTransactionParameters for solana transaction is not a string, ignored`,
        );
      }

      if (typeof parsed?.solanaTransaction?.data === "string") {
        raw = parsed.solanaTransaction.data;
      } else {
        console.warn(
          `Template id "${templateId}" found in extraTransactionParameters for solana transaction is not a string, ignored`,
        );
      }
    } catch (e) {
      console.warn("Failed to parse extraTransactionParameters", e);
    }
  }

  return {
    family: "solana",
    amount,
    recipient,
    model: { kind: "transfer", uiState: {} },
    ...(raw && { raw }),
    ...(templateId && { templateId }),
  };
}

export function elrondTransaction({
  amount,
  recipient,
  customFeeConfig,
}: TransactionWithCustomFee): Extract<Transaction, { family: "multiversx" }> {
  return {
    family: "multiversx",
    amount,
    recipient,
    mode: "send",
    fees: customFeeConfig.fees || null,
    gasLimit: customFeeConfig.gasLimit ? Number(customFeeConfig.gasLimit) : 0,
  };
}

function tonTransaction({
  amount,
  recipient,
  customFeeConfig: _customFeeConfig,
}: TransactionWithCustomFee): Extract<Transaction, { family: "ton" }> {
  return {
    family: "ton",
    amount,
    recipient,
    comment: { isEncrypted: false, text: "" },
    fees: new BigNumber(0), // Set default value as completeExchange call prepareTransaction, which set again fees.
  };
}

export function cosmosTransaction({
  amount,
  recipient,
  customFeeConfig,
  payinExtraId,
}: TransactionWithCustomFee): Partial<Extract<Transaction, { family: "cosmos" }>> {
  return {
    family: "cosmos",
    amount,
    recipient,
    mode: "send",
    networkInfo: null,
    ...customFeeConfig,
    memo: payinExtraId ?? undefined,
  };
}

export function hederaTransaction({
  amount,
  recipient,
  customFeeConfig,
  payinExtraId,
}: TransactionWithCustomFee): Partial<Extract<Transaction, { family: "hedera" }>> {
  return {
    family: "hedera",
    amount,
    recipient,
    ...customFeeConfig,
    memo: payinExtraId ?? undefined,
  };
}

export type TransactionWithCustomFee = TransactionCommon & {
  customFeeConfig: {
    [key: string]: BigNumber;
  };
  payinExtraId?: string;
  customErrorType?: CustomErrorType;
  extraTransactionParameters?: string;
  family: string;
  sponsored?: boolean;
};

// Define a specific type for the strategy functions, assuming they might need parameters
export type TransactionStrategyFunction = (
  params: TransactionWithCustomFee,
) => Partial<Transaction>;

export const transactionStrategy: {
  [K in Transaction["family"]]: TransactionStrategyFunction;
} = {
  aleo: defaultTransaction,
  algorand: defaultTransaction,
  aptos: defaultTransaction,
  bitcoin: bitcoinTransaction,
  canton: defaultTransaction,
  cardano: cardanoTransaction,
  casper: defaultTransaction,
  celo: defaultTransaction,
  cosmos: cosmosTransaction,
  evm: evmTransaction,
  filecoin: defaultTransaction,
  hedera: hederaTransaction,
  icon: defaultTransaction,
  internet_computer: defaultTransaction,
  mina: defaultTransaction,
  multiversx: elrondTransaction,
  near: nearTransaction,
  polkadot: defaultTransaction,
  solana: solanaTransaction,
  stacks: defaultTransaction,
  stellar: stellarTransaction,
  sui: defaultTransaction,
  tezos: tezosTransaction,
  ton: tonTransaction,
  tron: tronTransaction,
  vechain: defaultTransaction,
  kaspa: defaultTransaction,
  xrp: rippleTransaction,
};

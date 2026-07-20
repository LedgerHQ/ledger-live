import {
  StakingOperation,
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { CosmosOperationMode, Transaction } from "../../types";

/**
 * Adapters translating the Alpaca `TransactionIntent` into the internal bridge-era
 * `Account`/`Transaction` shapes. The objects are intentionally partial (and cast) —
 * only the fields the consumers read are populated; they never leave the logic layer.
 */

function extractMemo(intent: TransactionIntent): string {
  const memo = (intent as { memo?: { type?: string; value?: string } }).memo;
  return memo?.type === "string" && typeof memo.value === "string" ? memo.value : "";
}

export function intentToAccount(intent: TransactionIntent, currencyId: string): Account {
  return {
    freshAddress: intent.sender,
    currency: getCryptoCurrencyById(currencyId),
  } as unknown as Account;
}

// Cosmos has no plain "withdraw" (rewards are claimed via claimReward), so it maps to undefined.
const STAKING_MODE: Record<StakingOperation, CosmosOperationMode | undefined> = {
  delegate: "delegate",
  undelegate: "undelegate",
  redelegate: "redelegate",
  claimReward: "claimReward",
  compoundReward: "claimRewardCompound",
  withdraw: undefined,
};

export function intentToTransaction(intent: TransactionIntent): Transaction {
  const memo = extractMemo(intent);
  const amount = new BigNumber(intent.amount.toString());

  if (intent.intentType === "staking") {
    return stakingIntentToTransaction(intent as StakingTransactionIntent, memo, amount);
  }

  return {
    family: "cosmos",
    mode: "send",
    recipient: intent.recipient,
    amount,
    memo,
    useAllAmount: Boolean(intent.useAllAmount),
    fees: null,
    gas: null,
    validators: [],
    sourceValidator: undefined,
    networkInfo: null,
  } as unknown as Transaction;
}

function stakingIntentToTransaction(
  intent: StakingTransactionIntent,
  memo: string,
  amount: BigNumber,
): Transaction {
  const mode = STAKING_MODE[intent.mode];
  if (!mode) {
    throw new Error(`unsupported staking mode: ${intent.mode}`);
  }

  const base = {
    family: "cosmos",
    recipient: "",
    amount,
    memo,
    useAllAmount: false,
    fees: null,
    gas: null,
    networkInfo: null,
  };

  // Redelegate: valAddress is the source, dstValAddress the destination.
  const isRedelegate = mode === "redelegate";
  return {
    ...base,
    mode,
    sourceValidator: isRedelegate ? intent.valAddress : undefined,
    validators: [
      { address: isRedelegate ? (intent.dstValAddress ?? "") : intent.valAddress, amount },
    ],
  } as unknown as Transaction;
}

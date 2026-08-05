import {
  StakingOperation,
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import { CosmosTransactionParams } from "../../buildTransaction";
import { CosmosOperationMode } from "../../types";

/**
 * Translate an Alpaca `TransactionIntent` into framework-neutral {@link CosmosTransactionParams}
 * for the shared amino/proto builders — the logic layer stays free of `@types/live`
 * `Account` / `Transaction`.
 */

function extractMemo(intent: TransactionIntent): string {
  const memo = (intent as { memo?: { type?: string; value?: string } }).memo;
  return memo?.type === "string" && typeof memo.value === "string" ? memo.value : "";
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

export function intentToMessageParams(
  intent: TransactionIntent,
  currencyId: string,
  denom: string,
): CosmosTransactionParams {
  const amount = new BigNumber(intent.amount.toString());
  const base = {
    currencyId,
    senderAddress: intent.sender,
    denom,
    memo: extractMemo(intent),
    amount,
  };

  if (intent.intentType === "staking") {
    const stakingIntent = intent as StakingTransactionIntent;
    const mode = STAKING_MODE[stakingIntent.mode];
    if (!mode) {
      throw new Error(`unsupported staking mode: ${stakingIntent.mode}`);
    }
    // Redelegate: valAddress is the source, dstValAddress the destination.
    const isRedelegate = mode === "redelegate";
    return {
      ...base,
      mode,
      recipient: "",
      ...(isRedelegate && stakingIntent.valAddress
        ? { sourceValidator: stakingIntent.valAddress }
        : {}),
      validators: [
        {
          address: isRedelegate ? (stakingIntent.dstValAddress ?? "") : stakingIntent.valAddress,
          amount,
        },
      ],
    };
  }

  return {
    ...base,
    mode: "send",
    recipient: intent.recipient,
    validators: [],
  };
}

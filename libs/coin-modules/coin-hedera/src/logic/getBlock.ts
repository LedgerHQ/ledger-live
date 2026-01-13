import type {
  AssetInfo,
  Block,
  TransactionEvent,
  BlockTransaction,
} from "@ledgerhq/coin-framework/api/types";
import { toTransactionEventType } from "@ledgerhq/coin-framework/api/utils";
import { HEDERA_TRANSACTION_NAMES } from "../constants";
import { getBlockInfo } from "./getBlockInfo";
import { apiClient } from "../network/api";
import type {
  HederaMemo,
  HederaMirrorCoinTransfer,
  HederaMirrorTokenTransfer,
  HederaMirrorTransaction,
} from "../types";
import {
  getMemoFromBase64,
  analyzeStakingOperation,
  getTimestampRangeFromBlockHeight,
} from "./utils";

function toHederaAsset(
  mirrorTransfer: HederaMirrorCoinTransfer | HederaMirrorTokenTransfer,
): AssetInfo {
  if ("token_id" in mirrorTransfer) {
    return {
      type: "hts",
      assetReference: mirrorTransfer.token_id,
    };
  }

  return { type: "native" };
}

function toTransactionEvent(
  payerAccount: string,
  chargedFee: bigint,
  mirrorTransfer: HederaMirrorCoinTransfer | HederaMirrorTokenTransfer,
): TransactionEvent {
  const isTokenTransfer = "token_id" in mirrorTransfer;
  const address = mirrorTransfer.account;
  const asset = toHederaAsset(mirrorTransfer);
  let amount = BigInt(mirrorTransfer.amount);

  // exclude fee from payer's operation amount (fees are accounted for separately, so operations must not represent fees)
  if (payerAccount === address && !isTokenTransfer) {
    amount += chargedFee;
  }

  return { type: "TRANSFER", balanceDeltas: [{ address, asset, delta: amount }] };
}

function createStakingRewardEvents(tx: HederaMirrorTransaction): TransactionEvent[] {
  return tx.staking_reward_transfers.map(tr => ({
    type: "REWARD",
    balanceDeltas: [{ address: tr.account, asset: { type: "native" }, delta: BigInt(tr.amount) }],
  }));
}

export async function getBlock(height: number): Promise<Block<HederaMemo>> {
  const { start, end } = getTimestampRangeFromBlockHeight(height);
  const blockInfo = await getBlockInfo(height);
  const transactions = await apiClient.getTransactionsByTimestampRange({
    startTimestamp: `gte:${start}`,
    endTimestamp: `lt:${end}`,
  });

  // analyze CRYPTOUPDATEACCOUNT transactions to distinguish staking operations from regular account updates.
  // this creates a map of transaction_hash -> StakingAnalysis to avoid repeated lookups.
  const stakingAnalyses = await Promise.all(
    transactions
      .filter(tx => tx.name === HEDERA_TRANSACTION_NAMES.UpdateAccount)
      .map(async tx => {
        const payerAccount = tx.transaction_id.split("-")[0];
        const analysis = await analyzeStakingOperation(payerAccount, tx);

        return [tx.transaction_hash, analysis] as const;
      }),
  );
  const stakingAnalysisMap = new Map(stakingAnalyses);

  const blockTransactions: BlockTransaction<HederaMemo>[] = transactions.map(tx => {
    const feePayer = tx.transaction_id.split("-")[0];
    const feeAmount = BigInt(tx.charged_tx_fee);
    const stakingAnalysis = stakingAnalysisMap.get(tx.transaction_hash);

    let events: TransactionEvent[];

    if (stakingAnalysis) {
      events = [
        {
          type: toTransactionEventType(stakingAnalysis.operationType),
          balanceDeltas: [],
          details: {
            operationType: stakingAnalysis.operationType,
            stakedNodeId: stakingAnalysis.targetStakingNodeId,
            previousStakedNodeId: stakingAnalysis.previousStakingNodeId,
            stakedAmount: stakingAnalysis.stakedAmount,
          },
        },
      ];
    } else {
      const allTransfers = [...tx.transfers, ...tx.token_transfers];
      events = allTransfers.map(transfer => toTransactionEvent(feePayer, feeAmount, transfer));
    }

    // add fee event
    events.push({
      type: "FEE",
      balanceDeltas: [{ address: feePayer, asset: { type: "native" }, delta: -feeAmount }],
    });

    // add staking reward operations if present (can occur on any transaction type)
    const rewardOperations = createStakingRewardEvents(tx);
    events.push(...rewardOperations);

    const memoValue = getMemoFromBase64(tx.memo_base64);
    const memo: HederaMemo | undefined =
      memoValue === null ? undefined : { type: "string", kind: "text", value: memoValue };

    return {
      id: tx.transaction_hash,
      time: new Date(Number.parseInt(tx.consensus_timestamp.split(".")[0], 10) * 1000),
      failed: tx.result !== "SUCCESS",
      events,
      memo,
    };
  });

  return {
    info: blockInfo,
    transactions: blockTransactions,
  };
}

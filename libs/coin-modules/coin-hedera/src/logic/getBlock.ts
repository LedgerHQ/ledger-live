import type {
  AssetInfo,
  Block,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-framework/api/types";
import { FINALITY_MS, HEDERA_TRANSACTION_NAMES } from "../constants";
import { getBlockInfo } from "./getBlockInfo";
import { apiClient } from "../network/api";
import type {
  HederaMirrorCoinTransfer,
  HederaMirrorTokenTransfer,
  HederaMirrorTransaction,
} from "../types";
import {
  extractFeesPayer,
  getMemoFromBase64,
  analyzeStakingOperation,
  getDateRangeFromBlockHeight,
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

function toBlockOperation(
  payerAccount: string,
  chargedFee: number,
  mirrorTransfer: HederaMirrorCoinTransfer | HederaMirrorTokenTransfer,
): BlockOperation {
  const isTokenTransfer = "token_id" in mirrorTransfer;
  const address = mirrorTransfer.account;
  const asset = toHederaAsset(mirrorTransfer);
  let amount = BigInt(mirrorTransfer.amount);

  // exclude fee from payer's operation amount (fees are accounted for separately, so operations must not represent fees)
  if (payerAccount === address && !isTokenTransfer) {
    amount += BigInt(chargedFee);
  }

  return {
    type: "transfer",
    address,
    asset,
    amount,
  };
}

function createStakingRewardOperations(tx: HederaMirrorTransaction): BlockOperation[] {
  return tx.staking_reward_transfers.map(rewardTransfer => ({
    type: "transfer",
    address: rewardTransfer.account,
    asset: { type: "native" },
    amount: BigInt(rewardTransfer.amount),
  }));
}

export async function getBlock(height: number): Promise<Block> {
  const { start, end } = getDateRangeFromBlockHeight(height);

  // block data should be immutable: do not allow querying blocks on non-finalized time range
  if (end.getTime() > new Date().getTime() - FINALITY_MS)
    throw new Error(`Block ${height} is not available yet`);

  const blockInfo = await getBlockInfo(height);
  const transactions = await apiClient.getTransactionsByTimestampRange({
    startTimestamp: `gte:${start.getTime() / 1000}`,
    endTimestamp: `lt:${end.getTime() / 1000}`,
  });

  // analyze CRYPTOUPDATEACCOUNT transactions to distinguish staking operations from regular account updates.
  // this creates a map of transaction_hash -> StakingAnalysis to avoid repeated lookups.
  const stakingAnalyses = await Promise.all(
    transactions
      .filter(tx => tx.name === HEDERA_TRANSACTION_NAMES.UpdateAccount)
      .map(async tx => {
        const payerAccount = extractFeesPayer(tx.transaction_id)!;
        const analysis = await analyzeStakingOperation(payerAccount, tx);

        return [tx.transaction_hash, analysis] as const;
      }),
  );
  const stakingAnalysisMap = new Map(stakingAnalyses);

  const blockTransactions: BlockTransaction[] = transactions.map(tx => {
    const payerAccount = extractFeesPayer(tx.transaction_id)!;
    const stakingAnalysis = stakingAnalysisMap.get(tx.transaction_hash);

    let operations: BlockOperation[];

    if (stakingAnalysis) {
      operations = [
        {
          type: "other",
          operationType: stakingAnalysis.operationType,
          stakedNodeId: stakingAnalysis.targetStakingNodeId,
          previousStakedNodeId: stakingAnalysis.previousStakingNodeId,
          stakedAmount: stakingAnalysis.stakedAmount,
        },
      ];
    } else {
      const allTransfers = [...tx.transfers, ...tx.token_transfers];
      operations = allTransfers.map(transfer =>
        toBlockOperation(payerAccount, tx.charged_tx_fee, transfer),
      );
    }

    // add staking reward operations if present (can occur on any transaction type)
    const rewardOperations = createStakingRewardOperations(tx);
    operations.push(...rewardOperations);

    return {
      hash: tx.transaction_hash,
      failed: tx.result !== "SUCCESS",
      operations,
      fees: BigInt(tx.charged_tx_fee),
      feesPayer: payerAccount,
      details: { memo: getMemoFromBase64(tx.memo_base64) },
    };
  });

  return {
    info: blockInfo,
    transactions: blockTransactions,
  };
}

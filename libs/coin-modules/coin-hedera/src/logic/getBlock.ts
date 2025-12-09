import BigNumber from "bignumber.js";
import type {
  AssetInfo,
  Block,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-framework/api/types";
import { FINALITY_MS, HEDERA_TRANSACTION_NAMES } from "../constants";
import { getBlockInfo } from "./getBlockInfo";
import { apiClient } from "../network/api";
import { hgraphClient } from "../network/hgraph";
import { enrichERC20Transfers } from "../network/utils";
import type {
  ERC20TokenTransfer,
  HederaMirrorCoinTransfer,
  HederaMirrorTokenTransfer,
  HederaMirrorTransaction,
  MergedTransaction,
} from "../types";
import {
  getMemoFromBase64,
  analyzeStakingOperation,
  getDateRangeFromBlockHeight,
  mergeTransactonsFromDifferentSources,
  toEntityId,
} from "./utils";

function createBlockOperationFromCoinTransfer({
  payerAccount,
  chargedFee,
  transfer,
  rewardTransfers,
}: {
  payerAccount: string;
  chargedFee: number;
  transfer: HederaMirrorCoinTransfer;
  rewardTransfers: HederaMirrorTransaction["staking_reward_transfers"];
}): BlockOperation {
  let amount = BigInt(transfer.amount);
  const address = transfer.account;
  const reward = rewardTransfers.find(r => r.account === address);
  const asset: AssetInfo = {
    type: "native",
  };

  // exclude fee from payer's operation amount (fees are accounted for separately, so operations must not represent fees)
  if (payerAccount === address) {
    amount += BigInt(chargedFee);
  }

  // substract staking rewards from the amount as they are represented as separate operations
  amount -= BigInt(reward?.amount ?? 0);

  return {
    type: "transfer",
    address,
    asset,
    amount,
  };
}

function createBlockOperationFromHTSTokenTransfer({
  transfer,
}: {
  transfer: HederaMirrorTokenTransfer;
}): BlockOperation {
  const amount = BigInt(transfer.amount);
  const address = transfer.account;
  const asset: AssetInfo = {
    type: "hts",
    assetReference: transfer.token_id,
  };

  return {
    type: "transfer",
    address,
    asset,
    amount,
  };
}

function createBlockOperationFromERC20TokenTransfer({
  transfer,
}: {
  transfer: ERC20TokenTransfer;
}): BlockOperation[] {
  const amount = BigInt(transfer.amount);
  const recipient = transfer.receiver_account_id
    ? toEntityId({ num: transfer.receiver_account_id })
    : transfer.receiver_evm_address;
  const sender = transfer.sender_account_id
    ? toEntityId({ num: transfer.sender_account_id })
    : transfer.sender_evm_address;

  const asset: AssetInfo = {
    type: "erc20",
    assetReference: transfer.token_evm_address,
  };

  return [
    {
      type: "transfer",
      address: recipient,
      asset,
      amount,
    },
    {
      type: "transfer",
      address: sender,
      asset,
      amount: -amount,
    },
  ];
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
  if (end.getTime() > Date.now() - FINALITY_MS) {
    throw new Error(`Block ${height} is not available yet`);
  }

  const latestHgraphIndexedTimestampNs = await hgraphClient.getLastestIndexedConsensusTimestamp();
  const startSeconds = start.getTime() / 1000;
  const endSeconds = end.getTime() / 1000;
  const startNanos = new BigNumber(startSeconds).toFixed(9);
  const endNanos = new BigNumber(endSeconds).toFixed(9);
  const limit = 100;
  const order = "desc";

  // do not allow querying blocks if hgraph is not fully synced up to the end of the block time range
  if (latestHgraphIndexedTimestampNs.lt(endNanos)) {
    throw new Error(`Block ${height} has no ERC20 synced yet (${latestHgraphIndexedTimestampNs})`);
  }

  const [blockInfo, mirrorTransactions, enrichedERC20Transfers] = await Promise.all([
    getBlockInfo(height),
    apiClient.getTransactionsByTimestampRange({
      startTimestamp: `gte:${startSeconds}`,
      endTimestamp: `lt:${endSeconds}`,
      limit,
      order,
    }),
    hgraphClient
      .getERC20TransfersByTimestampRange({
        startTimestamp: startNanos,
        endTimestamp: endNanos,
        limit,
        order,
      })
      .then(erc20Transfers => enrichERC20Transfers(erc20Transfers)),
  ]);

  const mergeResult = mergeTransactonsFromDifferentSources({
    mirrorTransactions,
    enrichedERC20Transfers,
    order,
    limit,
    latestHgraphIndexedTimestampNs,
    fetchAllPages: true,
  });

  // analyze CRYPTOUPDATEACCOUNT transactions to distinguish staking operations from regular account updates.
  // this creates a map of transaction_hash -> StakingAnalysis to avoid repeated lookups.
  const stakingAnalyses = await Promise.all(
    mergeResult.merged
      .filter((item): item is Extract<MergedTransaction, { type: "mirror" }> => {
        return item.type === "mirror" && item.data.name === HEDERA_TRANSACTION_NAMES.UpdateAccount;
      })
      .map(async item => {
        const payerAccount = item.data.transaction_id.split("-")[0];
        const analysis = await analyzeStakingOperation(payerAccount, item.data);

        return [item.data.transaction_hash, analysis] as const;
      }),
  );
  const stakingAnalysisMap = new Map(stakingAnalyses);

  const blockTransactions: BlockTransaction[] = mergeResult.merged.map(item => {
    const mirrorTx = item.type === "mirror" ? item.data : item.data.mirrorTransaction;
    const payerAccount = mirrorTx.transaction_id.split("-")[0];
    const stakingAnalysis = stakingAnalysisMap.get(mirrorTx.transaction_hash);

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
      const allTransfers: (
        | HederaMirrorCoinTransfer
        | HederaMirrorTokenTransfer
        | ERC20TokenTransfer
      )[] = [
        ...mirrorTx.transfers,
        ...mirrorTx.token_transfers,
        ...(item.type === "erc20" ? [item.data.transfer] : []),
      ];

      operations = allTransfers.flatMap(transfer => {
        if ("token_evm_address" in transfer) {
          return createBlockOperationFromERC20TokenTransfer({ transfer });
        } else if ("token_id" in transfer) {
          return createBlockOperationFromHTSTokenTransfer({ transfer });
        } else {
          return createBlockOperationFromCoinTransfer({
            payerAccount,
            transfer,
            chargedFee: mirrorTx.charged_tx_fee,
            rewardTransfers: mirrorTx.staking_reward_transfers,
          });
        }
      });
    }

    // add staking reward operations if present (can occur on any transaction type)
    const rewardOperations = createStakingRewardOperations(mirrorTx);
    operations.push(...rewardOperations);

    return {
      hash: mirrorTx.transaction_hash,
      failed: mirrorTx.result !== "SUCCESS",
      operations,
      fees: BigInt(mirrorTx.charged_tx_fee),
      feesPayer: payerAccount,
      details: { memo: getMemoFromBase64(mirrorTx.memo_base64) },
    };
  });

  return {
    info: blockInfo,
    transactions: blockTransactions,
  };
}

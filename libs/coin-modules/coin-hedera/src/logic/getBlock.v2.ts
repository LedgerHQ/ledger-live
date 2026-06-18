import type {
  AssetInfo,
  Block,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/types";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import type { HederaCoinConfig } from "../config";
import { FINALITY_MS, HEDERA_TRANSACTION_NAMES } from "../constants";
import { apiClient } from "../network/api";
import { hgraphClient } from "../network/hgraph";
import { enrichERC20Transfers, analyzeStakingOperation } from "../network/utils";
import type {
  ERC20TokenTransfer,
  HederaMirrorCoinTransfer,
  HederaMirrorTokenTransfer,
  HederaMirrorTransaction,
  MergedTransaction,
} from "../types";
import { getBlockInfo } from "./getBlockInfo";
import {
  getMemoFromBase64,
  getDateRangeFromBlockHeight,
  mergeTransactionsFromDifferentSources,
  toEntityId,
  extractFeesPayer,
  millisToSeconds,
  secondsToNanos,
} from "./utils";

function isStakingTransactionType(
  item: MergedTransaction,
): item is Extract<MergedTransaction, { type: "mirror" }> {
  return item.type === "mirror" && item.data.name === HEDERA_TRANSACTION_NAMES.UpdateAccount;
}

function isTokenAssociateTransactionType(
  item: MergedTransaction,
): item is Extract<MergedTransaction, { type: "mirror" }> {
  return item.type === "mirror" && item.data.name === HEDERA_TRANSACTION_NAMES.TokenAssociate;
}

function getMirrorTransaction(item: MergedTransaction): HederaMirrorTransaction {
  return item.type === "mirror" ? item.data : item.data.mirrorTransaction;
}

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
  const address = transfer.account;
  const reward = rewardTransfers.find(r => r.account === address);
  const asset: AssetInfo = {
    type: "native",
  };

  // adjust the transfer amount:
  // - exclude fee from payer's operation amount (fees are accounted for separately, so operations must not represent fees)
  // - subtract staking rewards from the amount as they are represented as separate operations
  const feeAdjustment = payerAccount === address ? BigInt(chargedFee) : BigInt(0);
  const rewardAdjustment = BigInt(reward?.amount ?? 0);
  const amount = BigInt(transfer.amount) + feeAdjustment - rewardAdjustment;

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

  // if we don't have either sender or recipient info, we cannot create a meaningful operation, so we skip it
  if (!sender || !recipient) {
    return [];
  }

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

export async function getBlockV2({
  configOrCurrencyId,
  height,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  height: number;
}): Promise<Block> {
  const { start, end } = getDateRangeFromBlockHeight(height);

  // block data should be immutable: do not allow querying blocks on non-finalized time range
  if (end.getTime() > Date.now() - FINALITY_MS) {
    throw new Error(`Block ${height} is not available yet`);
  }

  const latestHgraphIndexedTimestampNs = await hgraphClient.getLatestIndexedConsensusTimestamp({
    configOrCurrencyId,
  });
  const startSeconds = millisToSeconds(start.getTime());
  const endSeconds = millisToSeconds(end.getTime());
  const endNanos = secondsToNanos(endSeconds);
  const limit = 100;
  const order = "desc";

  // do not allow querying blocks if hgraph is not fully synced up to the end of the block time range
  if (latestHgraphIndexedTimestampNs.lt(endNanos)) {
    throw new Error(`Block ${height} has no ERC20 synced yet (${latestHgraphIndexedTimestampNs})`);
  }

  const [blockInfo, mirrorTransactions, enrichedERC20Transfers] = await Promise.all([
    getBlockInfo(height),
    apiClient.getTransactionsByTimestampRange({
      configOrCurrencyId,
      startTimestamp: `gte:${startSeconds}`,
      endTimestamp: `lt:${endSeconds}`,
      limit,
      order,
    }),
    hgraphClient
      .getERC20TransfersByTimestampRange({
        configOrCurrencyId,
        startTimestamp: startSeconds.toFixed(9),
        endTimestamp: endSeconds.toFixed(9),
        limit,
        order,
      })
      .then(erc20Transfers => enrichERC20Transfers({ configOrCurrencyId, erc20Transfers })),
  ]);

  const mergeResult = mergeTransactionsFromDifferentSources({
    mirrorTransactions,
    enrichedERC20Transfers,
    order,
    limit,
    latestHgraphIndexedTimestampNs,
    fetchAllPages: true,
  });

  // analyze CRYPTOUPDATEACCOUNT transactions to distinguish staking operations from regular account updates.
  // this creates a map of transaction_hash -> StakingAnalysis to avoid repeated lookups.
  const stakingAnalyses = await promiseAllBatched(
    4,
    mergeResult.merged.filter(isStakingTransactionType),
    async item => {
      const payerAccount = extractFeesPayer(item.data);
      const analysis = await analyzeStakingOperation({
        configOrCurrencyId,
        address: payerAccount,
        mirrorTx: item.data,
      });

      return [item.data.transaction_hash, analysis] as const;
    },
  );
  const stakingAnalysisMap = new Map(stakingAnalyses);

  // prepare map with token IDs for TOKENASSOCIATE transactions by fetching payerAccount tokens and matching created_timestamp
  const tokenAssociateEntries = await promiseAllBatched(
    4,
    mergeResult.merged.filter(isTokenAssociateTransactionType),
    async item => {
      const mirrorTx = item.data;
      const payerAccount = extractFeesPayer(mirrorTx);
      const tokens = await apiClient.getAccountTokens({
        configOrCurrencyId,
        address: payerAccount,
      });
      const relatedToken = tokens.find(t => t.created_timestamp === mirrorTx.consensus_timestamp);
      const tokenId = relatedToken?.token_id ?? null;

      return [mirrorTx.transaction_hash, tokenId] as const;
    },
  );
  const tokenAssociateMap = new Map(tokenAssociateEntries);

  const blockTransactions: BlockTransaction[] = mergeResult.merged.map(item => {
    const mirrorTx = getMirrorTransaction(item);
    const memo = getMemoFromBase64(mirrorTx.memo_base64);
    const payerAccount = extractFeesPayer(mirrorTx);
    const stakingAnalysis = stakingAnalysisMap.get(mirrorTx.transaction_hash);

    let operations: BlockOperation[];

    if (stakingAnalysis) {
      operations = [
        {
          type: "other",
          ledgerOpType: stakingAnalysis.operationType,
          targetStakingNodeId: stakingAnalysis.targetStakingNodeId,
          previousStakingNodeId: stakingAnalysis.previousStakingNodeId,
          stakedAmount: stakingAnalysis.stakedAmount,
        },
      ];
    } else if (isTokenAssociateTransactionType(item)) {
      const associatedTokenId = tokenAssociateMap.get(mirrorTx.transaction_hash) ?? null;

      operations = [
        {
          type: "other",
          ledgerOpType: "ASSOCIATE_TOKEN",
          ...(associatedTokenId && { associatedTokenId }),
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
        ...(item.type === "erc20" ? item.data.transfers : []),
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
      details: {
        consensusTimestamp: mirrorTx.consensus_timestamp,
        transactionId: mirrorTx.transaction_id,
        ...(memo && { memo }),
        ...(item.type === "erc20" && {
          gasUsed: item.data.contractCallResult.gas_used,
          gasLimit: item.data.contractCallResult.gas_limit,
          gasConsumed: item.data.contractCallResult.gas_consumed,
        }),
      },
    };
  });

  return {
    info: blockInfo,
    transactions: blockTransactions,
  };
}

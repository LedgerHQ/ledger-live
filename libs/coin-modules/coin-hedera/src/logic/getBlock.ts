import type {
  AssetInfo,
  Block,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-framework/api/types";
import { HEDERA_TRANSACTION_NAMES, SUPPORTED_ERC20_TOKENS } from "../constants";
import { getBlockInfo } from "./getBlockInfo";
import { apiClient } from "../network/api";
import { thirdwebClient } from "../network/thirdweb";
import { getERC20Operations, parseThirdwebTransactionParams } from "../network/utils";
import type {
  HederaMirrorCoinTransfer,
  HederaMirrorTokenTransfer,
  HederaMirrorTransaction,
  OperationERC20,
  StakingAnalysis,
} from "../types";
import {
  analyzeStakingOperation,
  fromEVMAddress,
  getMemoFromBase64,
  getTimestampRangeFromBlockHeight,
} from "./utils";

// =============================================================================
// TYPES & TYPE GUARDS
// =============================================================================

type MergedTransaction = HederaMirrorTransaction | OperationERC20;

function isERC20Operation(tx: MergedTransaction): tx is OperationERC20 {
  return "mirrorTransaction" in tx;
}

function getPayerAccountFromTransactionId(transactionId: string): string {
  return transactionId.split("-")[0];
}

// =============================================================================
// HELPER FUNCTIONS - Operation Conversion
// =============================================================================

function createTransferBlockOperation({
  payerAccount,
  chargedFee,
  mirrorTransfer,
}: {
  payerAccount: string;
  chargedFee: number;
  mirrorTransfer: HederaMirrorCoinTransfer | HederaMirrorTokenTransfer;
}): BlockOperation {
  let amount = BigInt(mirrorTransfer.amount);
  const isTokenTransfer = "token_id" in mirrorTransfer;
  const address = mirrorTransfer.account;
  const asset: AssetInfo = isTokenTransfer
    ? { type: "hts", assetReference: mirrorTransfer.token_id }
    : { type: "native" };

  // Exclude fee from payer's operation amount (fees are tracked separately)
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

function createERC20BlockOperations(op: OperationERC20): BlockOperation[] | null {
  const decodedParams = parseThirdwebTransactionParams(op.thirdwebTransaction);
  if (!decodedParams) return null;

  const amount = BigInt(decodedParams.value);
  const asset: AssetInfo = {
    type: "erc20",
    assetReference: op.token.contractAddress,
  };

  const fromAddress = fromEVMAddress(decodedParams.from) ?? decodedParams.from;
  const toAddress = fromEVMAddress(decodedParams.to) ?? decodedParams.to;

  return [
    {
      type: "transfer",
      address: fromAddress,
      amount: -amount,
      asset,
    },
    {
      type: "transfer",
      address: toAddress,
      amount,
      asset,
    },
  ];
}

function createStakingRewardBlockOperations(tx: HederaMirrorTransaction): BlockOperation[] {
  return tx.staking_reward_transfers.map(rewardTransfer => ({
    type: "transfer",
    address: rewardTransfer.account,
    asset: { type: "native" },
    amount: BigInt(rewardTransfer.amount),
  }));
}

// =============================================================================
// HELPER FUNCTIONS - Transaction Processing
// =============================================================================

function toBlockTransaction(
  tx: MergedTransaction,
  stakingAnalysisMap: Map<string, StakingAnalysis | null>,
): BlockTransaction | null {
  const mirrorTx = isERC20Operation(tx) ? tx.mirrorTransaction : tx;
  const payerAccount = getPayerAccountFromTransactionId(mirrorTx.transaction_id);
  const stakingAnalysis = stakingAnalysisMap.get(mirrorTx.transaction_hash);

  let operations: BlockOperation[] = [];

  if (stakingAnalysis) {
    operations = [
      {
        type: "other",
        operationType: stakingAnalysis.operationType,
        stakedNodeId: stakingAnalysis.targetStakingNodeId,
        previousStakedNodeId: stakingAnalysis.previousStakingNodeId,
        amount: stakingAnalysis.amount,
      },
    ];
  } else {
    const allTransfers = [...mirrorTx.transfers, ...mirrorTx.token_transfers];
    operations = allTransfers.map(transfer =>
      createTransferBlockOperation({
        payerAccount,
        chargedFee: mirrorTx.charged_tx_fee,
        mirrorTransfer: transfer,
      }),
    );
  }

  // add staking reward operations (can occur on any transaction type)
  operations.push(...createStakingRewardBlockOperations(mirrorTx));

  // add ERC20 operations if any
  if (isERC20Operation(tx)) {
    const erc20Operations = createERC20BlockOperations(tx) ?? [];
    operations.push(...erc20Operations);
  }

  return {
    hash: mirrorTx.transaction_hash,
    failed: mirrorTx.result !== "SUCCESS",
    operations,
    fees: BigInt(mirrorTx.charged_tx_fee),
    feesPayer: payerAccount,
    details: { memo: getMemoFromBase64(mirrorTx.memo_base64) },
  };
}

// =============================================================================
// HELPER FUNCTIONS - Merging & Sorting
// =============================================================================

function mergeAndDeduplicateTransactions(
  mirrorTransactions: HederaMirrorTransaction[],
  erc20Operations: OperationERC20[],
): MergedTransaction[] {
  const erc20TxHashes = new Set(erc20Operations.map(op => op.mirrorTransaction.transaction_hash));

  return [
    ...erc20Operations,
    ...mirrorTransactions.filter(tx => !erc20TxHashes.has(tx.transaction_hash)),
  ];
}

function sortTransactionsByTimestamp(transactions: MergedTransaction[]) {
  transactions.sort((a, b) => {
    const mirrorTxA = isERC20Operation(a) ? a.mirrorTransaction : a;
    const mirrorTxB = isERC20Operation(b) ? b.mirrorTransaction : b;
    const timestampA = Number.parseFloat(mirrorTxA.consensus_timestamp);
    const timestampB = Number.parseFloat(mirrorTxB.consensus_timestamp);
    return timestampB - timestampA;
  });
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Fetches all transactions in a synthetic block.
 *
 * Returns both Mirror Node transactions (HBAR, HTS tokens) and ERC20 token transfers.
 *
 * @param height - The synthetic block height to fetch
 * @returns Block with all transactions and their operations
 */
export async function getBlock(height: number): Promise<Block> {
  const { mirror, thirdweb } = getTimestampRangeFromBlockHeight(height);
  const blockInfo = await getBlockInfo(height);
  const [mirrorTransactions, thirdwebTransactions] = await Promise.all([
    apiClient.getTransactionsByTimestampRange(mirror.start, mirror.end),
    thirdwebClient.getTransactionsByTimestampRange({
      contractAddresses: SUPPORTED_ERC20_TOKENS.map(token => token.contractAddress),
      startTimestamp: thirdweb.from,
      endTimestamp: thirdweb.to,
    }),
  ]);

  // enrich raw thirdweb result with mirror data
  const erc20Operations = await getERC20Operations(thirdwebTransactions);

  // merge and deduplicate transactions (CONTRACT_CALLs may be duplicated)
  const mergedTransactions = mergeAndDeduplicateTransactions(mirrorTransactions, erc20Operations);

  // analyze CRYPTOUPDATEACCOUNT transactions to distinguish staking operations from regular account updates.
  // this creates a map of transaction_hash -> StakingAnalysis to avoid repeated lookups.
  const stakingAnalyses = await Promise.all(
    mergedTransactions
      .filter((tx): tx is HederaMirrorTransaction => {
        return "name" in tx && tx.name === HEDERA_TRANSACTION_NAMES.UpdateAccount;
      })
      .map(async tx => {
        const payerAccount = getPayerAccountFromTransactionId(tx.transaction_id);
        const analysis = await analyzeStakingOperation(payerAccount, tx);

        return [tx.transaction_hash, analysis] as const;
      }),
  );
  const stakingAnalysisMap = new Map(stakingAnalyses);

  // sort by timestamp (newest first)
  sortTransactionsByTimestamp(mergedTransactions);

  // convert to block transactions
  const blockTransactions = mergedTransactions
    .map(tx => toBlockTransaction(tx, stakingAnalysisMap))
    .filter((tx): tx is BlockTransaction => tx !== null);

  return {
    info: blockInfo,
    transactions: blockTransactions,
  };
}

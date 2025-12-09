import BigNumber from "bignumber.js";
import invariant from "invariant";
import { getEnv } from "@ledgerhq/live-env";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Pagination } from "@ledgerhq/coin-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { encodeAccountId, encodeTokenAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { buildERC20OperationFields } from "../bridge/utils";
import { HEDERA_TRANSACTION_NAMES } from "../constants";
import { apiClient } from "../network/api";
import { getERC20Operations, parseTransfers } from "../network/utils";
import { thirdwebClient } from "../network/thirdweb";
import type {
  HederaERC20TokenBalance,
  HederaMirrorToken,
  HederaMirrorTransaction,
  HederaOperationExtra,
  OperationERC20,
  StakingAnalysis,
} from "../types";
import {
  analyzeStakingOperation,
  base64ToUrlSafeBase64,
  createCompositeCursor,
  getMemoFromBase64,
  getSyntheticBlock,
  parseCompositeCursor,
  toEVMAddress,
} from "./utils";

// =============================================================================
// CONSTANTS / TYPES
// =============================================================================

type MergedTransaction =
  | { type: "mirror"; data: HederaMirrorTransaction }
  | { type: "erc20"; data: OperationERC20 };

const txNameToCustomOperationType: Record<string, OperationType> = {
  TOKENASSOCIATE: "ASSOCIATE_TOKEN",
  CONTRACTCALL: "CONTRACT_CALL",
  CRYPTOUPDATEACCOUNT: "UPDATE_ACCOUNT",
};

// =============================================================================
// HELPER FUNCTIONS - Transaction Processing
// =============================================================================

function getCommonOperationData(
  rawTx: HederaMirrorTransaction,
  useEncodedHash: boolean,
  useSyntheticBlocks: boolean,
) {
  const timestamp = new Date(Number.parseInt(rawTx.consensus_timestamp.split(".")[0], 10) * 1000);
  const hash = useEncodedHash
    ? base64ToUrlSafeBase64(rawTx.transaction_hash)
    : rawTx.transaction_hash;
  const fee = new BigNumber(rawTx.charged_tx_fee);
  const hasFailed = rawTx.result !== "SUCCESS";
  const syntheticBlock = getSyntheticBlock(rawTx.consensus_timestamp);
  const memo = getMemoFromBase64(rawTx.memo_base64);
  const extra: HederaOperationExtra = {
    pagingToken: rawTx.consensus_timestamp,
    consensusTimestamp: rawTx.consensus_timestamp,
    transactionId: rawTx.transaction_id,
    ...(memo && { memo }),
  };

  return {
    timestamp,
    hash,
    fee,
    hasFailed,
    blockHeight: useSyntheticBlocks ? syntheticBlock.blockHeight : 10,
    blockHash: useSyntheticBlocks ? syntheticBlock.blockHash : null,
    extra,
  };
}

async function processTokenTransfers({
  rawTx,
  address,
  currency,
  ledgerAccountId,
  commonData,
  skipFeesForTokenOperations,
}: {
  rawTx: HederaMirrorTransaction;
  address: string;
  currency: CryptoCurrency;
  ledgerAccountId: string;
  commonData: ReturnType<typeof getCommonOperationData>;
  skipFeesForTokenOperations: boolean;
}): Promise<{
  coinOperation: Operation<HederaOperationExtra> | undefined;
  tokenOperation: Operation<HederaOperationExtra>;
} | null> {
  const tokenTransfers = rawTx.token_transfers ?? [];
  if (tokenTransfers.length === 0) return null;

  const tokenId = tokenTransfers[0].token_id;
  const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(tokenId, currency.id);
  if (!token) return null;

  const encodedTokenId = encodeTokenAccountId(ledgerAccountId, token);
  const { type, value, senders, recipients } = parseTransfers(tokenTransfers, address);
  const { hash, fee, timestamp, blockHeight, blockHash, hasFailed } = commonData;
  const extra = { ...commonData.extra };

  let coinOperation: Operation<HederaOperationExtra> | undefined;

  // Add main FEES coin operation for send token transfer
  if (type === "OUT" && !skipFeesForTokenOperations) {
    coinOperation = {
      id: encodeOperationId(ledgerAccountId, hash, "FEES"),
      accountId: ledgerAccountId,
      type: "FEES",
      value: fee,
      recipients,
      senders,
      hash,
      fee,
      date: timestamp,
      blockHeight,
      blockHash,
      hasFailed,
      extra,
    };
  }

  const tokenOperation = {
    id: encodeOperationId(encodedTokenId, hash, type),
    accountId: encodedTokenId,
    contract: token.contractAddress,
    standard: "hts",
    type,
    value,
    recipients,
    senders,
    hash,
    fee,
    date: timestamp,
    blockHeight,
    blockHash,
    hasFailed,
    extra,
  } satisfies Operation<HederaOperationExtra>;

  return {
    coinOperation,
    tokenOperation,
  };
}

function processTransfers({
  rawTx,
  address,
  ledgerAccountId,
  commonData,
  mirrorTokens,
  stakingAnalysis,
}: {
  rawTx: HederaMirrorTransaction;
  address: string;
  ledgerAccountId: string;
  commonData: ReturnType<typeof getCommonOperationData>;
  mirrorTokens: HederaMirrorToken[];
  stakingAnalysis: StakingAnalysis | null;
}): Operation<HederaOperationExtra>[] {
  const coinOperations: Operation<HederaOperationExtra>[] = [];
  const transfers = rawTx.transfers ?? [];

  if (transfers.length === 0) {
    return [];
  }

  const { type, value, senders, recipients } = parseTransfers(transfers, address);
  const { hash, fee, timestamp, blockHeight, blockHash, hasFailed } = commonData;
  const extra = { ...commonData.extra };
  let operationType = txNameToCustomOperationType[rawTx.name] ?? type;

  // try to enrich ASSOCIATE_TOKEN operation with extra.associatedTokenId
  // this value is used by custom OperationDetails components in Hedera family
  // accounts or contracts must first associate with an HTS token before they can receive or send that token; without association, token transfers fail
  if (operationType === "ASSOCIATE_TOKEN") {
    const relatedMirrorToken = mirrorTokens.find(t => {
      return t.created_timestamp === rawTx.consensus_timestamp;
    });

    if (relatedMirrorToken) {
      extra.associatedTokenId = relatedMirrorToken.token_id;
    }
  }

  // update operation type and extra fields if staking analysis is available
  if (stakingAnalysis) {
    operationType = stakingAnalysis.operationType;
    extra.previousStakingNodeId = stakingAnalysis.previousStakingNodeId;
    extra.targetStakingNodeId = stakingAnalysis.targetStakingNodeId;
  }

  // each transfer may trigger staking reward claim
  const stakingReward = rawTx.staking_reward_transfers.reduce((acc, transfer) => {
    if (transfer.account === address) {
      return acc.plus(new BigNumber(transfer.amount));
    }
    return acc;
  }, new BigNumber(0));

  // add REWARD operation representing staking reward transfers
  if (stakingReward.gt(0)) {
    const stakingRewardHash = `${hash}-staking-reward`;
    const stakingRewardType: OperationType = "REWARD";
    // offset timestamp by +1ms to ensure it appears just before the operation that triggered it
    const stakingRewardTimestamp = new Date(timestamp.getTime() + 1);

    coinOperations.push({
      id: encodeOperationId(ledgerAccountId, stakingRewardHash, stakingRewardType),
      accountId: ledgerAccountId,
      type: stakingRewardType,
      value: stakingReward,
      recipients: [address],
      senders: [getEnv("HEDERA_STAKING_REWARD_ACCOUNT_ID")],
      hash: stakingRewardHash,
      fee: new BigNumber(0),
      date: stakingRewardTimestamp,
      blockHeight,
      blockHash,
      extra,
    });
  }

  coinOperations.push({
    id: encodeOperationId(ledgerAccountId, hash, operationType),
    accountId: ledgerAccountId,
    type: operationType,
    value,
    recipients,
    senders,
    hash,
    fee,
    date: timestamp,
    blockHeight,
    blockHash,
    hasFailed,
    extra,
  });

  return coinOperations;
}

// =============================================================================
// HELPER FUNCTIONS - Merging & Pagination for data from different sources
// =============================================================================

function mergeAndPaginate({
  mirrorTransactions,
  thirdwebTransactions,
  order,
  limit,
}: {
  mirrorTransactions: HederaMirrorTransaction[];
  thirdwebTransactions: OperationERC20[];
  order: "asc" | "desc";
  limit: number;
}): {
  mergedTransactions: MergedTransaction[];
  mirrorCursor: string | null;
  erc20Cursor: string | null;
} {
  const merged: MergedTransaction[] = [];
  const mirrorTxHashes = new Set(mirrorTransactions.map(tx => tx.transaction_hash));
  const erc20TxByHash = new Map(
    thirdwebTransactions.map(tx => [tx.mirrorTransaction.transaction_hash, tx]),
  );

  // add mirror transactions, preferring ERC20 version than mirror CONTRACT_CALL if available
  for (const mirrorTx of mirrorTransactions) {
    const erc20Tx = erc20TxByHash.get(mirrorTx.transaction_hash);
    merged.push(erc20Tx ? { type: "erc20", data: erc20Tx } : { type: "mirror", data: mirrorTx });
  }

  // add erc20 transactions missing from mirror response (incoming transfers, allowance-based)
  for (const erc20Tx of thirdwebTransactions) {
    if (!mirrorTxHashes.has(erc20Tx.mirrorTransaction.transaction_hash)) {
      merged.push({ type: "erc20", data: erc20Tx });
    }
  }

  // sort by consensus timestamp
  merged.sort((a, b) => {
    const aMirrorTx = a.type === "mirror" ? a.data : a.data.mirrorTransaction;
    const bMirrorTx = b.type === "mirror" ? b.data : b.data.mirrorTransaction;
    const aTime = Number.parseFloat(aMirrorTx.consensus_timestamp);
    const bTime = Number.parseFloat(bMirrorTx.consensus_timestamp);
    return order === "desc" ? bTime - aTime : aTime - bTime;
  });

  // respect limit after merging
  const limited = merged.slice(0, limit);

  // calculate cursors from limited result
  let lastMirrorTimestamp: string | null = null;
  let lastErc20Timestamp: string | null = null;

  for (const item of limited) {
    if (item.type === "mirror") {
      lastMirrorTimestamp = item.data.consensus_timestamp;
    } else {
      lastErc20Timestamp = item.data.mirrorTransaction.consensus_timestamp.split(".")[0];
    }
  }

  return {
    mergedTransactions: limited,
    mirrorCursor: lastMirrorTimestamp,
    erc20Cursor: lastErc20Timestamp,
  };
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Lists operations for a Hedera account.
 *
 * Two main modes, depending on presence of erc20TokenBalances parameter:
 * - Bridge: Returns only Mirror operations (erc20TokenBalances = undefined)
 * - Alpaca: Returns merged Mirror + ERC20 operations (erc20TokenBalances !== undefined)
 */
export async function listOperations({
  currency,
  address,
  mirrorTokens,
  pagination,
  fetchAllPages,
  skipFeesForTokenOperations,
  useEncodedHash,
  useSyntheticBlocks,
  erc20TokenBalances,
}: {
  currency: CryptoCurrency;
  address: string;
  mirrorTokens: HederaMirrorToken[];
  pagination: Pagination;
  // options for compatibility with old bridge
  fetchAllPages: boolean;
  skipFeesForTokenOperations: boolean;
  useEncodedHash: boolean;
  useSyntheticBlocks: boolean;
  erc20TokenBalances?: HederaERC20TokenBalance[];
}): Promise<{
  coinOperations: Operation<HederaOperationExtra>[];
  tokenOperations: Operation<HederaOperationExtra>[];
  nextCursor: string | null;
}> {
  const evmAddress = await toEVMAddress(address);
  invariant(evmAddress, "hedera: evm address is missing");

  const order = pagination.order ?? "desc";
  const limit = pagination.limit ?? 100;

  // parse cursor based on mode
  // - alpaca mode: composite "mirror:thirdweb" cursor
  // - bridge mode: only mirror cursor
  let mirrorCursor: string | null;
  let erc20Cursor: string | null;

  if (erc20TokenBalances) {
    const compositeCursor = parseCompositeCursor(pagination.lastPagingToken ?? null);
    const mirrorCursorInSeconds = compositeCursor.mirrorCursor?.split(".")[0] ?? null;
    mirrorCursor = compositeCursor.mirrorCursor;
    erc20Cursor = compositeCursor.erc20Cursor ?? mirrorCursorInSeconds;
  } else {
    mirrorCursor = pagination.lastPagingToken ?? null;
    erc20Cursor = null;
  }

  const ledgerAccountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode: "hederaBip44",
  });

  const [mirrorResult, thirdwebResult] = await Promise.all([
    apiClient.getAccountTransactions({
      address,
      pagingToken: mirrorCursor,
      order,
      limit,
      fetchAllPages,
    }),
    erc20TokenBalances
      ? thirdwebClient.getERC20TransactionsForAccount({
          address,
          contractAddresses: erc20TokenBalances.map(token => token.token.contractAddress),
          order,
          limit,
          fetchAllPages: false,
          ...(order === "desc" && { to: erc20Cursor }),
          ...(order === "asc" && { from: erc20Cursor }),
        })
      : Promise.resolve(null),
  ]);

  // enrich raw thirdweb result with mirror data in Alpaca mode
  const enrichedThirdwebResult = thirdwebResult ? await getERC20Operations(thirdwebResult) : [];

  const {
    mergedTransactions,
    mirrorCursor: newMirrorCursor,
    erc20Cursor: newErc20Cursor,
  } = thirdwebResult
    ? mergeAndPaginate({
        mirrorTransactions: mirrorResult.transactions,
        thirdwebTransactions: enrichedThirdwebResult,
        order,
        limit,
      })
    : {
        mergedTransactions: mirrorResult.transactions.map(tx => ({
          type: "mirror" as const,
          data: tx,
        })),
        mirrorCursor: mirrorResult.nextCursor,
        erc20Cursor: null,
      };

  // process transactions
  const coinOperations: Operation<HederaOperationExtra>[] = [];
  const tokenOperations: Operation<HederaOperationExtra>[] = [];

  for (const rawTx of mergedTransactions) {
    if (rawTx.type === "mirror") {
      const commonData = getCommonOperationData(rawTx.data, useEncodedHash, useSyntheticBlocks);
      const stakingAnalysis =
        rawTx.data.name === HEDERA_TRANSACTION_NAMES.UpdateAccount
          ? await analyzeStakingOperation(address, rawTx.data)
          : null;

      // process token transfers
      const tokenResult = await processTokenTransfers({
        rawTx: rawTx.data,
        address,
        currency,
        ledgerAccountId,
        commonData,
        skipFeesForTokenOperations,
      });

      if (tokenResult?.coinOperation) coinOperations.push(tokenResult.coinOperation);
      if (tokenResult?.tokenOperation) tokenOperations.push(tokenResult.tokenOperation);

      // process regular transfers only if there were no token transfers
      if (!tokenResult) {
        const newCoinOperations = processTransfers({
          rawTx: rawTx.data,
          address,
          ledgerAccountId,
          commonData,
          mirrorTokens,
          stakingAnalysis,
        });

        coinOperations.push(...newCoinOperations);
      }
    } else {
      const hash = rawTx.data.mirrorTransaction.transaction_hash;
      const fields = buildERC20OperationFields({
        erc20Operation: rawTx.data,
        evmAddress,
        variant: "add",
      });

      if (!fields) continue;

      const encodedTokenAccountId = encodeTokenAccountId(ledgerAccountId, rawTx.data.token);
      const encodedOperationId = encodeOperationId(encodedTokenAccountId, hash, fields.type);

      tokenOperations.push({
        ...fields,
        id: encodedOperationId,
        accountId: encodedTokenAccountId,
        hash,
      });

      if (fields.type === "OUT") {
        coinOperations.push({
          ...fields,
          id: encodeOperationId(ledgerAccountId, hash, "FEES"),
          accountId: ledgerAccountId,
          type: "FEES",
          value: fields.fee,
          hash,
        });
      }
    }
  }

  const nextMirrorCursor = newMirrorCursor ?? mirrorResult.nextCursor;
  const nextErc20Cursor = newErc20Cursor ?? erc20Cursor;
  const nextCursor = thirdwebResult
    ? createCompositeCursor({ mirrorCursor: nextMirrorCursor, erc20Cursor: nextErc20Cursor })
    : mirrorResult.nextCursor;

  return {
    coinOperations,
    tokenOperations,
    nextCursor,
  };
}

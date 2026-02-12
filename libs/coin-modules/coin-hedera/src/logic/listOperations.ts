import BigNumber from "bignumber.js";
import { getEnv } from "@ledgerhq/live-env";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { encodeAccountId, encodeTokenAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { HEDERA_TRANSACTION_NAMES } from "../constants";
import { apiClient } from "../network/api";
import { parseTransfers } from "../network/utils";
import type {
  HederaMirrorToken,
  HederaMirrorTransaction,
  HederaOperationExtra,
  StakingAnalysis,
} from "../types";
import {
  analyzeStakingOperation,
  base64ToUrlSafeBase64,
  getMemoFromBase64,
  getSyntheticBlock,
} from "./utils";

const txNameToCustomOperationType: Record<string, OperationType> = {
  TOKENASSOCIATE: "ASSOCIATE_TOKEN",
  CONTRACTCALL: "CONTRACT_CALL",
  CRYPTOUPDATEACCOUNT: "UPDATE_ACCOUNT",
};

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

  // update operation type and extra fields if staking analysis is available
  if (stakingAnalysis) {
    operationType = stakingAnalysis.operationType;
    extra.previousStakingNodeId = stakingAnalysis.previousStakingNodeId;
    extra.targetStakingNodeId = stakingAnalysis.targetStakingNodeId;
    extra.stakedAmount = new BigNumber(stakingAnalysis.stakedAmount.toString());
  }

  // each transfer may trigger staking reward claim
  const stakingReward = rawTx.staking_reward_transfers.reduce((acc, transfer) => {
    const transferAmount = new BigNumber(transfer.amount);

    if (transfer.account === address) {
      acc = acc.plus(transferAmount);
    }

    return acc;
  }, new BigNumber(0));

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

export async function listOperations({
  currency,
  address,
  mirrorTokens,
  cursor,
  limit,
  order,
  fetchAllPages,
  skipFeesForTokenOperations,
  useEncodedHash,
  useSyntheticBlocks,
}: {
  currency: CryptoCurrency;
  address: string;
  mirrorTokens: HederaMirrorToken[];
  cursor?: string | undefined;
  limit?: number | undefined;
  order?: "asc" | "desc" | undefined;
  // options for compatibility with old bridge
  fetchAllPages: boolean;
  skipFeesForTokenOperations: boolean;
  useEncodedHash: boolean;
  useSyntheticBlocks: boolean;
}): Promise<{
  coinOperations: Operation<HederaOperationExtra>[];
  tokenOperations: Operation<HederaOperationExtra>[];
  nextCursor: string | null;
}> {
  const coinOperations: Operation<HederaOperationExtra>[] = [];
  const tokenOperations: Operation<HederaOperationExtra>[] = [];
  const mirrorResult = await apiClient.getAccountTransactions({
    address,
    pagingToken: cursor ?? null,
    order: order,
    limit: limit,
    fetchAllPages,
  });
  const ledgerAccountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode: "hederaBip44",
  });

  for (const rawTx of mirrorResult.transactions) {
    const commonData = getCommonOperationData(rawTx, useEncodedHash, useSyntheticBlocks);

    // try to distinguish staking operations for CRYPTOUPDATEACCOUNT transactions
    const stakingAnalysis =
      rawTx.name === HEDERA_TRANSACTION_NAMES.UpdateAccount
        ? await analyzeStakingOperation(address, rawTx)
        : null;

    // process token transfers
    const tokenResult = await processTokenTransfers({
      rawTx,
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
        rawTx,
        address,
        ledgerAccountId,
        commonData,
        mirrorTokens,
        stakingAnalysis,
      });

      coinOperations.push(...newCoinOperations);
    }
  }

  return {
    coinOperations,
    tokenOperations,
    nextCursor: mirrorResult.nextCursor,
  };
}

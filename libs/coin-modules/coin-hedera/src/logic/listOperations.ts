import BigNumber from "bignumber.js";
import { getEnv } from "@ledgerhq/live-env";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Pagination } from "@ledgerhq/coin-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { encodeAccountId, encodeTokenAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { HARDCODED_BLOCK_HEIGHT, HEDERA_TRANSACTION_NAMES } from "../constants";
import { apiClient } from "../network/api";
import { hgraphClient } from "../network/hgraph";
import { parseTransfers, enrichERC20Transfers } from "../network/utils";
import type {
  EnrichedERC20Transfer,
  HederaERC20TokenBalance,
  HederaMirrorToken,
  HederaMirrorTransaction,
  HederaOperationExtra,
  MergedTransaction,
  StakingAnalysis,
} from "../types";
import {
  analyzeStakingOperation,
  base64ToUrlSafeBase64,
  getMemoFromBase64,
  getSyntheticBlock,
  mergeTransactonsFromDifferentSources,
  toEntityId,
} from "./utils";

const txNameToCustomOperationType: Record<string, OperationType> = {
  TOKENASSOCIATE: "ASSOCIATE_TOKEN",
  CONTRACTCALL: "CONTRACT_CALL",
  CRYPTOUPDATEACCOUNT: "UPDATE_ACCOUNT",
};

function getCommonMirrorOperationData(
  rawTx: HederaMirrorTransaction,
  useEncodedHash: boolean,
  useSyntheticBlocks: boolean,
) {
  const date = new Date(Number.parseInt(rawTx.consensus_timestamp.split(".")[0], 10) * 1000);
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
    date,
    hash,
    fee,
    hasFailed,
    blockHeight: useSyntheticBlocks ? syntheticBlock.blockHeight : HARDCODED_BLOCK_HEIGHT,
    blockHash: useSyntheticBlocks ? syntheticBlock.blockHash : null,
    extra,
  };
}

function calculateStakingReward(rawTx: HederaMirrorTransaction, address: string): BigNumber {
  return rawTx.staking_reward_transfers.reduce((acc, transfer) => {
    const transferAmount = new BigNumber(transfer.amount);
    if (transfer.account === address) acc = acc.plus(transferAmount);
    return acc;
  }, new BigNumber(0));
}

function createStakingRewardOperation({
  stakingReward,
  address,
  ledgerAccountId,
  commonData,
}: {
  stakingReward: BigNumber;
  address: string;
  ledgerAccountId: string;
  commonData: ReturnType<typeof getCommonMirrorOperationData>;
}): Operation<HederaOperationExtra> | null {
  if (stakingReward.lte(0)) {
    return null;
  }

  const { hash, date, blockHeight, blockHash } = commonData;
  const stakingRewardHash = `${hash}-staking-reward`;
  const stakingRewardType: OperationType = "REWARD";
  // offset timestamp by +1ms to ensure it appears just before the operation that triggered it
  const stakingRewardTimestamp = new Date(date.getTime() + 1);

  return {
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
    extra: commonData.extra,
  };
}

async function processERC20TokenTransfer({
  enrichedERC20Transfer,
  evmAddress,
  ledgerAccountId,
  commonData,
}: {
  enrichedERC20Transfer: EnrichedERC20Transfer;
  evmAddress: string;
  ledgerAccountId: string;
  commonData: ReturnType<typeof getCommonMirrorOperationData>;
}): Promise<{
  coinOperation: Operation<HederaOperationExtra> | undefined;
  tokenOperation: Operation<HederaOperationExtra>;
} | null> {
  const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(
    enrichedERC20Transfer.transfer.token_evm_address,
    "hedera",
  );

  if (!token) return null;

  let coinOperation: Operation<HederaOperationExtra> | undefined;

  const senderAddress = enrichedERC20Transfer.transfer.sender_account_id
    ? toEntityId({ num: enrichedERC20Transfer.transfer.sender_account_id })
    : enrichedERC20Transfer.transfer.sender_evm_address;
  const recipientAddress = enrichedERC20Transfer.transfer.receiver_account_id
    ? toEntityId({ num: enrichedERC20Transfer.transfer.receiver_account_id })
    : enrichedERC20Transfer.transfer.receiver_evm_address;

  const commonFields = {
    ...commonData,
    type: enrichedERC20Transfer.transfer.sender_evm_address === evmAddress ? "OUT" : "IN",
    contract: token.contractAddress,
    standard: "erc20",
    blockHeight: commonData.blockHeight,
    blockHash: enrichedERC20Transfer.contractCallResult.block_hash,
    senders: [senderAddress],
    recipients: [recipientAddress],
    fee: BigNumber(enrichedERC20Transfer.mirrorTransaction.charged_tx_fee),
    value: BigNumber(enrichedERC20Transfer.transfer.amount),
    extra: {
      ...commonData.extra,
      gasConsumed: enrichedERC20Transfer.contractCallResult.gas_consumed,
      gasLimit: enrichedERC20Transfer.contractCallResult.gas_limit,
      gasUsed: enrichedERC20Transfer.contractCallResult.gas_used,
    },
  } satisfies Partial<Operation<HederaOperationExtra>>;

  const encodedTokenAccountId = encodeTokenAccountId(ledgerAccountId, token);
  const encodedOperationId = encodeOperationId(
    encodedTokenAccountId,
    commonFields.hash,
    commonFields.type,
  );

  const tokenOperation = {
    ...commonFields,
    id: encodedOperationId,
    accountId: encodedTokenAccountId,
  };

  if (commonFields.type === "OUT") {
    coinOperation = {
      ...commonFields,
      id: encodeOperationId(ledgerAccountId, commonFields.hash, "FEES"),
      accountId: ledgerAccountId,
      type: "FEES",
      value: commonFields.fee,
    };
  }

  return {
    coinOperation,
    tokenOperation,
  };
}

async function processHTSTokenTransfers({
  rawTx,
  address,
  currency,
  ledgerAccountId,
  commonData,
}: {
  rawTx: HederaMirrorTransaction;
  address: string;
  currency: CryptoCurrency;
  ledgerAccountId: string;
  commonData: ReturnType<typeof getCommonMirrorOperationData>;
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
  const { hash, fee, date, blockHeight, blockHash, hasFailed } = commonData;
  const extra = { ...commonData.extra };

  let coinOperation: Operation<HederaOperationExtra> | undefined;

  // Add main FEES coin operation for send token transfer
  if (type === "OUT") {
    coinOperation = {
      id: encodeOperationId(ledgerAccountId, hash, "FEES"),
      accountId: ledgerAccountId,
      type: "FEES",
      value: fee,
      recipients,
      senders,
      hash,
      fee,
      date,
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
    date,
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

function processCoinTransfers({
  rawTx,
  address,
  ledgerAccountId,
  commonData,
  mirrorTokens,
  stakingReward,
  stakingAnalysis,
}: {
  rawTx: HederaMirrorTransaction;
  address: string;
  ledgerAccountId: string;
  commonData: ReturnType<typeof getCommonMirrorOperationData>;
  mirrorTokens: HederaMirrorToken[];
  stakingReward: BigNumber;
  stakingAnalysis: StakingAnalysis | null;
}): Operation<HederaOperationExtra>[] {
  const coinOperations: Operation<HederaOperationExtra>[] = [];
  const transfers = rawTx.transfers ?? [];

  if (transfers.length === 0) {
    return [];
  }

  const { type, value, senders, recipients } = parseTransfers(transfers, address, stakingReward);

  const { hash, fee, date, blockHeight, blockHash, hasFailed } = commonData;
  const extra = { ...commonData.extra };
  let operationType = txNameToCustomOperationType[rawTx.name] ?? type;

  // update operation type and extra fields if staking analysis is available
  if (stakingAnalysis) {
    operationType = stakingAnalysis.operationType;
    extra.previousStakingNodeId = stakingAnalysis.previousStakingNodeId;
    extra.targetStakingNodeId = stakingAnalysis.targetStakingNodeId;
    extra.stakedAmount = new BigNumber(stakingAnalysis.stakedAmount.toString());
  }

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

  coinOperations.push({
    id: encodeOperationId(ledgerAccountId, hash, operationType),
    accountId: ledgerAccountId,
    type: operationType,
    value,
    recipients,
    senders,
    hash,
    fee,
    date,
    blockHeight,
    blockHash,
    hasFailed,
    extra,
  });

  return coinOperations;
}

async function processTransactionItem({
  mergedTx,
  address,
  evmAddress,
  currency,
  ledgerAccountId,
  mirrorTokens,
  useEncodedHash,
  useSyntheticBlocks,
}: {
  mergedTx: MergedTransaction;
  address: string;
  evmAddress: string;
  currency: CryptoCurrency;
  ledgerAccountId: string;
  mirrorTokens: HederaMirrorToken[];
  useEncodedHash: boolean;
  useSyntheticBlocks: boolean;
}): Promise<{
  newCoinOperations: Operation<HederaOperationExtra>[];
  newTokenOperations: Operation<HederaOperationExtra>[];
}> {
  const newCoinOperations: Operation<HederaOperationExtra>[] = [];
  const newTokenOperations: Operation<HederaOperationExtra>[] = [];

  const mirrorTx = mergedTx.type === "mirror" ? mergedTx.data : mergedTx.data.mirrorTransaction;
  const commonData = getCommonMirrorOperationData(mirrorTx, useEncodedHash, useSyntheticBlocks);

  const stakingReward = calculateStakingReward(mirrorTx, address);
  const rewardOp = createStakingRewardOperation({
    stakingReward,
    address,
    ledgerAccountId,
    commonData,
  });
  if (rewardOp) newCoinOperations.push(rewardOp);

  const stakingAnalysis =
    mirrorTx.name === HEDERA_TRANSACTION_NAMES.UpdateAccount
      ? await analyzeStakingOperation({ currency, address, mirrorTx })
      : null;

  if (mergedTx.type === "mirror") {
    const htsTokenResult = await processHTSTokenTransfers({
      rawTx: mirrorTx,
      address,
      currency,
      ledgerAccountId,
      commonData,
    });

    if (htsTokenResult?.tokenOperation) newTokenOperations.push(htsTokenResult.tokenOperation);
    if (htsTokenResult?.coinOperation) newCoinOperations.push(htsTokenResult.coinOperation);

    if (!htsTokenResult) {
      const coinOps = processCoinTransfers({
        rawTx: mirrorTx,
        address,
        ledgerAccountId,
        commonData,
        mirrorTokens,
        stakingReward,
        stakingAnalysis,
      });
      newCoinOperations.push(...coinOps);
    }
  } else {
    const erc20TokenResult = await processERC20TokenTransfer({
      enrichedERC20Transfer: mergedTx.data,
      evmAddress,
      ledgerAccountId,
      commonData,
    });

    if (erc20TokenResult?.tokenOperation) newTokenOperations.push(erc20TokenResult.tokenOperation);
    if (erc20TokenResult?.coinOperation) newCoinOperations.push(erc20TokenResult.coinOperation);
  }

  return { newCoinOperations, newTokenOperations };
}

export async function listOperations({
  currency,
  address,
  evmAddress,
  mirrorTokens,
  erc20Tokens,
  pagination,
  fetchAllPages,
  skipFeesForTokenOperations,
  useEncodedHash,
  useSyntheticBlocks,
}: {
  currency: CryptoCurrency;
  address: string;
  evmAddress: string;
  mirrorTokens: HederaMirrorToken[];
  erc20Tokens: HederaERC20TokenBalance[];
  pagination: Pagination;
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
  const limit = pagination.limit ?? 100;
  const order = pagination.order ?? "desc";
  const cursor = pagination.lastPagingToken ?? null;
  const ledgerAccountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode: "hederaBip44",
  });

  // fetch transactions from both sources in parallel
  const [mirrorTransactions, enrichedERC20Transfers, latestHgraphIndexedTimestampNs] =
    await Promise.all([
      apiClient.getAccountTransactions({
        currency,
        address,
        order,
        limit,
        fetchAllPages,
        pagingToken: cursor,
      }),
      hgraphClient
        .getERC20Transfers({
          currency,
          address,
          order,
          limit,
          fetchAllPages,
          tokenEvmAddresses: erc20Tokens.map(t => t.token.contractAddress.toLowerCase()),
          ...(cursor && { timestamp: cursor }),
        })
        .then(erc20Transfers => enrichERC20Transfers({ currency, erc20Transfers })),
      hgraphClient.getLastestIndexedConsensusTimestamp({ currency }),
    ]);

  // merge transactions, ensuring no duplicates, correct ordering and pagination handling
  const mergeResult = mergeTransactonsFromDifferentSources({
    mirrorTransactions: mirrorTransactions.transactions,
    enrichedERC20Transfers,
    order,
    limit,
    latestHgraphIndexedTimestampNs,
    fetchAllPages,
  });

  for (const mergedTx of mergeResult.merged) {
    const result = await processTransactionItem({
      mergedTx,
      address,
      evmAddress,
      currency,
      ledgerAccountId,
      mirrorTokens,
      useEncodedHash,
      useSyntheticBlocks,
    });

    coinOperations.push(...result.newCoinOperations);
    tokenOperations.push(...result.newTokenOperations);
  }

  return {
    tokenOperations,
    coinOperations: skipFeesForTokenOperations
      ? coinOperations.filter(op => op.type !== "FEES")
      : coinOperations,
    nextCursor: mergeResult.nextCursor,
  };
}

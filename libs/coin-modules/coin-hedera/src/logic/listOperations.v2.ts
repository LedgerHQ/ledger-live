import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import {
  encodeAccountId,
  encodeTokenAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { getEnv } from "@ledgerhq/live-env";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { HederaCoinConfig } from "../config";
import {
  HARDCODED_BLOCK_HEIGHT,
  HEDERA_TRANSACTION_NAMES,
  MAP_TX_NAME_TO_CUSTOM_OPERATION_TYPE,
} from "../constants";
import { apiClient } from "../network/api";
import { hgraphClient } from "../network/hgraph";
import { parseTransfers, enrichERC20Transfers, analyzeStakingOperation } from "../network/utils";
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
  base64ToUrlSafeBase64,
  createStakingRewardOperationHash,
  extractFeesPayer,
  getMemoFromBase64,
  getSyntheticBlock,
  mergeTransactionsFromDifferentSources,
  toEntityId,
} from "./utils";

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
  const feesPayer = extractFeesPayer(rawTx);
  const extra: HederaOperationExtra = {
    pagingToken: rawTx.consensus_timestamp,
    consensusTimestamp: rawTx.consensus_timestamp,
    transactionId: rawTx.transaction_id,
    feesPayer,
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
    return transfer.account === address ? acc.plus(transferAmount) : acc;
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
  const stakingRewardHash = createStakingRewardOperationHash(hash);
  const stakingRewardType: OperationType = "REWARD";
  // offset timestamp by +1ms so that, when operations are sorted newest-first, this reward appears just before the operation that triggered it
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

function getOperationTypeFromERC20Details({
  transferType,
  senderEvmAddress,
  evmAddress,
}: {
  transferType: string;
  senderEvmAddress: string;
  evmAddress: string;
}): OperationType {
  if (transferType === "mint") return "IN";
  if (transferType === "burn") return "OUT";

  return senderEvmAddress.toLowerCase() === evmAddress.toLowerCase() ? "OUT" : "IN";
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
  tokenOperations: Operation<HederaOperationExtra>[];
}> {
  let coinOperation: Operation<HederaOperationExtra> | undefined;
  const tokenOperations: Operation<HederaOperationExtra>[] = [];

  for (const transfer of enrichedERC20Transfer.transfers) {
    const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(
      transfer.token_evm_address,
      "hedera",
    );

    if (!token) continue;

    const senderEvmAddress = transfer.sender_evm_address;
    const senderAddress = transfer.sender_account_id
      ? toEntityId({ num: transfer.sender_account_id })
      : transfer.sender_evm_address;
    const recipientAddress = transfer.receiver_account_id
      ? toEntityId({ num: transfer.receiver_account_id })
      : transfer.receiver_evm_address;

    // meaningful operation cannot be created without correct addresses, so we skip it
    if (!senderEvmAddress || !senderAddress || !recipientAddress) continue;

    const commonFields = {
      ...commonData,
      type: getOperationTypeFromERC20Details({
        transferType: transfer.transfer_type,
        senderEvmAddress,
        evmAddress,
      }),
      contract: token.contractAddress,
      standard: "erc20",
      blockHeight: commonData.blockHeight,
      blockHash: commonData.blockHash,
      senders: [senderAddress],
      recipients: [recipientAddress],
      fee: new BigNumber(enrichedERC20Transfer.mirrorTransaction.charged_tx_fee),
      value: new BigNumber(transfer.amount),
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
    } satisfies Operation<HederaOperationExtra>;

    tokenOperations.push(tokenOperation);
  }

  // create FEES operation for outgoing ERC20 transfer
  const outgoingTransfer = tokenOperations.find(transfer => transfer.type === "OUT");
  if (outgoingTransfer) {
    coinOperation = {
      ...commonData,
      id: encodeOperationId(ledgerAccountId, commonData.hash, "FEES"),
      accountId: ledgerAccountId,
      type: "FEES",
      ...(outgoingTransfer.contract && { contract: outgoingTransfer.contract }),
      ...(outgoingTransfer.standard && { standard: outgoingTransfer.standard }),
      blockHeight: outgoingTransfer.blockHeight,
      blockHash: outgoingTransfer.blockHash,
      senders: outgoingTransfer.senders,
      recipients: outgoingTransfer.recipients,
      fee: outgoingTransfer.fee,
      value: outgoingTransfer.fee,
      extra: outgoingTransfer.extra,
    } satisfies Operation<HederaOperationExtra>;
  }

  return {
    coinOperation,
    tokenOperations,
  };
}

async function processHTSTokenTransfers({
  rawTx,
  address,
  currencyId,
  ledgerAccountId,
  commonData,
}: {
  rawTx: HederaMirrorTransaction;
  address: string;
  currencyId: string;
  ledgerAccountId: string;
  commonData: ReturnType<typeof getCommonMirrorOperationData>;
}): Promise<{
  coinOperation: Operation<HederaOperationExtra> | undefined;
  tokenOperation: Operation<HederaOperationExtra>;
} | null> {
  const tokenTransfers = rawTx.token_transfers ?? [];
  if (tokenTransfers.length === 0) return null;

  const tokenId = tokenTransfers[0].token_id;
  const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(tokenId, currencyId);
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
    } satisfies Operation<HederaOperationExtra>;
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
  let operationType = MAP_TX_NAME_TO_CUSTOM_OPERATION_TYPE[rawTx.name] ?? type;

  // update operation type and extra fields if staking analysis is available
  if (stakingAnalysis) {
    operationType = stakingAnalysis.operationType;
    extra.previousStakingNodeId = stakingAnalysis.previousStakingNodeId;
    extra.targetStakingNodeId = stakingAnalysis.targetStakingNodeId;
    extra.stakedAmount = new BigNumber(stakingAnalysis.stakedAmount.toString());
  }

  // if recipients array is empty, add the node where the transaction was submitted as recipient
  if (recipients.length === 0 && rawTx.node) {
    recipients.push(rawTx.node);
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
  config,
  currencyId,
  ledgerAccountId,
  mirrorTokens,
  useEncodedHash,
  useSyntheticBlocks,
}: {
  mergedTx: MergedTransaction;
  address: string;
  evmAddress: string;
  config?: HederaCoinConfig;
  currencyId: string;
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
      ? await analyzeStakingOperation({
          configOrCurrencyId: config ?? currencyId,
          address,
          mirrorTx,
        })
      : null;

  if (mergedTx.type === "mirror") {
    const htsTokenResult = await processHTSTokenTransfers({
      rawTx: mirrorTx,
      address,
      currencyId,
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

    if (erc20TokenResult.coinOperation) newCoinOperations.push(erc20TokenResult.coinOperation);
    newTokenOperations.push(...erc20TokenResult.tokenOperations);
  }

  return { newCoinOperations, newTokenOperations };
}

export async function listOperationsV2({
  config,
  currencyId,
  address,
  evmAddress,
  mirrorTokens,
  erc20Tokens,
  cursor,
  limit = 100,
  order = "desc",
  fetchAllPages,
  skipFeesForTokenOperations,
  useEncodedHash,
  useSyntheticBlocks,
}: {
  config?: HederaCoinConfig;
  currencyId: string;
  address: string;
  evmAddress: string;
  mirrorTokens: HederaMirrorToken[];
  erc20Tokens: HederaERC20TokenBalance[];
  cursor?: string;
  limit?: number;
  order?: "asc" | "desc";
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

  const ledgerAccountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currencyId,
    xpubOrAddress: address,
    derivationMode: "hederaBip44",
  });

  // fetch transactions from both sources in parallel
  const [mirrorTransactions, enrichedERC20Transfers, latestHgraphIndexedTimestampNs] =
    await Promise.all([
      apiClient.getAccountTransactions({
        configOrCurrencyId: config ?? currencyId,
        address,
        order,
        limit,
        fetchAllPages,
        pagingToken: cursor ?? null,
      }),
      hgraphClient
        .getERC20Transfers({
          configOrCurrencyId: config ?? currencyId,
          address,
          order,
          limit,
          fetchAllPages,
          tokenEvmAddresses: erc20Tokens.map(t => t.token.contractAddress.toLowerCase()),
          ...(cursor && { timestamp: cursor }),
        })
        .then(erc20Transfers =>
          enrichERC20Transfers({ configOrCurrencyId: config ?? currencyId, erc20Transfers }),
        ),
      hgraphClient.getLatestIndexedConsensusTimestamp({ configOrCurrencyId: config ?? currencyId }),
    ]);

  // merge transactions, ensuring no duplicates, correct ordering and pagination handling
  const mergeResult = mergeTransactionsFromDifferentSources({
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
      currencyId,
      ledgerAccountId,
      mirrorTokens,
      useEncodedHash,
      useSyntheticBlocks,
      ...(config && { config }),
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

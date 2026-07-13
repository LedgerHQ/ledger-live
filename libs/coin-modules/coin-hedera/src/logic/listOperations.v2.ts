import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
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
  HederaMirrorToken,
  HederaMirrorTokenTransfer,
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
    id: `${stakingRewardHash}:${stakingRewardType}`,
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
    const tokenEvmAddress = transfer.token_evm_address;
    const senderEvmAddress = transfer.sender_evm_address;
    const senderAddress = transfer.sender_account_id
      ? toEntityId({ num: transfer.sender_account_id })
      : transfer.sender_evm_address;
    const recipientAddress = transfer.receiver_account_id
      ? toEntityId({ num: transfer.receiver_account_id })
      : transfer.receiver_evm_address;

    // meaningful operation cannot be created without correct addresses, so we skip it
    if (!tokenEvmAddress || !senderEvmAddress || !senderAddress || !recipientAddress) continue;

    const commonFields = {
      ...commonData,
      type: getOperationTypeFromERC20Details({
        transferType: transfer.transfer_type,
        senderEvmAddress,
        evmAddress,
      }),
      contract: tokenEvmAddress,
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

    const tokenOperation = {
      ...commonFields,
      id: `${commonFields.hash}:${commonFields.type}:${tokenEvmAddress}`,
      accountId: ledgerAccountId,
    } satisfies Operation<HederaOperationExtra>;

    tokenOperations.push(tokenOperation);
  }

  // create FEES operation for outgoing ERC20 transfer
  const outgoingTransfer = tokenOperations.find(transfer => transfer.type === "OUT");
  if (outgoingTransfer) {
    coinOperation = {
      ...commonData,
      id: `${commonData.hash}:FEES`,
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

// Returns null when the mirror data doesn't support sender->receiver pairing
// (e.g. many-to-many transfers); callers should then emit a single netted operation.
function decomposeSoleSenderFanout({
  address,
  senders,
  recipients,
  recipientNets,
  valueLeg,
}: {
  address: string;
  senders: string[];
  recipients: string[];
  recipientNets: Map<string, BigNumber>;
  valueLeg: BigNumber;
}): { recipient: string; net: BigNumber }[] | null {
  const isSoleSender = senders.length === 1 && senders[0] === address;
  if (!isSoleSender || recipients.length <= 1) return null;

  const recipientSum = [...recipientNets.values()].reduce(
    (acc, amount) => acc.plus(amount),
    new BigNumber(0),
  );
  if (!recipientSum.eq(valueLeg)) return null;

  return recipients.map(recipient => ({
    recipient,
    net: recipientNets.get(recipient) ?? new BigNumber(0),
  }));
}

// True when a third party moved this transfer via a granted allowance (Hedera "approval" transfer).
function isApprovalTransfer(
  transfer: { account: string; amount: number; is_approval?: boolean },
  address: string,
): boolean {
  return transfer.account === address && transfer.amount < 0 && !!transfer.is_approval;
}

function groupTransfersByTokenId(
  transfers: HederaMirrorTokenTransfer[],
): Map<string, HederaMirrorTokenTransfer[]> {
  const grouped = new Map<string, HederaMirrorTokenTransfer[]>();
  for (const transfer of transfers) {
    const group = grouped.get(transfer.token_id);
    if (group) {
      group.push(transfer);
    } else {
      grouped.set(transfer.token_id, [transfer]);
    }
  }
  return grouped;
}

// The HBAR fee is attributed in processCoinTransfers; no FEES op is created here.
function processHTSTokenTransfers({
  rawTx,
  address,
  ledgerAccountId,
  commonData,
}: {
  rawTx: HederaMirrorTransaction;
  address: string;
  ledgerAccountId: string;
  commonData: ReturnType<typeof getCommonMirrorOperationData>;
}): Operation<HederaOperationExtra>[] {
  const tokenTransfers = rawTx.token_transfers ?? [];
  if (tokenTransfers.length === 0) return [];

  const { hash, fee, date, blockHeight, blockHash, hasFailed } = commonData;
  const transfersByTokenId = groupTransfersByTokenId(tokenTransfers);
  const tokenOperations: Operation<HederaOperationExtra>[] = [];

  for (const [tokenId, group] of transfersByTokenId) {
    const { type, value, senders, recipients, recipientNets } = parseTransfers(group, address);

    if (type === "NONE" || value.isZero()) continue;

    const isApproval = group.some(transfer => isApprovalTransfer(transfer, address));

    const commonFields = {
      accountId: ledgerAccountId,
      contract: tokenId,
      standard: "hts",
      type,
      hash,
      fee,
      date,
      blockHeight,
      blockHash,
      hasFailed,
      extra: {
        ...commonData.extra,
        ...(isApproval && { isApproval: true }),
      },
    } satisfies Partial<Operation<HederaOperationExtra>>;

    const pushTokenOperation = (idSuffix: string, legValue: BigNumber, legRecipients: string[]) => {
      tokenOperations.push({
        ...commonFields,
        id: `${hash}:${type}:${tokenId}${idSuffix}`,
        value: legValue,
        recipients: legRecipients,
        senders,
      } satisfies Operation<HederaOperationExtra>);
    };

    const fanout =
      type === "OUT"
        ? decomposeSoleSenderFanout({
            address,
            senders,
            recipients,
            recipientNets,
            valueLeg: value,
          })
        : null;

    if (fanout) {
      for (const { recipient, net } of fanout) {
        pushTokenOperation(`:${recipient}`, net, [recipient]);
      }
    } else {
      pushTokenOperation("", value, recipients);
    }
  }

  return tokenOperations;
}

function buildCoinOperation({
  commonData,
  ledgerAccountId,
  idSuffix,
  type,
  value,
  senders,
  recipients,
  extra,
}: {
  commonData: ReturnType<typeof getCommonMirrorOperationData>;
  ledgerAccountId: string;
  idSuffix: string;
  type: OperationType;
  value: BigNumber;
  senders: string[];
  recipients: string[];
  extra: HederaOperationExtra;
}): Operation<HederaOperationExtra> {
  const { hash, fee, date, blockHeight, blockHash, hasFailed } = commonData;
  return {
    id: `${hash}:${idSuffix}`,
    accountId: ledgerAccountId,
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

  const { senders, recipients, netAmount, recipientNets } = parseTransfers(
    transfers,
    address,
    stakingReward,
  );
  const fee = commonData.fee;

  const isApproval = transfers.some(transfer => isApprovalTransfer(transfer, address));
  const customType = MAP_TX_NAME_TO_CUSTOM_OPERATION_TYPE[rawTx.name];

  if (customType || stakingAnalysis) {
    const extra = { ...commonData.extra };
    let operationType: OperationType =
      customType ?? (netAmount.lt(0) ? "OUT" : netAmount.gt(0) ? "IN" : "NONE");

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

    coinOperations.push(
      buildCoinOperation({
        commonData,
        ledgerAccountId,
        idSuffix: operationType,
        type: operationType,
        value: netAmount.abs(),
        senders,
        recipients,
        extra,
      }),
    );

    return coinOperations;
  }

  // Mirror nets the payer's row as value+fee combined; add the fee back to
  // recover the pre-fee transfer amount so direction/value can be classified.
  const isPayer = extractFeesPayer(rawTx) === address;
  const valueDelta = netAmount.plus(isPayer ? fee : new BigNumber(0));

  const pushFeesOperation = (parties?: Pick<Operation, "senders" | "recipients">) => {
    coinOperations.push(
      buildCoinOperation({
        commonData,
        ledgerAccountId,
        idSuffix: "FEES",
        type: "FEES",
        value: fee,
        senders: parties?.senders ?? senders,
        recipients:
          parties?.recipients ??
          (recipients.length === 0 && rawTx.node ? [rawTx.node] : recipients),
        extra: { ...commonData.extra },
      }),
    );
  };

  if (valueDelta.lt(0)) {
    // Fee is duplicated onto every fanned-out OUT leg (known limitation).
    const fanout = decomposeSoleSenderFanout({
      address,
      senders,
      recipients,
      recipientNets,
      valueLeg: valueDelta.abs(),
    });

    if (fanout) {
      for (const { recipient, net } of fanout) {
        coinOperations.push(
          buildCoinOperation({
            commonData,
            ledgerAccountId,
            idSuffix: `OUT:${recipient}`,
            type: "OUT",
            // value is fee-inclusive only when this account paid the fee
            value: net.plus(isPayer ? fee : new BigNumber(0)),
            senders,
            recipients: [recipient],
            extra: { ...commonData.extra, ...(isApproval && { isApproval: true }) },
          }),
        );
      }
    } else {
      // OUT value includes the fee (Ledger Live convention); no separate FEES op.
      coinOperations.push(
        buildCoinOperation({
          commonData,
          ledgerAccountId,
          idSuffix: "OUT",
          type: "OUT",
          value: netAmount.abs(),
          senders,
          recipients: recipients.length === 0 && rawTx.node ? [rawTx.node] : recipients,
          extra: { ...commonData.extra, ...(isApproval && { isApproval: true }) },
        }),
      );
    }
  } else if (valueDelta.gt(0)) {
    // IN excludes the fee; a fee paid by the user (e.g. swap) becomes a separate FEES op.
    coinOperations.push(
      buildCoinOperation({
        commonData,
        ledgerAccountId,
        idSuffix: "IN",
        type: "IN",
        value: valueDelta,
        senders,
        recipients,
        extra: { ...commonData.extra },
      }),
    );

    if (isPayer && fee.gt(0)) {
      pushFeesOperation();
    }
  } else if (isPayer && fee.gt(0)) {
    // token-only send: no HBAR leg, but attribute the FEES op to the token transfer's parties
    const tokenTransfers = rawTx.token_transfers ?? [];
    pushFeesOperation(
      tokenTransfers.length > 0 ? parseTransfers(tokenTransfers, address) : undefined,
    );
  }

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
    // a single CryptoTransfer can move HBAR and HTS tokens at once, so run both paths
    const tokenOps = processHTSTokenTransfers({
      rawTx: mirrorTx,
      address,
      ledgerAccountId,
      commonData,
    });
    newTokenOperations.push(...tokenOps);

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
  tokenEvmAddresses,
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
  tokenEvmAddresses: string[];
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
          tokenEvmAddresses,
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

  // Keep standalone FEES ops (e.g. allowance approve, netted self-send) — they're
  // the tx's only trace, unlike FEES ops that accompany a token op of the same tx.
  const tokenOperationHashes = new Set(tokenOperations.map(op => op.hash));

  return {
    tokenOperations,
    coinOperations: skipFeesForTokenOperations
      ? coinOperations.filter(op => op.type !== "FEES" || !tokenOperationHashes.has(op.hash))
      : coinOperations,
    nextCursor: mergeResult.nextCursor,
  };
}

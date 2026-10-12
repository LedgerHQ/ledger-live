import { promiseAllBatched } from "@ledgerhq/coin-module-framework/promises";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import countBy from "lodash/countBy";
import {
  HARDCODED_BLOCK_HEIGHT,
  HEDERA_TRANSACTION_NAMES,
  MAP_TX_NAME_TO_CUSTOM_OPERATION_TYPE,
  STAKING_REWARD_ACCOUNT_ID,
} from "../constants";
import { apiClient } from "../network/api";
import { hgraphClient } from "../network/hgraph";
import {
  parseTransfers,
  enrichERC20Transfers,
  analyzeStakingOperation,
  findFeeRecipient,
} from "../network/utils";
import type {
  HederaCoinConfig,
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

function calculateStakingRewards(rawTx: HederaMirrorTransaction): Map<string, BigNumber> {
  const rewards = new Map<string, BigNumber>();
  for (const transfer of rawTx.staking_reward_transfers) {
    const previous = rewards.get(transfer.account) ?? new BigNumber(0);
    rewards.set(transfer.account, previous.plus(transfer.amount));
  }
  return rewards;
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
    senders: [STAKING_REWARD_ACCOUNT_ID],
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

type ERC20Movement = {
  tokenEvmAddress: string;
  type: OperationType;
  senderAddress: string;
  recipientAddress: string;
  amount: BigNumber;
};

/** hgraph lists one row per Transfer log, so a contract can move the same token to the same
 *  counterparty several times in one tx: those rows are summed, like the HTS path nets per account */
function sumERC20Movements(
  enrichedERC20Transfer: EnrichedERC20Transfer,
  evmAddress: string,
): ERC20Movement[] {
  const movements = new Map<string, ERC20Movement>();

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

    const type = getOperationTypeFromERC20Details({
      transferType: transfer.transfer_type,
      senderEvmAddress,
      evmAddress,
    });
    const counterparty = type === "OUT" ? recipientAddress : senderAddress;
    const key = `${tokenEvmAddress}:${type}:${counterparty}`;
    const movement = movements.get(key);

    if (movement) {
      movement.amount = movement.amount.plus(transfer.amount);
    } else {
      movements.set(key, {
        tokenEvmAddress,
        type,
        senderAddress,
        recipientAddress,
        amount: new BigNumber(transfer.amount),
      });
    }
  }

  return [...movements.values()];
}

function processERC20TokenTransfer({
  enrichedERC20Transfer,
  address,
  evmAddress,
  ledgerAccountId,
  commonData,
  stakingRewards,
}: {
  enrichedERC20Transfer: EnrichedERC20Transfer;
  address: string;
  evmAddress: string;
  ledgerAccountId: string;
  commonData: ReturnType<typeof getCommonMirrorOperationData>;
  stakingRewards: Map<string, BigNumber>;
}): {
  coinOperations: Operation<HederaOperationExtra>[];
  tokenOperations: Operation<HederaOperationExtra>[];
} {
  const { mirrorTransaction, contractCallResult } = enrichedERC20Transfer;
  const fee = new BigNumber(mirrorTransaction.charged_tx_fee);
  const extra = {
    ...commonData.extra,
    gasConsumed: contractCallResult.gas_consumed,
    gasLimit: contractCallResult.gas_limit,
    gasUsed: contractCallResult.gas_used,
  };

  const movements = sumERC20Movements(enrichedERC20Transfer, evmAddress);
  const movementsPerTokenAndType = countBy(movements, m => `${m.tokenEvmAddress}:${m.type}`);

  const tokenOperations = movements.map(movement => {
    const { tokenEvmAddress, type } = movement;
    // several counterparties of one token and direction each need their own id
    const isOneOfSeveral = movementsPerTokenAndType[`${tokenEvmAddress}:${type}`] > 1;
    const counterparty = type === "OUT" ? movement.recipientAddress : movement.senderAddress;

    return {
      ...commonData,
      id: `${commonData.hash}:${type}:${tokenEvmAddress}${isOneOfSeveral ? `:${counterparty}` : ""}`,
      accountId: ledgerAccountId,
      type,
      contract: tokenEvmAddress,
      standard: "erc20",
      senders: [movement.senderAddress],
      recipients: [movement.recipientAddress],
      fee,
      value: movement.amount,
      extra,
    } satisfies Operation<HederaOperationExtra>;
  });

  const coinOperations: Operation<HederaOperationExtra>[] = [];
  const transfers = mirrorTransaction.transfers ?? [];
  const parsed = parseTransfers(transfers, address, stakingRewards);
  // a relayer often pays for an EVM wallet's tx, and then the account owes no fee
  const isPayer = commonData.extra.feesPayer === address;
  const ownFee = isPayer ? fee : new BigNumber(0);
  // HBAR the contract call moved besides the fee, e.g. the HBAR side of a token swap
  const valueDelta = (parsed.netAmount ?? new BigNumber(0)).plus(ownFee);

  if (!valueDelta.isZero()) {
    coinOperations.push(
      buildCoinOperation({
        commonData,
        ledgerAccountId,
        type: valueDelta.isPositive() ? "IN" : "OUT",
        value: valueDelta.abs(),
        fee: new BigNumber(0),
        senders: parsed.senders,
        recipients: parsed.recipients,
        extra: { ...commonData.extra },
      }),
    );
  }

  if (isPayer && fee.gt(0)) {
    const feeRecipient = mirrorTransaction.node ?? findFeeRecipient(transfers);
    const feeToken =
      tokenOperations.find(tokenOperation => tokenOperation.type === "OUT") ?? tokenOperations[0];
    coinOperations.push({
      ...commonData,
      id: `${commonData.hash}:FEES`,
      accountId: ledgerAccountId,
      type: "FEES",
      ...(feeToken && { contract: feeToken.contract, standard: feeToken.standard }),
      senders: [address],
      recipients: feeRecipient ? [feeRecipient] : [],
      fee,
      value: fee,
      extra,
    } satisfies Operation<HederaOperationExtra>);
  }

  return { coinOperations, tokenOperations };
}

type RecipientAmount = { recipient: string; amount: BigNumber };

/** null when the mirror transfers can't be attributed to individual recipients */
function resolveAmountPerRecipient({
  address,
  senders,
  recipients,
  amountByRecipient,
  expectedTotal,
}: {
  address: string;
  senders: string[];
  recipients: string[];
  amountByRecipient: Map<string, BigNumber>;
  expectedTotal: BigNumber;
}): [RecipientAmount, ...RecipientAmount[]] | null {
  const isSoleSender = senders.length === 1 && senders[0] === address;
  if (!isSoleSender || recipients.length <= 1) return null;

  const recipientSum = [...amountByRecipient.values()].reduce(
    (acc, amount) => acc.plus(amount),
    new BigNumber(0),
  );
  if (!recipientSum.eq(expectedTotal)) return null;

  // the guard above keeps more than one recipient, so the list is never empty
  const [firstRecipientAmount, ...otherRecipientAmounts] = recipients.map(recipient => ({
    recipient,
    amount: amountByRecipient.get(recipient) ?? new BigNumber(0),
  }));

  return [firstRecipientAmount, ...otherRecipientAmounts];
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
    const { senders, recipients, netAmount, amountByRecipient } = parseTransfers(group, address);

    if (!netAmount || netAmount.isZero()) continue;

    const type: OperationType = netAmount.isNegative() ? "OUT" : "IN";
    const value = netAmount.abs();

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
      extra: { ...commonData.extra },
    } satisfies Partial<Operation<HederaOperationExtra>>;

    const pushTokenOperation = (idSuffix: string, amount: BigNumber, recipientList: string[]) => {
      tokenOperations.push({
        ...commonFields,
        id: `${hash}:${type}:${tokenId}${idSuffix}`,
        value: amount,
        recipients: recipientList,
        senders,
      } satisfies Operation<HederaOperationExtra>);
    };

    const amountPerRecipient =
      type === "OUT"
        ? resolveAmountPerRecipient({
            address,
            senders,
            recipients,
            amountByRecipient,
            expectedTotal: value,
          })
        : null;

    if (amountPerRecipient) {
      for (const { recipient, amount } of amountPerRecipient) {
        pushTokenOperation(`:${recipient}`, amount, [recipient]);
      }
    } else {
      pushTokenOperation("", value, recipients);
    }
  }

  return tokenOperations;
}

// `recipient` marks one of several operations of the same type in a tx, so its id must say which
type CoinOperationTarget = { recipients: string[] } | { recipient: string };

function buildCoinOperation({
  commonData,
  ledgerAccountId,
  type,
  value,
  fee,
  senders,
  extra,
  ...target
}: {
  commonData: ReturnType<typeof getCommonMirrorOperationData>;
  ledgerAccountId: string;
  type: OperationType;
  value: BigNumber;
  fee?: BigNumber;
  senders: string[];
  extra: HederaOperationExtra;
} & CoinOperationTarget): Operation<HederaOperationExtra> {
  const { hash, fee: txFee, date, blockHeight, blockHash, hasFailed } = commonData;
  const isPerRecipient = "recipient" in target;

  return {
    id: isPerRecipient ? `${hash}:${type}:${target.recipient}` : `${hash}:${type}`,
    accountId: ledgerAccountId,
    type,
    value,
    recipients: isPerRecipient ? [target.recipient] : target.recipients,
    senders,
    hash,
    fee: fee ?? txFee,
    date,
    blockHeight,
    blockHash,
    hasFailed,
    extra,
  };
}

function toOperationTypeFromNetAmount(netAmount: BigNumber): OperationType {
  if (netAmount.lt(0)) return "OUT";
  if (netAmount.gt(0)) return "IN";
  return "NONE";
}

function buildCustomOrStakingOperation({
  rawTx,
  ledgerAccountId,
  commonData,
  mirrorTokens,
  stakingAnalysis,
  customType,
  netAmount,
  ownFee,
  senders,
  recipients,
  feeRecipient,
}: {
  rawTx: HederaMirrorTransaction;
  ledgerAccountId: string;
  commonData: ReturnType<typeof getCommonMirrorOperationData>;
  mirrorTokens: HederaMirrorToken[];
  stakingAnalysis: StakingAnalysis | null;
  customType: OperationType | undefined;
  netAmount: BigNumber;
  ownFee: BigNumber;
  senders: string[];
  recipients: string[];
  feeRecipient: string | null;
}): Operation<HederaOperationExtra> {
  const extra = { ...commonData.extra };
  let operationType: OperationType = customType ?? toOperationTypeFromNetAmount(netAmount);

  if (stakingAnalysis) {
    operationType = stakingAnalysis.operationType;
    extra.previousStakingNodeId = stakingAnalysis.previousStakingNodeId;
    extra.targetStakingNodeId = stakingAnalysis.targetStakingNodeId;
    extra.stakedAmount = new BigNumber(stakingAnalysis.stakedAmount.toString());
  }

  if (operationType === "ASSOCIATE_TOKEN") {
    // read by the Hedera family's custom OperationDetails components
    const relatedMirrorToken = mirrorTokens.find(t => {
      return t.created_timestamp === rawTx.consensus_timestamp;
    });

    if (relatedMirrorToken) {
      extra.associatedTokenId = relatedMirrorToken.token_id;
    }
  }

  return buildCoinOperation({
    commonData,
    ledgerAccountId,
    type: operationType,
    value: netAmount.abs(),
    fee: ownFee,
    senders,
    recipients: recipients.length === 0 && feeRecipient ? [feeRecipient] : recipients,
    extra,
  });
}

function processCoinTransfers({
  rawTx,
  address,
  ledgerAccountId,
  commonData,
  mirrorTokens,
  stakingRewards,
  stakingAnalysis,
}: {
  rawTx: HederaMirrorTransaction;
  address: string;
  ledgerAccountId: string;
  commonData: ReturnType<typeof getCommonMirrorOperationData>;
  mirrorTokens: HederaMirrorToken[];
  stakingRewards: Map<string, BigNumber>;
  stakingAnalysis: StakingAnalysis | null;
}): Operation<HederaOperationExtra>[] {
  const transfers = rawTx.transfers ?? [];

  if (transfers.length === 0) {
    return [];
  }

  const parsed = parseTransfers(transfers, address, stakingRewards);
  const { senders, recipients, amountByRecipient } = parsed;
  const netAmount = parsed.netAmount ?? new BigNumber(0);
  const fee = commonData.fee;
  const isPayer = commonData.extra.feesPayer === address;
  const payerFee = isPayer ? fee : new BigNumber(0);
  // A failed tx moves nothing but fees, and they are not always `charged_tx_fee` on the payer: an
  // atomic batch's failed inner tx can debit more, an EVM tx splits gas between payer and signer.
  const failedTxDebit = BigNumber.max(netAmount.negated(), 0);
  // an op's `fee` must match what is baked into its `value`, or getOperationValue subtracts it twice
  const ownFee = commonData.hasFailed ? failedTxDebit : payerFee;

  // the network collects the fee, so a FEES op is addressed to the node that submitted the tx;
  // child records carry no node, so the transfers are the only trace of where the fee went
  const feeRecipient = rawTx.node ?? findFeeRecipient(transfers);

  const customType = MAP_TX_NAME_TO_CUSTOM_OPERATION_TYPE[rawTx.name];
  // mirror nets the payer's row as value+fee, so add the fee back to recover the transfer amount
  const valueDelta = netAmount.plus(ownFee);

  // custom types count as outgoing, so HBAR a contract call pays out to the account stays an IN
  if (stakingAnalysis || (customType && valueDelta.lte(0))) {
    return [
      buildCustomOrStakingOperation({
        rawTx,
        ledgerAccountId,
        commonData,
        mirrorTokens,
        stakingAnalysis,
        customType,
        netAmount,
        ownFee,
        senders,
        recipients,
        feeRecipient,
      }),
    ];
  }

  const buildFeesOperation = () =>
    buildCoinOperation({
      commonData,
      ledgerAccountId,
      type: "FEES",
      value: fee,
      senders: commonData.extra.feesPayer ? [commonData.extra.feesPayer] : [],
      recipients: feeRecipient ? [feeRecipient] : [],
      extra: { ...commonData.extra },
    });

  const buildNettedOperation = (type: OperationType, value: BigNumber) =>
    buildCoinOperation({
      commonData,
      ledgerAccountId,
      type,
      value,
      fee: ownFee,
      senders,
      recipients: recipients.length === 0 && feeRecipient ? [feeRecipient] : recipients,
      extra: { ...commonData.extra },
    });

  const zeroValueOperations = (): Operation<HederaOperationExtra>[] => {
    // a failed send only has fee transfers, but it stays an OUT so it still reads as a send
    if (commonData.hasFailed && ownFee.gt(0)) {
      return [buildNettedOperation("OUT", netAmount.abs())];
    }

    return isPayer && fee.gt(0) ? [buildFeesOperation()] : [];
  };

  const incomingOperations = (value: BigNumber): Operation<HederaOperationExtra>[] => {
    // IN excludes the fee, so a fee paid by the user becomes a separate FEES op
    const incoming = buildCoinOperation({
      commonData,
      ledgerAccountId,
      type: "IN",
      value,
      senders,
      recipients,
      extra: { ...commonData.extra },
    });

    return isPayer && fee.gt(0) ? [incoming, buildFeesOperation()] : [incoming];
  };

  const outgoingOperations = (totalSent: BigNumber): Operation<HederaOperationExtra>[] => {
    const amountPerRecipient = resolveAmountPerRecipient({
      address,
      senders,
      recipients,
      amountByRecipient,
      expectedTotal: totalSent,
    });

    if (!amountPerRecipient) {
      return [buildNettedOperation("OUT", netAmount.abs())];
    }

    // no single OUT can carry the fee without overstating what that recipient received
    const perRecipientOperations = amountPerRecipient.map(({ recipient, amount }) =>
      buildCoinOperation({
        commonData,
        ledgerAccountId,
        type: "OUT",
        value: amount,
        fee: new BigNumber(0),
        senders,
        recipient,
        extra: { ...commonData.extra },
      }),
    );

    return isPayer && fee.gt(0)
      ? [buildFeesOperation(), ...perRecipientOperations]
      : perRecipientOperations;
  };

  if (valueDelta.isZero()) return zeroValueOperations();
  if (valueDelta.isPositive()) return incomingOperations(valueDelta);
  return outgoingOperations(valueDelta.abs());
}

async function processTransactionItem(
  config: HederaCoinConfig,
  {
    mergedTx,
    address,
    evmAddress,
    ledgerAccountId,
    mirrorTokens,
    useEncodedHash,
    useSyntheticBlocks,
  }: {
    mergedTx: MergedTransaction;
    address: string;
    evmAddress: string;
    ledgerAccountId: string;
    mirrorTokens: HederaMirrorToken[];
    useEncodedHash: boolean;
    useSyntheticBlocks: boolean;
  },
): Promise<{
  newCoinOperations: Operation<HederaOperationExtra>[];
  newTokenOperations: Operation<HederaOperationExtra>[];
}> {
  const newCoinOperations: Operation<HederaOperationExtra>[] = [];
  const newTokenOperations: Operation<HederaOperationExtra>[] = [];

  const mirrorTx = mergedTx.type === "mirror" ? mergedTx.data : mergedTx.data.mirrorTransaction;
  const commonData = getCommonMirrorOperationData(mirrorTx, useEncodedHash, useSyntheticBlocks);

  const stakingRewards = calculateStakingRewards(mirrorTx);
  const stakingReward = stakingRewards.get(address) ?? new BigNumber(0);
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
          configOrCurrencyId: config,
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
      stakingRewards,
      stakingAnalysis,
    });
    newCoinOperations.push(...coinOps);
  } else {
    const erc20TokenResult = processERC20TokenTransfer({
      enrichedERC20Transfer: mergedTx.data,
      address,
      evmAddress,
      ledgerAccountId,
      commonData,
      stakingRewards,
    });

    newCoinOperations.push(...erc20TokenResult.coinOperations);
    newTokenOperations.push(...erc20TokenResult.tokenOperations);
  }

  return { newCoinOperations, newTokenOperations };
}

export async function listOperationsV2(
  config: HederaCoinConfig,
  {
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
    minTimestamp,
  }: {
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
    minTimestamp?: string;
  },
): Promise<{
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

  const [mirrorTransactions, latestHgraphIndexedTimestampNs] = await Promise.all([
    apiClient.getAccountTransactions({
      configOrCurrencyId: config,
      address,
      order,
      limit,
      fetchAllPages,
      pagingToken: cursor ?? null,
      ...(minTimestamp && { minTimestamp }),
    }),
    hgraphClient.getLatestIndexedConsensusTimestamp({ configOrCurrencyId: config }),
  ]);

  const pageFloor =
    !fetchAllPages && order === "desc"
      ? mirrorTransactions.transactions.at(-1)?.consensus_timestamp
      : undefined;
  const erc20Floor = pageFloor ?? minTimestamp;

  const enrichedERC20Transfers = await hgraphClient
    .getERC20Transfers({
      configOrCurrencyId: config,
      address,
      order,
      limit,
      fetchAllPages,
      tokenEvmAddresses,
      ...(cursor && { timestamp: cursor }),
      ...(erc20Floor && { minTimestamp: erc20Floor }),
    })
    .then(erc20Transfers => enrichERC20Transfers({ configOrCurrencyId: config, erc20Transfers }));

  // merge transactions, ensuring no duplicates, correct ordering and pagination handling
  const mergeResult = mergeTransactionsFromDifferentSources({
    mirrorTransactions: mirrorTransactions.transactions,
    enrichedERC20Transfers,
    order,
    limit,
    latestHgraphIndexedTimestampNs,
    fetchAllPages,
  });

  const results = await promiseAllBatched(4, mergeResult.merged, mergedTx =>
    processTransactionItem(config, {
      mergedTx,
      address,
      evmAddress,
      ledgerAccountId,
      mirrorTokens,
      useEncodedHash,
      useSyntheticBlocks,
    }),
  );

  for (const result of results) {
    coinOperations.push(...result.newCoinOperations);
    tokenOperations.push(...result.newTokenOperations);
  }

  // a FEES op with no token op of the same tx is that tx's only trace, so it survives
  const tokenOperationHashes = new Set(tokenOperations.map(op => op.hash));

  // Drop NONE ops (account is neither sender nor recipient; value 0). See BACK-11641.
  return {
    tokenOperations: tokenOperations.filter(op => op.type !== "NONE"),
    coinOperations: skipFeesForTokenOperations
      ? coinOperations
          .filter(op => op.type !== "NONE")
          .filter(op => op.type !== "FEES" || !tokenOperationHashes.has(op.hash))
      : coinOperations.filter(op => op.type !== "NONE"),
    nextCursor: mergeResult.nextCursor,
  };
}

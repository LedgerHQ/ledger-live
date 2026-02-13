import BigNumber from "bignumber.js";
import { createHash } from "crypto";
import invariant from "invariant";
import {
  AccountId,
  EntityIdHelper,
  Transaction as HederaSDKTransaction,
  TransactionId,
} from "@hashgraph/sdk";
import type { AssetInfo, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getFiatCurrencyByTicker } from "@ledgerhq/cryptoassets/fiats";
import cvsApi from "@ledgerhq/live-countervalues/api/index";
import { InvalidAddress } from "@ledgerhq/errors";
import { getEnv } from "@ledgerhq/live-env";
import { makeLRUCache, seconds } from "@ledgerhq/live-network/cache";
import type { Currency, ExplorerView, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AccountLike, Operation as LiveOperation, OperationType } from "@ledgerhq/types-live";
import {
  HEDERA_DELEGATION_STATUS,
  HEDERA_OPERATION_TYPES,
  HEDERA_TRANSACTION_MODES,
  SYNTHETIC_BLOCK_WINDOW_SECONDS,
  TINYBAR_SCALE,
  OP_TYPES_EXCLUDING_FEES,
} from "../constants";
import { apiClient } from "../network/api";
import type {
  HederaAccount,
  HederaMemo,
  HederaMirrorTransaction,
  HederaOperationExtra,
  HederaTxData,
  HederaValidator,
  OperationDetailsExtraField,
  StakingAnalysis,
  Transaction,
  TransactionStaking,
  TransactionStatus,
  TransactionTokenAssociate,
} from "../types";
import { rpcClient } from "../network/rpc";
import { HederaRecipientInvalidChecksum } from "../errors";
import { getCurrentHederaPreloadData } from "../preload-data";

export const serializeSignature = (signature: Uint8Array) => {
  return Buffer.from(signature).toString("base64");
};

export const deserializeSignature = (signature: string) => {
  return Buffer.from(signature, "base64");
};

export const serializeTransaction = (tx: HederaSDKTransaction) => {
  return Buffer.from(tx.toBytes()).toString("hex");
};

export const deserializeTransaction = (tx: string) => {
  return HederaSDKTransaction.fromBytes(Buffer.from(tx, "hex"));
};

export const getOperationValue = ({
  asset,
  operation,
}: {
  asset: AssetInfo;
  operation: LiveOperation<HederaOperationExtra>;
}) => {
  if (operation.type === "FEES") {
    return BigInt(0);
  }

  if (asset.type === "native" && OP_TYPES_EXCLUDING_FEES.includes(operation.type)) {
    return BigInt(operation.value.toFixed(0)) - BigInt(operation.fee.toFixed(0));
  }

  return BigInt(operation.value.toFixed(0));
};

/**
 * Extract the fee payer account from a Hedera transaction_id.
 *
 * Hedera transaction IDs follow the format `0.0.ACCOUNT-TIMESTAMP-NONCE`.
 * The first segment (before the first `-`) is the Hedera native account ID
 * of the entity that paid for the transaction fees.
 *
 * This always returns a Hedera-native account ID (e.g. `0.0.12345`), never
 * an EVM address, since the Mirror Node transaction_id always uses the native format.
 *
 * Note: Hedera supports scheduled/sponsored transactions where the fee payer
 * (from transaction_id) may differ from the logical sender of the transfer.
 * This function correctly handles that case since it reads from transaction_id,
 * which always identifies the actual fee payer.
 */
export function extractFeesPayer(transactionId: string | undefined): string | undefined {
  if (!transactionId) return undefined;
  return transactionId.split("-")[0] || undefined;
}

// this utils extracts the bodyBytes from a Hedera Transaction that are required for signing
// hardcoded `.get(0)` is here because we are always using single node account id
// this is because we want to avoid "signing" loop for users, as described here:
// https://github.com/LedgerHQ/ledger-live/pull/72/commits/1e942687d4301660e43e0c4b5419fcfa2733b290
export const getHederaTransactionBodyBytes = (tx: HederaSDKTransaction) => {
  const bodyBytes = tx._signedTransactions.get(0)?.bodyBytes;
  invariant(bodyBytes, "hedera: tx body bytes are missing");
  return bodyBytes;
};

export const mapIntentToSDKOperation = (txIntent: TransactionIntent) => {
  if (txIntent.type === HEDERA_TRANSACTION_MODES.TokenAssociate) {
    return HEDERA_OPERATION_TYPES.TokenAssociate;
  }

  if (txIntent.type === HEDERA_TRANSACTION_MODES.Send && txIntent.asset.type === "hts") {
    return HEDERA_OPERATION_TYPES.TokenTransfer;
  }

  if (txIntent.type === HEDERA_TRANSACTION_MODES.Send && txIntent.asset.type === "erc20") {
    return HEDERA_OPERATION_TYPES.ContractCall;
  }

  if (
    txIntent.type === HEDERA_TRANSACTION_MODES.Delegate ||
    txIntent.type === HEDERA_TRANSACTION_MODES.Undelegate ||
    txIntent.type === HEDERA_TRANSACTION_MODES.Redelegate
  ) {
    return HEDERA_OPERATION_TYPES.CryptoUpdate;
  }

  return HEDERA_OPERATION_TYPES.CryptoTransfer;
};

export const getMemoFromBase64 = (memoBase64: string | undefined): string | null => {
  try {
    if (memoBase64 === undefined) return null;

    return Buffer.from(memoBase64, "base64").toString("utf-8");
  } catch {
    return null;
  }
};

// NOTE: convert from the non-url-safe version of base64 to the url-safe version (that the explorer uses)
export function base64ToUrlSafeBase64(data: string): string {
  // Might be nice to use this alternative if .nvmrc changes to >= Node v14.18.0
  // base64url encoding option isn't supported until then
  // Buffer.from(data, "base64").toString("base64url");

  return data.replace(/\//g, "_").replace(/\+/g, "-");
}

export const getTransactionExplorer = (
  explorerView: ExplorerView | null | undefined,
  operation: LiveOperation,
): string | undefined => {
  const extra = isValidExtra(operation.extra) ? operation.extra : null;

  return explorerView?.tx?.replace(
    "$hash",
    extra?.consensusTimestamp ?? extra?.transactionId ?? "0",
  );
};

export const isTokenAssociateTransaction = (
  tx: Transaction | null | undefined,
): tx is TransactionTokenAssociate => {
  return tx?.mode === HEDERA_TRANSACTION_MODES.TokenAssociate;
};

export const isAutoTokenAssociationEnabled = (account: AccountLike) => {
  const hederaAccount = "hederaResources" in account ? (account as HederaAccount) : null;

  return hederaAccount?.hederaResources?.isAutoTokenAssociationEnabled ?? false;
};

export const isTokenAssociationRequired = (
  account: AccountLike,
  token: TokenCurrency | null | undefined,
) => {
  if (token?.tokenType !== "hts") {
    return false;
  }

  const subAccounts = !!account && "subAccounts" in account ? account.subAccounts ?? [] : [];
  const isTokenAssociated = subAccounts.some(item => item.token.id === token?.id);

  return !!token && !isTokenAssociated && !isAutoTokenAssociationEnabled(account);
};

export const isValidExtra = (extra: unknown): extra is HederaOperationExtra => {
  return !!extra && typeof extra === "object" && !Array.isArray(extra);
};

export const getOperationDetailsExtraFields = (
  extra: HederaOperationExtra,
): OperationDetailsExtraField[] => {
  const fields: OperationDetailsExtraField[] = [];

  if (typeof extra.memo === "string") {
    fields.push({ key: "memo", value: extra.memo });
  }

  if (typeof extra.associatedTokenId === "string") {
    fields.push({ key: "associatedTokenId", value: extra.associatedTokenId });
  }

  if (typeof extra.targetStakingNodeId === "number") {
    fields.push({ key: "targetStakingNodeId", value: extra.targetStakingNodeId.toString() });
  }

  if (typeof extra.previousStakingNodeId === "number") {
    fields.push({ key: "previousStakingNodeId", value: extra.previousStakingNodeId.toString() });
  }

  if (typeof extra.gasConsumed === "number") {
    fields.push({ key: "gasConsumed", value: extra.gasConsumed.toString() });
  }

  if (typeof extra.gasUsed === "number") {
    fields.push({ key: "gasUsed", value: extra.gasUsed.toString() });
  }

  if (typeof extra.gasLimit === "number") {
    fields.push({ key: "gasLimit", value: extra.gasLimit.toString() });
  }

  return fields;
};

// disables the "Continue" button in the Send modal's Recipient step during token transfers if:
// - the recipient is not associated with the token
// - the association status can't be verified
export const sendRecipientCanNext = (status: TransactionStatus) => {
  const { missingAssociation, unverifiedAssociation } = status.warnings;

  return !missingAssociation && !unverifiedAssociation;
};

// note: this is currently called frequently by getTransactionStatus; LRU cache prevents duplicated requests
export const getCurrencyToUSDRate = makeLRUCache(
  async (currency: Currency) => {
    try {
      const [rate] = await cvsApi.fetchLatest([
        {
          from: currency,
          to: getFiatCurrencyByTicker("USD"),
          startDate: new Date(),
        },
      ]);

      invariant(rate, "no value returned from cvs api");

      return new BigNumber(rate);
    } catch {
      return null;
    }
  },
  currency => currency.ticker,
  seconds(3),
);

export const checkAccountTokenAssociationStatus = makeLRUCache(
  async (address: string, token: TokenCurrency) => {
    if (token.tokenType !== "hts") {
      return true;
    }

    const [parsingError, parsingResult] = await safeParseAccountId(address);

    if (parsingError) {
      throw parsingError;
    }

    const addressWithoutChecksum = parsingResult.accountId;
    const mirrorAccount = await apiClient.getAccount(addressWithoutChecksum);

    // auto association is enabled
    if (mirrorAccount.max_automatic_token_associations === -1) {
      return true;
    }

    const isTokenAssociated = mirrorAccount.balance.tokens.some(t => {
      return t.token_id === token.contractAddress;
    });

    return isTokenAssociated;
  },
  (accountId, token) => `${accountId}-${token.contractAddress}`,
  seconds(30),
);

export const getChecksum = (accountId: string): string | null => {
  try {
    const entityId = EntityIdHelper.fromString(accountId);
    return entityId.checksum ?? null;
  } catch {
    return null;
  }
};

export const safeParseAccountId = async (
  address: string,
): Promise<[Error, null] | [null, { accountId: string; checksum: string | null }]> => {
  const currency = findCryptoCurrencyById("hedera");
  const currencyName = currency?.name ?? "Hedera";

  try {
    const accountId = AccountId.fromString(address);
    const checksum = getChecksum(address);

    if (checksum) {
      const client = await rpcClient.getInstance();
      const expectedChecksum = accountId.toStringWithChecksum(client).split("-")[1];

      if (checksum !== expectedChecksum) {
        return [new HederaRecipientInvalidChecksum(), null];
      }
    }

    const result = {
      accountId: accountId.toString(),
      checksum,
    };

    return [null, result];
  } catch {
    return [new InvalidAddress("", { currencyName }), null];
  }
};

export function getBlockHash(blockHeight: number): string {
  return createHash("sha256").update(blockHeight.toString()).digest("hex");
}

/**
 * Calculates a synthetic block height based on Hedera consensus timestamp.
 *
 * @param consensusTimestamp - Hedera consensus timestamp
 * @param blockWindowSeconds - Duration of one synthetic block in seconds (default: 10)
 * @returns Deterministic synthetic block (height and hash)
 */
export function getSyntheticBlock(
  consensusTimestamp: string,
  blockWindowSeconds = SYNTHETIC_BLOCK_WINDOW_SECONDS,
) {
  const seconds = Math.floor(Number(consensusTimestamp));

  if (Number.isNaN(seconds) || seconds === 0) {
    throw new Error(`Invalid consensus timestamp: ${consensusTimestamp}`);
  }

  const blockHeight = Math.floor(seconds / blockWindowSeconds);
  const blockHash = getBlockHash(blockHeight);
  const blockTime = new Date(seconds * 1000);

  return { blockHeight, blockHash, blockTime };
}

/**
 * Calculates the date range based on a synthetic block height.
 *
 * @param blockHeight - The synthetic block height
 * @param blockWindowSeconds - Duration of one synthetic block in seconds (default: 10)
 * @returns block date range
 */
export function getDateRangeFromBlockHeight(
  blockHeight: number,
  blockWindowSeconds = SYNTHETIC_BLOCK_WINDOW_SECONDS,
) {
  const start = new Date(blockHeight * blockWindowSeconds * 1000);
  const end = new Date((blockHeight + 1) * blockWindowSeconds * 1000);

  return { start, end };
}

export const formatTransactionId = (transactionId: TransactionId): string => {
  const [accountId, timestamp] = transactionId.toString().split("@");
  const [secs, nanos] = timestamp.split(".");

  return `${accountId}-${secs}-${nanos}`;
};

/**
 * Fetches EVM address for given Hedera account ID (e.g. "0.0.1234").
 * It returns null if the fetch fails.
 *
 * @param accountId - Hedera account ID in the format `shard.realm.num`
 * @returns EVM address (`0x...`) or null if fetch fails
 */
export const toEVMAddress = async (accountId: string): Promise<string | null> => {
  try {
    const account = await apiClient.getAccount(accountId);

    return account.evm_address;
  } catch {
    return null;
  }
};

/**
 * Converts EVM address in hexadecimal format to its corresponding Hedera account ID.
 * Only long-zero addresses can be mathematically converted back to account IDs.
 * Non-long-zero addresses support would require mirror node call and is not needed for now
 * Uses shard 0 and realm 0 by default for the conversion.
 * If the conversion fails, it returns null.
 *
 * @param evmAddress - EVM address in hexadecimal format (should start with '0x')
 * @param shard - Optional shard ID (defaults to 0)
 * @param realm - Optional realm ID (defaults to 0)
 * @returns Hedera account ID in the format `shard.realm.num` or null if conversion fails
 */
export const fromEVMAddress = (evmAddress: string, shard = 0, realm = 0): string | null => {
  try {
    const isLongZeroAddress = evmAddress.includes("0".repeat(20));

    if (!isLongZeroAddress) {
      return null;
    }

    const accountId = AccountId.fromEvmAddress(shard, realm, evmAddress).toString();
    return accountId;
  } catch {
    return null;
  }
};

export const extractCompanyFromNodeDescription = (description: string): string => {
  return description
    .split("|")[0]
    .replace(/hosted by/i, "")
    .replace(/hosted for/i, "")
    .trim();
};

export const sortValidators = (validators: HederaValidator[]): HederaValidator[] => {
  const ledgerNodeId = getEnv("HEDERA_STAKING_LEDGER_NODE_ID");

  // sort validators by active stake in DESC order, with Ledger node first if it exists
  return [...validators].sort((a, b) => {
    if (typeof ledgerNodeId === "number") {
      if (a.nodeId === ledgerNodeId) return -1;
      if (b.nodeId === ledgerNodeId) return 1;
    }

    return b.activeStake.toNumber() - a.activeStake.toNumber();
  });
};

export const filterValidatorBySearchTerm = (
  validator: HederaValidator,
  search: string,
): boolean => {
  const lowercaseSearch = search.toLowerCase();
  const addressWithChecksum = validator.addressChecksum
    ? `${validator.address}-${validator.addressChecksum}`
    : validator.address;

  return (
    validator.nodeId.toString().includes(lowercaseSearch) ||
    validator.name.toLowerCase().includes(lowercaseSearch) ||
    addressWithChecksum.toLowerCase().includes(lowercaseSearch)
  );
};

export const getValidatorFromAccount = (account: HederaAccount): HederaValidator | null => {
  const { delegation } = account.hederaResources ?? {};

  if (!delegation) {
    return null;
  }

  const validators = getCurrentHederaPreloadData(account.currency);
  const validator = validators.validators.find(v => v.nodeId === delegation.nodeId) ?? null;

  return validator;
};

export const getDefaultValidator = (validators: HederaValidator[]): HederaValidator | null => {
  const ledgerNodeId = getEnv("HEDERA_STAKING_LEDGER_NODE_ID");

  return validators.find(v => v.nodeId === ledgerNodeId) ?? null;
};

export const getDelegationStatus = (
  validator: HederaValidator | null,
): HEDERA_DELEGATION_STATUS => {
  if (!validator?.address) {
    return HEDERA_DELEGATION_STATUS.Inactive;
  }

  if (validator.overstaked) {
    return HEDERA_DELEGATION_STATUS.Overstaked;
  }

  return HEDERA_DELEGATION_STATUS.Active;
};

export const isStakingTransaction = (
  tx: Transaction | null | undefined,
): tx is TransactionStaking => {
  if (!tx) return false;

  return (
    tx.mode === HEDERA_TRANSACTION_MODES.Delegate ||
    tx.mode === HEDERA_TRANSACTION_MODES.Undelegate ||
    tx.mode === HEDERA_TRANSACTION_MODES.Redelegate ||
    tx.mode === HEDERA_TRANSACTION_MODES.ClaimRewards
  );
};

export const hasSpecificIntentData = <Type extends "staking" | "erc20">(
  txIntent: TransactionIntent<HederaMemo, HederaTxData>,
  expectedType: Type,
): txIntent is Extract<TransactionIntent<HederaMemo, HederaTxData>, { data: { type: Type } }> => {
  return "data" in txIntent && txIntent.data.type === expectedType;
};

export const calculateAPY = (rewardRateStart: number): number => {
  const dailyRate = rewardRateStart / 10 ** TINYBAR_SCALE;
  const annualRate = dailyRate * 365;

  return annualRate;
};

/**
 * Calculates the uncommitted balance change for an account between two timestamps.
 *
 * This function handles the timing mismatch between Mirror Node balance snapshots and actual transactions.
 * Balance snapshots are taken at regular intervals, not at every transaction, so querying by exact timestamp
 * may return a snapshot from before moment you need.
 *
 * @param address - Hedera account ID (e.g., "0.0.12345")
 * @param startTimestamp - Start of the time range (exclusive, format: "1234567890.123456789")
 * @param endTimestamp - End of the time range (inclusive, format: "1234567890.123456789")
 * @returns The net balance change as BigInt (sum of all transfers to/from the account)
 */
export const calculateUncommittedBalanceChange = async ({
  address,
  startTimestamp,
  endTimestamp,
}: {
  address: string;
  startTimestamp: string;
  endTimestamp: string;
}): Promise<BigNumber> => {
  if (Number(startTimestamp) >= Number(endTimestamp)) {
    return new BigNumber(0);
  }

  const uncommittedTransactions = await apiClient.getTransactionsByTimestampRange({
    address,
    startTimestamp: `gt:${startTimestamp}`,
    endTimestamp: `lte:${endTimestamp}`,
  });

  // Sum all balance changes from transfers related to this account
  const uncommittedBalanceChange = uncommittedTransactions.reduce((total, tx) => {
    const transfers = tx.transfers ?? [];
    const relevantTransfers = transfers.filter(t => t.account === address);
    const netChange = relevantTransfers.reduce((sum, t) => sum.plus(t.amount), new BigNumber(0));
    return total.plus(netChange);
  }, new BigNumber(0));

  return uncommittedBalanceChange;
};

/**
 * Hedera uses the AccountUpdateTransaction for multiple purposes, including staking operations.
 * Mirror node classifies all such transactions under the same name: "CRYPTOUPDATEACCOUNT".
 *
 * This function distinguishes between:
 * - DELEGATE: Account started staking (staked_node_id changed from null to a node ID)
 * - UNDELEGATE: Account stopped staking (staked_node_id changed from a node ID to null)
 * - REDELEGATE: Account changed staking node (staked_node_id changed from one node to another)
 *
 * The analysis works by:
 * 1. Fetching the account state BEFORE the transaction (using lt: timestamp filter)
 * 2. Fetching the account state AFTER the transaction (using eq: timestamp filter)
 * 3. Comparing the staked_node_id field to determine what changed
 * 4. Calculating the actual staked amount by replaying uncommitted transactions between
 *    the latest balance snapshot and the staking operation to handle snapshot timing mismatches
 *
 * @performance
 * Makes 3 API calls per operation:
 * - account state before
 * - account state after
 * - transaction history based on latest balance snapshot
 *
 * Batching would complicate code for minimal gain given low staking op frequency.
 */
export const analyzeStakingOperation = async (
  address: string,
  mirrorTx: HederaMirrorTransaction,
): Promise<StakingAnalysis | null> => {
  const [accountBefore, accountAfter] = await Promise.all([
    apiClient.getAccount(address, `lt:${mirrorTx.consensus_timestamp}`),
    apiClient.getAccount(address, `eq:${mirrorTx.consensus_timestamp}`),
  ]);

  let operationType: OperationType | null = null;
  const previousStakingNodeId = accountBefore.staked_node_id;
  const targetStakingNodeId = accountAfter.staked_node_id;

  // stake: node id changed from null -> not null
  if (previousStakingNodeId === null && targetStakingNodeId !== null) {
    operationType = "DELEGATE";
  }
  // unstake: node id changed from not null -> null
  else if (previousStakingNodeId !== null && targetStakingNodeId === null) {
    operationType = "UNDELEGATE";
  }
  // restake: node id changed from not null -> different not null
  else if (
    previousStakingNodeId !== null &&
    targetStakingNodeId !== null &&
    previousStakingNodeId !== targetStakingNodeId
  ) {
    operationType = "REDELEGATE";
  }

  if (!operationType) {
    return null;
  }

  // calculate uncommitted balance changes between the last snapshot and the staking tx
  const uncommittedBalanceChange = await calculateUncommittedBalanceChange({
    address,
    startTimestamp: accountAfter.balance.timestamp,
    endTimestamp: mirrorTx.consensus_timestamp,
  });

  const actualStakedAmount = uncommittedBalanceChange.plus(accountAfter.balance.balance);

  return {
    operationType,
    previousStakingNodeId,
    targetStakingNodeId,
    stakedAmount: BigInt(actualStakedAmount.toString()), // always entire balance on Hedera (fully liquid)
  };
};

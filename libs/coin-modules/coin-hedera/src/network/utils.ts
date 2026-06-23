import invariant from "invariant";
import { AccountId, TransactionId } from "@hashgraph/sdk";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getFiatCurrencyByTicker } from "@ledgerhq/cryptoassets/fiats";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { InvalidAddress } from "@ledgerhq/errors";
import cvsApi from "@ledgerhq/live-countervalues/api/index";
import { getEnv } from "@ledgerhq/live-env";
import { makeLRUCache, seconds } from "@ledgerhq/live-network/cache";
import type { Currency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { HederaCoinConfig } from "../config";
import { SUPPORTED_ERC20_TOKENS } from "../constants";
import { HederaRecipientInvalidChecksum } from "../errors";
import { getChecksum, nanosToSeconds, toEntityId, toTimestamp } from "../logic/utils";
import type {
  HederaMirrorTokenTransfer,
  HederaMirrorCoinTransfer,
  HederaERC20TokenBalance,
  ERC20TokenTransfer,
  EnrichedERC20Transfer,
  HederaMirrorTransaction,
  StakingAnalysis,
} from "../types";
import { apiClient } from "./api";
import { hgraphClient } from "./hgraph";
import { rpcClient } from "./rpc";

export async function createTransactionId(
  accountId: string,
  config: HederaCoinConfig,
): Promise<TransactionId> {
  if (!config.useNetworkTimestamp) {
    return TransactionId.generate(accountId);
  }

  try {
    const lastBlock = await apiClient.getLatestBlock({ configOrCurrencyId: config });
    const validStart = toTimestamp(lastBlock.timestamp.to ?? lastBlock.timestamp.from);

    return TransactionId.withValidStart(AccountId.fromString(accountId), validStart);
  } catch {
    return TransactionId.generate(accountId);
  }
}

function isValidRecipient(accountId: AccountId, recipients: string[]): boolean {
  if (accountId.shard.eq(0) && accountId.realm.eq(0)) {
    // account is a node, only add to list if we have none
    if (accountId.num.lt(100)) {
      return recipients.length === 0;
    }

    // account is a system account that is not a node, do NOT add
    if (accountId.num.lt(1000)) {
      return false;
    }
  }

  return true;
}

export function parseTransfers(
  mirrorTransfers: (HederaMirrorCoinTransfer | HederaMirrorTokenTransfer)[],
  address: string,
  stakingReward = new BigNumber(0),
): Pick<Operation, "type" | "value" | "senders" | "recipients"> {
  let value = new BigNumber(0);
  let type: OperationType = "NONE";

  const senders: string[] = [];
  const recipients: string[] = [];
  const rewardPayerAddress = getEnv("HEDERA_STAKING_REWARD_ACCOUNT_ID");

  for (const transfer of mirrorTransfers) {
    const amount = new BigNumber(transfer.amount);
    const accountId = AccountId.fromString(transfer.account);

    // staking reward is included in transfer, so it can be positive even if user sent less HBARs than the reward is
    const amountWithoutReward = transfer.account === address ? amount.minus(stakingReward) : amount;

    if (transfer.account === address) {
      value = amountWithoutReward.abs();
      type = amountWithoutReward.isNegative() ? "OUT" : "IN";
    }

    if (amountWithoutReward.isNegative()) {
      // exclude reward payer from senders list, because rewards are shown as separate operations
      const shouldIgnoreAddress = transfer.account === rewardPayerAddress && stakingReward.gt(0);

      if (shouldIgnoreAddress) {
        continue;
      }

      senders.push(transfer.account);
    } else if (isValidRecipient(accountId, recipients)) {
      recipients.push(transfer.account);
    }
  }

  // NOTE: earlier addresses are the "fee" addresses
  senders.reverse();
  recipients.reverse();

  return {
    type,
    value,
    senders,
    recipients,
  };
}

export async function getERC20BalancesForAccountV2({
  configOrCurrencyId,
  address,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  address: string;
}): Promise<HederaERC20TokenBalance[]> {
  const balances: HederaERC20TokenBalance[] = [];

  const rawBalances = await hgraphClient.getERC20Balances({ configOrCurrencyId, address });

  for (const rawBalance of rawBalances) {
    const rawBalanceTokenId = toEntityId({ num: rawBalance.token_id });

    const supportedToken = SUPPORTED_ERC20_TOKENS.find(token => {
      return token.tokenId === rawBalanceTokenId;
    });

    if (!supportedToken) {
      continue;
    }

    const calToken = await getCryptoAssetsStore().findTokenById(supportedToken.id);

    if (!calToken) {
      continue;
    }

    balances.push({
      token: calToken,
      balance: new BigNumber(rawBalance.balance),
    });
  }

  return balances;
}

/**
 * Enriches raw ERC20 transfers from Hgraph with additional data needed for operations:
 * - fetches contract call result containing gas metrics and block hash
 * - finds the corresponding Mirror Node transaction by consensus timestamp
 *
 * @param erc20Transfers - Raw ERC20 transfers from Hgraph API
 * @returns Array of enriched transfers with complete operation data, filtered to supported tokens only
 */
export const enrichERC20Transfers = async ({
  configOrCurrencyId,
  erc20Transfers,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  erc20Transfers: ERC20TokenTransfer[];
}) => {
  const enrichedTransfers: EnrichedERC20Transfer[] = [];

  // with hgraph we can get two different transfers with the same transaction hash
  const groupedByTxHash = new Map<string, [ERC20TokenTransfer, ...ERC20TokenTransfer[]]>();
  for (const transfer of erc20Transfers) {
    const group = groupedByTxHash.get(transfer.transaction_hash);

    if (!group) {
      groupedByTxHash.set(transfer.transaction_hash, [transfer]);
      continue;
    }

    group.push(transfer);
  }

  for (const [txHash, transfers] of groupedByTxHash.entries()) {
    const payerAddress = toEntityId({ num: transfers[0].payer_account_id });
    const inaccurateConsensusTimestampNs = new BigNumber(transfers[0].consensus_timestamp);
    const inaccurateConsensusTimestamp = nanosToSeconds(inaccurateConsensusTimestampNs).toFixed(9);

    const [contractCallResult, mirrorTransaction] = await Promise.all([
      apiClient.getContractCallResult({ configOrCurrencyId, transactionHash: txHash }),
      apiClient.findTransactionByContractCallV2({
        configOrCurrencyId,
        payerAddress,
        timestamp: inaccurateConsensusTimestamp,
      }),
    ]);

    if (!mirrorTransaction) {
      continue;
    }

    enrichedTransfers.push({
      transfers,
      contractCallResult,
      mirrorTransaction,
    });
  }

  return enrichedTransfers;
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

    const [parsingError, parsingResult] = await safeParseAccountId({
      configOrCurrencyId: token.parentCurrencyId,
      address,
    });

    if (parsingError) {
      throw parsingError;
    }

    const addressWithoutChecksum = parsingResult.accountId;
    const mirrorAccount = await apiClient.getAccount({
      configOrCurrencyId: token.parentCurrencyId,
      address: addressWithoutChecksum,
    });

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

export const safeParseAccountId = async ({
  configOrCurrencyId,
  address,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  address: string;
}): Promise<[Error, null] | [null, { accountId: string; checksum: string | null }]> => {
  const currency = getCryptoCurrencyById("hedera");
  const currencyName = currency?.name ?? "Hedera";

  try {
    const accountId = AccountId.fromString(address);
    const checksum = getChecksum(address);

    if (checksum) {
      const client = await rpcClient.getInstance(configOrCurrencyId);
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

/**
 * Fetches EVM address for given Hedera account ID (e.g. "0.0.1234").
 * It returns null if the fetch fails.
 *
 * @param accountId - Hedera account ID in the format `shard.realm.num`
 * @returns EVM address (`0x...`) or null if fetch fails
 */
export const toEVMAddress = async ({
  configOrCurrencyId,
  accountId,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  accountId: string;
}): Promise<string | null> => {
  try {
    const account = await apiClient.getAccount({
      configOrCurrencyId,
      address: accountId,
    });

    return account.evm_address;
  } catch {
    return null;
  }
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
  configOrCurrencyId,
  address,
  startTimestamp,
  endTimestamp,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  address: string;
  startTimestamp: string;
  endTimestamp: string;
}): Promise<BigNumber> => {
  if (Number(startTimestamp) >= Number(endTimestamp)) {
    return new BigNumber(0);
  }

  const uncommittedTransactions = await apiClient.getTransactionsByTimestampRange({
    configOrCurrencyId,
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
export const analyzeStakingOperation = async ({
  configOrCurrencyId,
  address,
  mirrorTx,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  address: string;
  mirrorTx: HederaMirrorTransaction;
}): Promise<StakingAnalysis | null> => {
  const [accountBefore, accountAfter] = await Promise.all([
    apiClient.getAccount({
      configOrCurrencyId,
      address,
      timestamp: `lt:${mirrorTx.consensus_timestamp}`,
    }),
    apiClient.getAccount({
      configOrCurrencyId,
      address,
      timestamp: `eq:${mirrorTx.consensus_timestamp}`,
    }),
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
    configOrCurrencyId,
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

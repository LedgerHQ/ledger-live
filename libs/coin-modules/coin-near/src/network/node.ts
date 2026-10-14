import liveNetwork from "@ledgerhq/live-network";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network/network";
import { log } from "@ledgerhq/logs";
import { sha256 } from "@noble/hashes/sha2";
import { isAxiosError } from "axios";
import { BigNumber } from "bignumber.js";
import {
  JsonRpcProvider,
  base64Decode,
  baseEncode,
  decodeSignedTransaction,
  encodeTransaction,
} from "near-api-js";
import { type NearConfig } from "../config";
import { MIN_ACCOUNT_BALANCE_BUFFER } from "../constants";
import { canUnstake, canWithdraw, getYoctoThreshold } from "../logic";
import { NearAccount } from "../types";
import { getActionCosts } from "./protocolConfig";
import {
  NearAccessKey,
  NearAccountDetails,
  NearRawValidator,
  NearStakingPosition,
  NearV3Response,
} from "./sdk.types";

export const fetchAccountDetails = async (
  config: NearConfig,
  address: string,
): Promise<NearAccountDetails> => {
  const currencyConfig = config;
  const { data } = await network<{ result: NearAccountDetails }>({
    method: "POST",
    url: currencyConfig.infra.API_NEAR_PRIVATE_NODE,
    data: {
      jsonrpc: "2.0",
      id: "id",
      method: "query",
      params: {
        request_type: "view_account",
        finality: "final",
        account_id: address,
      },
    },
  });

  return data.result;
};

export const getAccount = async (
  config: NearConfig,
  address: string,
): Promise<Pick<NearAccount, "blockHeight" | "balance" | "spendableBalance" | "nearResources">> => {
  let accountDetails: NearAccountDetails;

  accountDetails = await fetchAccountDetails(config, address);

  if (!accountDetails) {
    accountDetails = {
      amount: "0",
      block_height: 0,
      storage_usage: 0,
    };
  }

  const { stakingPositions, totalStaked, totalAvailable, totalPending } = await getStakingPositions(
    config,
    address,
  );

  // Read directly from the protocol config rather than the preload cache: a CoinModuleApi caller
  // never runs the account bridge's preload step, so the cache would still hold its zeroed default.
  const { storageCost } = await getActionCosts(config);

  const balance = new BigNumber(accountDetails.amount);
  const storageUsage = storageCost.multipliedBy(accountDetails.storage_usage);
  const minBalanceBuffer = new BigNumber(MIN_ACCOUNT_BALANCE_BUFFER);

  let spendableBalance = balance.minus(storageUsage).minus(minBalanceBuffer);

  if (spendableBalance.lt(0)) {
    spendableBalance = new BigNumber(0);
  }

  return {
    blockHeight: accountDetails.block_height,
    balance: balance.plus(totalStaked).plus(totalAvailable).plus(totalPending),
    spendableBalance,
    nearResources: {
      stakedBalance: totalStaked,
      availableBalance: totalAvailable,
      pendingBalance: totalPending,
      storageUsageBalance: storageUsage.plus(minBalanceBuffer),
      stakingPositions,
    },
  };
};

type NearStats = {
  gas_price: string | null;
};

const getGasPriceFromRpc = async (config: NearConfig): Promise<string> => {
  const currencyConfig = config;
  const { data } = await network<{
    result?: { gas_price: string };
    error?: { message: string };
  }>({
    method: "POST",
    url: currencyConfig.infra.API_NEAR_PRIVATE_NODE,
    data: {
      jsonrpc: "2.0",
      id: "id",
      method: "gas_price",
      params: [null],
    },
  });

  if (!data.result?.gas_price) {
    log("Near", "getGasPrice fallback failed", data.error);
    throw new Error(data.error?.message || "Near: the node returned no gas price");
  }

  return data.result.gas_price;
};

export const getGasPrice = async (config: NearConfig): Promise<string> => {
  const currencyConfig = config;

  try {
    const response = await liveNetwork<NearV3Response<NearStats>>({
      url: `${currencyConfig.infra.API_NEARBLOCKS_INDEXER}/v3/stats`,
    });

    const gasPrice = response.data.data?.gas_price;
    if (gasPrice) {
      return gasPrice;
    }
  } catch (error) {
    // The indexer rate-limits (429) under load; the node RPC is the source of truth for gas price.
    log("Near", "getGasPrice indexer request failed, falling back to node RPC", error);
  }

  return getGasPriceFromRpc(config);
};

export const getAccessKey = async (
  config: NearConfig,
  {
    address,
    publicKey,
  }: {
    address: string;
    publicKey: string;
  },
): Promise<NearAccessKey> => {
  const currencyConfig = config;
  const { data } = await network<{ result: NearAccessKey }>({
    method: "POST",
    url: currencyConfig.infra.API_NEAR_PRIVATE_NODE,
    data: {
      jsonrpc: "2.0",
      id: "id",
      method: "query",
      params: {
        request_type: "view_access_key",
        finality: "final",
        account_id: address,
        public_key: publicKey,
      },
    },
  });

  return data.result || {};
};

type NearRpcError = {
  name?: string;
  cause?: {
    name?: string;
    info?: { error_message?: string };
  };
  message?: unknown;
  data?: unknown;
};

// `send_tx` and `tx` both answer with the transaction on success and a JSON-RPC error otherwise.
type NearRpcTransactionResponse = {
  result?: { transaction?: { hash?: string } };
  error?: NearRpcError;
};

// The node reports a handler error (`TIMEOUT_ERROR` included) with a non-2xx HTTP status. Letting
// those through keeps the JSON-RPC body readable here instead of having the network layer
// stringify it into "[object Object]".
const NEAR_RPC_STATUSES = new Set([200, 400, 408, 500]);

type BroadcastTiming = {
  // No retry is started once this much time has passed since the first attempt.
  retryBudgetMs: number;
  // Client-side limit for a single `send_tx`, capped by what is left of the budget.
  attemptTimeoutMs: number;
  // Wait before the first retry, doubled for each following one up to `maxRetryDelayMs`.
  retryDelayMs: number;
  maxRetryDelayMs: number;
};

// A timed-out `send_tx` is held open by the node for about 10s, so the per-attempt limit is only a
// safety net for a node or proxy that never answers. With the budget it bounds how long the user
// waits after signing to about the budget plus the lookup. The delay spreads the retries out when
// the node answers fast, so a struggling node is not hit by a burst of calls.
const BROADCAST_TIMING: BroadcastTiming = {
  retryBudgetMs: 30_000,
  attemptTimeoutMs: 15_000,
  retryDelayMs: 500,
  maxRetryDelayMs: 5_000,
};

const TRANSACTION_LOOKUP_TIMEOUT_MS = 10_000;

// What a `send_tx` that got no answer in time is reported as, so that it takes the same path as the
// node's own `TIMEOUT_ERROR`: the transaction may well have been accepted.
const CLIENT_TIMEOUT_ERROR: NearRpcError = {
  name: "HANDLER_ERROR",
  cause: { name: "TIMEOUT_ERROR" },
  data: "no answer from the node in time",
};

const isClientTimeout = (error: unknown): boolean =>
  isAxiosError(error) && (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT");

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

const describeRpcError = (error: NearRpcError): string => {
  const name = error.cause?.name ?? error.name ?? "UNKNOWN CAUSE";
  const detail =
    asString(error.cause?.info?.error_message) ?? asString(error.data) ?? asString(error.message);

  return detail ? `${name}: ${detail}` : name;
};

// A timeout only says the node did not reach the requested finality in time, not that the
// broadcast failed: the transaction may well have been taken. Whether the node saw it is only
// reported in the timeout details from nearcore 2.14 on, so ask the node for the transaction by
// hash, which works on every version. Any failure here leaves the original timeout to be reported.
const findBroadcastTransactionHash = async (
  config: NearConfig,
  signedTransaction: string,
): Promise<string | undefined> => {
  try {
    const { transaction } = decodeSignedTransaction(base64Decode(signedTransaction));
    // A NEAR transaction id is the SHA-256 of the Borsh-encoded unsigned transaction. That same
    // digest is what gets signed, but the signature itself is not part of the id, so it is hashed
    // from the decoded `transaction` rather than from the signed bytes.
    const hash = baseEncode(sha256(encodeTransaction(transaction)));

    const { data } = await network<NearRpcTransactionResponse | undefined>({
      method: "POST",
      url: config.infra.API_NEAR_PRIVATE_NODE,
      data: {
        jsonrpc: "2.0",
        id: "id",
        method: "tx",
        params: { tx_hash: hash, sender_account_id: transaction.signerId, wait_until: "NONE" },
      },
      timeout: TRANSACTION_LOOKUP_TIMEOUT_MS,
      validateStatus: httpStatus => NEAR_RPC_STATUSES.has(httpStatus),
    });

    if (!data?.result) {
      log("Near", "broadcastTransaction lookup did not find the transaction", {
        hash,
        error: data?.error,
      });
      return undefined;
    }

    return asString(data.result.transaction?.hash) ?? hash;
  } catch (error) {
    log("Near", "broadcastTransaction lookup failed", error);
    return undefined;
  }
};

// A client-side timeout is reported as a node `TIMEOUT_ERROR` so both take the same path.
const sendTransaction = async (
  config: NearConfig,
  signedTransaction: string,
  timeout: number,
): Promise<{ data: NearRpcTransactionResponse | undefined; status: number }> => {
  try {
    const { data, status } = await network<NearRpcTransactionResponse | undefined>({
      method: "POST",
      url: config.infra.API_NEAR_PRIVATE_NODE,
      data: {
        jsonrpc: "2.0",
        id: "id",
        method: "send_tx",
        params: { signed_tx_base64: signedTransaction, wait_until: "EXECUTED_OPTIMISTIC" },
      },
      timeout,
      validateStatus: httpStatus => NEAR_RPC_STATUSES.has(httpStatus),
    });

    return { data, status };
  } catch (error) {
    if (isClientTimeout(error)) {
      return { data: { error: CLIENT_TIMEOUT_ERROR }, status: 408 };
    }

    throw error;
  }
};

/**
 * Implements a retry mechanism for broadcasting a transaction
 * based on the near documentation: https://docs.near.org/api/rpc/transactions#what-could-go-wrong-send-tx
 *
 * `TIMEOUT_ERROR` can be thrown when the transaction is not yet executed in less than 10 seconds.
 * Documentation advises to "re-submit the request with the identical transaction" in this case,
 * which is done, with a growing delay between attempts, until the retries or the time budget are
 * spent. The node is then asked for the transaction by hash before reporting a failure for a
 * broadcast that went through.
 */
export const broadcastTransaction = async (
  config: NearConfig,
  transaction: string,
  retries = 6,
  timing: BroadcastTiming = BROADCAST_TIMING,
): Promise<string> => {
  const deadline = Date.now() + timing.retryBudgetMs;

  for (let attempt = 0; ; attempt++) {
    // `timeout: 0` would mean no limit at all, so never let the remaining budget reach it.
    const timeout = Math.max(1, Math.min(timing.attemptTimeoutMs, deadline - Date.now()));
    const { data, status } = await sendTransaction(config, transaction, timeout);
    const error = data?.error;

    if (!error) {
      if (!data?.result && status >= 400) {
        throw new Error(`Near: send_tx failed with HTTP ${status}`);
      }

      const hash = data?.result?.transaction?.hash;

      if (!hash) {
        throw new Error("Near: send_tx returned no transaction hash");
      }

      return hash;
    }

    if (error.cause?.name === "TIMEOUT_ERROR") {
      const delay = Math.min(timing.retryDelayMs * 2 ** attempt, timing.maxRetryDelayMs);

      if (attempt < retries && Date.now() + delay < deadline) {
        log("Near", "broadcastTransaction retrying after error", { data, attempt, delay });
        await sleep(delay);
        continue;
      }

      const hash = await findBroadcastTransactionHash(config, transaction);

      if (hash) {
        log("Near", "broadcastTransaction timed out but the node has the transaction", { hash });
        return hash;
      }
    }

    log("Near", "broadcastTransaction error", error);
    throw new Error(describeRpcError(error));
  }
};

export const getStakingPositions = async (
  config: NearConfig,
  address: string,
): Promise<{
  stakingPositions: NearStakingPosition[];
  totalStaked: BigNumber;
  totalAvailable: BigNumber;
  totalPending: BigNumber;
}> => {
  const currencyConfig = config;
  const provider = new JsonRpcProvider({ url: currencyConfig.infra.API_NEAR_PRIVATE_NODE });

  let totalStaked = new BigNumber(0);
  let totalAvailable = new BigNumber(0);
  let totalPending = new BigNumber(0);
  const stakingThreshold = getYoctoThreshold();

  const delegatedValidators = await liveNetwork<{ deposit: string; validator_id: string }[]>({
    url: `${currencyConfig.infra.API_NEARBLOCKS_INDEXER}/v3/kitwallet/staking-deposits/${address}`,
  });

  const stakingPositions = await Promise.all(
    delegatedValidators.data.map(async ({ validator_id: validatorId }) => {
      const view = <T extends string | boolean>(method: string) =>
        provider.callFunction<T>({
          contractId: validatorId,
          method,
          args: { account_id: address },
        });

      const [rawStaked, rawUnstaked, isAvailable] = await Promise.all([
        view<string>("get_account_staked_balance"),
        view<string>("get_account_unstaked_balance"),
        view<boolean>("is_account_unstaked_balance_available"),
      ]);

      const unstaked = new BigNumber(rawUnstaked ?? 0);

      let available = new BigNumber(0);
      let pending = unstaked;
      if (isAvailable) {
        available = unstaked;
        pending = new BigNumber(0);
      }

      const staked = new BigNumber(rawStaked ?? 0);
      available = new BigNumber(available);
      pending = new BigNumber(pending);

      if (staked.gte(stakingThreshold)) {
        totalStaked = totalStaked.plus(staked);
      }
      if (available.gte(stakingThreshold)) {
        totalAvailable = totalAvailable.plus(available);
      }
      if (pending.gte(stakingThreshold)) {
        totalPending = totalPending.plus(pending);
      }

      return {
        staked,
        available,
        pending,
        validatorId,
      };
    }),
  );

  return {
    stakingPositions: stakingPositions.filter(
      sp => canUnstake(sp) || canWithdraw(sp) || sp.pending.gt(0),
    ),
    totalStaked,
    totalAvailable,
    totalPending,
  };
};

type NearIndexerValidator = {
  account_id: string;
  current_epoch_stake: string | null;
  fee_numerator: number | null;
  fee_denominator: number | null;
};

type NearValidator = NearRawValidator & {
  commission: number;
};

type FetchValidatorsParams = {
  total: number;
  config: NearConfig;
};

const VALIDATORS_PAGE_SIZE = 100;

async function fetchValidators({ total, config }: FetchValidatorsParams): Promise<NearValidator[]> {
  const currencyConfig = config;
  const collected: NearIndexerValidator[] = [];
  const maxPages = Math.ceil(total / VALIDATORS_PAGE_SIZE);
  let next: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const limit = Math.min(VALIDATORS_PAGE_SIZE, total - collected.length);
    const cursor = next ? `&next=${encodeURIComponent(next)}` : "";
    const response = await liveNetwork<NearV3Response<NearIndexerValidator[]>>({
      url: `${currencyConfig.infra.API_NEARBLOCKS_INDEXER}/v3/validators?limit=${limit}${cursor}`,
    });

    const validators = response.data.data ?? [];
    collected.push(...validators);
    next = response.data.meta?.next_page;

    if (!validators.length || !next || collected.length >= total) {
      break;
    }
  }

  return collected
    .slice(0, total)
    .map(({ account_id, current_epoch_stake, fee_numerator, fee_denominator }) => ({
      account_id,
      stake: current_epoch_stake ?? "0",
      commission:
        fee_numerator !== null && fee_denominator
          ? Math.round((fee_numerator / fee_denominator) * 100)
          : 0,
    }));
}

export const getValidators = makeLRUCache(fetchValidators, ({ total }) => String(total), {
  ttl: 30 * 60 * 1000,
});

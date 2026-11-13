import { makeLRUCache } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network/network";
import { log } from "@ledgerhq/logs";
import { sha256 } from "@noble/hashes/sha2";
import { isAxiosError } from "axios";
import BigNumber from "bignumber.js";
import {
  JsonRpcProvider,
  base64Decode,
  baseEncode,
  decodeSignedTransaction,
  encodeTransaction,
} from "near-api-js";
import { AccountDoesNotExistError, ContractExecutionError } from "near-api-js/rpc-errors";
import { type NearConfig } from "../config";
import { MIN_ACCOUNT_BALANCE_BUFFER, VALIDATORS_CACHE_TTL_MS } from "../constants";
import { canUnstake, canWithdraw, getYoctoThreshold } from "../logic";
import { NearAccount } from "../types";
import { fetchNearblocks } from "./nearblocks";
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

const IMPLICIT_ACCOUNT = /^[0-9a-f]{64}$/;

/**
 * Changes whenever a transaction concerns the account: balance, lock, storage or contract, and the
 * nonce of the account's own key, which a relayed transaction moves without the account paying.
 * A named account has no derivable key, so its nonce segment stays empty; so does a key read that
 * fails, because the fingerprint must never be the reason a sync fails.
 */
export const getAccountStateFingerprint = async (
  config: NearConfig,
  address: string,
  accountDetails: NearAccountDetails | undefined,
): Promise<string> => {
  let nonce = "";

  if (IMPLICIT_ACCOUNT.test(address)) {
    try {
      const key = await getAccessKey(config, {
        address,
        publicKey: `ed25519:${baseEncode(Buffer.from(address, "hex"))}`,
      });
      if (key?.nonce !== undefined) nonce = String(key.nonce);
    } catch (error) {
      log("Near", "account key nonce read failed, fingerprinting without it", error);
    }
  }

  return [
    accountDetails?.amount ?? "",
    accountDetails?.locked ?? "",
    accountDetails?.storage_usage ?? "",
    accountDetails?.code_hash ?? "",
    nonce,
  ].join("|");
};

export type StakingPositionsOptions = {
  /**
   * Pools the caller already holds a position in. With them, a failed indexer listing falls back to
   * reading these pools from the node. A pool whose node read fails still fails the call: dropping
   * it would show a lower balance and forget the pool.
   */
  knownValidatorIds?: string[];
  /** Ask the indexer for the account's pools (default). `false` reads the known pools only. */
  listValidators?: boolean;
  /**
   * Pools the account may have just funded (named by staking calls the caller has not seen yet).
   * Read from the node when the listing does not return them, including when it succeeds: the
   * listing may lag behind the history. A candidate the node shows is not a pool (no account, no
   * contract, the contract fails the view) is dropped; any other failed read is reported in
   * `failedCandidates`, so the caller can try it again.
   */
  candidateValidatorIds?: string[];
};

export const getAccount = async (
  config: NearConfig,
  address: string,
  options?: StakingPositionsOptions & { accountDetails?: NearAccountDetails },
): Promise<
  Pick<NearAccount, "blockHeight" | "balance" | "spendableBalance" | "nearResources"> & {
    poolListingFailed: boolean;
    failedCandidates: string[];
  }
> => {
  let accountDetails: NearAccountDetails;

  accountDetails = options?.accountDetails ?? (await fetchAccountDetails(config, address));

  if (!accountDetails) {
    accountDetails = {
      amount: "0",
      block_height: 0,
      storage_usage: 0,
    };
  }

  const {
    stakingPositions,
    totalStaked,
    totalAvailable,
    totalPending,
    poolListingFailed,
    failedCandidates,
  } = await getStakingPositions(config, address, options);

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
    poolListingFailed,
    failedCandidates,
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
    log("Near", "getGasPrice node returned no gas price", data.error);
    throw new Error(data.error?.message || "Near: the node returned no gas price");
  }

  return data.result.gas_price;
};

export const getGasPrice = async (config: NearConfig): Promise<string> => {
  try {
    return await getGasPriceFromRpc(config);
  } catch (error) {
    // The node has no shared quota; the indexer is only a fallback when the node is down.
    log("Near", "getGasPrice node request failed, falling back to the indexer", error);
  }

  const body = await fetchNearblocks<NearV3Response<NearStats>>(config, "/v3/stats");

  const gasPrice = body.data?.gas_price;
  if (!gasPrice) {
    throw new Error("Near: no gas price from the node or the indexer");
  }

  return gasPrice;
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

const listStakingPools = async (config: NearConfig, address: string): Promise<string[]> => {
  const data = await fetchNearblocks<{ deposit: string; validator_id: string }[]>(
    config,
    `/v3/kitwallet/staking-deposits/${address}`,
  );
  return data.map(({ validator_id: validatorId }) => validatorId);
};

type ResolvedPools = {
  /** Pools that must be read: a failed read fails the call. */
  required: string[];
  /** Pools read when possible: a failed read skips the pool. */
  candidates: string[];
  listingFailed: boolean;
};

const resolveStakingPools = async (
  config: NearConfig,
  address: string,
  options: StakingPositionsOptions | undefined,
): Promise<ResolvedPools> => {
  if (!options) {
    return {
      required: await listStakingPools(config, address),
      candidates: [],
      listingFailed: false,
    };
  }

  const known = options.knownValidatorIds;
  let listed: string[] | undefined;
  let listingFailed = false;
  if (options.listValidators !== false) {
    try {
      listed = await listStakingPools(config, address);
    } catch (error) {
      if (!known) throw error;
      log("Near", "staking pool listing failed, reading the known pools from the node", error);
      listingFailed = true;
    }
  }

  const required = [...new Set([...(listed ?? []), ...(known ?? [])])];
  const candidates = [...new Set(options.candidateValidatorIds ?? [])].filter(
    id => !required.includes(id),
  );
  return { required, candidates, listingFailed };
};

/** The node answered that the account holds no contract, or a contract that fails the pool views. */
const isNotAStakingPool = (error: unknown): boolean =>
  error instanceof AccountDoesNotExistError || error instanceof ContractExecutionError;

const readStakingPosition = async (
  provider: JsonRpcProvider,
  address: string,
  validatorId: string,
): Promise<NearStakingPosition> => {
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
  return {
    staked: new BigNumber(rawStaked ?? 0),
    available: isAvailable ? unstaked : new BigNumber(0),
    pending: isAvailable ? new BigNumber(0) : unstaked,
    validatorId,
  };
};

export const getStakingPositions = async (
  config: NearConfig,
  address: string,
  options?: StakingPositionsOptions,
): Promise<{
  stakingPositions: NearStakingPosition[];
  totalStaked: BigNumber;
  totalAvailable: BigNumber;
  totalPending: BigNumber;
  /** The listing was asked for and failed; the positions come from the known and candidate pools. */
  poolListingFailed: boolean;
  /** Candidate pools whose node read failed for a reason other than not being a pool. */
  failedCandidates: string[];
}> => {
  const provider = new JsonRpcProvider({ url: config.infra.API_NEAR_PRIVATE_NODE });
  const stakingThreshold = getYoctoThreshold();

  const { required, candidates, listingFailed } = await resolveStakingPools(
    config,
    address,
    options,
  );

  const failedCandidates: string[] = [];
  const [requiredPositions, candidatePositions] = await Promise.all([
    Promise.all(required.map(validatorId => readStakingPosition(provider, address, validatorId))),
    Promise.all(
      candidates.map(validatorId =>
        readStakingPosition(provider, address, validatorId).catch(error => {
          if (isNotAStakingPool(error)) {
            log("Near", "candidate is not a staking pool, dropping it", { validatorId, error });
          } else {
            log("Near", "candidate staking pool read failed", { validatorId, error });
            failedCandidates.push(validatorId);
          }
          return undefined;
        }),
      ),
    ),
  ]);
  const positions = [
    ...requiredPositions,
    ...candidatePositions.filter((p): p is NearStakingPosition => p !== undefined),
  ];

  const sumAbove = (pick: (p: NearStakingPosition) => BigNumber) =>
    positions.reduce(
      (total, p) => (pick(p).gte(stakingThreshold) ? total.plus(pick(p)) : total),
      new BigNumber(0),
    );

  return {
    stakingPositions: positions.filter(sp => canUnstake(sp) || canWithdraw(sp) || sp.pending.gt(0)),
    totalStaked: sumAbove(p => p.staked),
    totalAvailable: sumAbove(p => p.available),
    totalPending: sumAbove(p => p.pending),
    poolListingFailed: listingFailed,
    failedCandidates,
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
  const collected: NearIndexerValidator[] = [];
  const maxPages = Math.ceil(total / VALIDATORS_PAGE_SIZE);
  let next: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const limit = Math.min(VALIDATORS_PAGE_SIZE, total - collected.length);
    const cursor = next ? `&next=${encodeURIComponent(next)}` : "";
    const body = await fetchNearblocks<NearV3Response<NearIndexerValidator[]>>(
      config,
      `/v3/validators?limit=${limit}${cursor}`,
    );

    const validators = body.data ?? [];
    collected.push(...validators);
    next = body.meta?.next_page;

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
  ttl: VALIDATORS_CACHE_TTL_MS,
});

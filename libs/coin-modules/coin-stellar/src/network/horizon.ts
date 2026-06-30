import type { Operation, Page } from "@ledgerhq/coin-module-framework/api/types";
import { LedgerAPI4xx, LedgerAPI5xx, NetworkDown } from "@ledgerhq/errors";
import type { CacheRes } from "@ledgerhq/live-network/cache";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { log } from "@ledgerhq/logs";
import {
  BadResponseError,
  BASE_FEE,
  Horizon,
  MuxedAccount,
  NetworkError,
  Networks,
  NotFoundError,
  Transaction as StellarSdkTransaction,
  StrKey,
  xdr,
} from "@stellar/stellar-sdk";
import { BigNumber } from "bignumber.js";
import coinConfig from "../config";
import { patchHermesTypedArraysIfNeeded, unpatchHermesTypedArrays } from "../polyfill";
import { StellarBroadcastFailedError, type StellarDecodedResultXdr } from "../types/errors";
import {
  type BalanceAsset,
  type NetworkInfo,
  type RawOperation,
  type Signer,
  NetworkCongestionLevel,
} from "../types";
import { getReservedBalance, rawOperationsToOperations } from "./serialization";
import { throwHorizonLedgerOrOperationsError } from "./horizonLedgerErrors";
import { parseAPIValue } from "../logic/common";

const FALLBACK_BASE_FEE = 100;
const TRESHOLD_LOW = 0.5;
const TRESHOLD_MEDIUM = 0.75;
const FETCH_LIMIT = 100;

const STELLAR_TX_RESULT_CODES_DOC_URL =
  "https://developers.stellar.org/docs/data/apis/horizon/api-reference/errors/result-codes/transactions";

/** Horizon `extras.result_codes.transaction` → one-line description (Stellar docs). */
const HORIZON_TRANSACTION_RESULT_CODE_DOCUMENTATION: Record<string, string> = {
  tx_success: "The transaction succeeded.",
  tx_failed: "One of the operations failed (none were applied).",
  tx_too_early: "The ledger closeTime was before the minTime.",
  tx_too_late: "The ledger closeTime was after the maxTime.",
  tx_missing_operation: "No operation was specified.",
  tx_bad_seq: "Sequence number does not match source account.",
  tx_bad_auth: "Too few valid signatures / wrong network.",
  tx_insufficient_balance: "Fee would bring account below reserve.",
  tx_no_source_account: "Source account not found.",
  tx_insufficient_fee: "Fee is too small.",
  tx_bad_auth_extra: "Unused signatures attached to transaction.",
  tx_internal_error: "An unknown error occurred.",
  tx_fee_bump_inner_success: "Fee bump inner transaction succeeded.",
  tx_fee_bump_inner_failed: "Fee bump inner transaction failed.",
  tx_not_supported: "Transaction type not supported.",
  tx_bad_sponsorship: "Sponsorship is invalid.",
  tx_bad_min_seq_age_or_gap: "Minimum sequence age or gap precondition failed.",
  tx_malformed: "Transaction is malformed.",
  tx_soroban_invalid: "Soroban transaction is invalid.",
};

type HorizonSubmitErrorBody = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  extras?: {
    envelope_xdr?: string;
    result_xdr?: string;
    result_codes?: {
      transaction?: string;
      operations?: string[];
    };
  };
};

function isHorizonSubmitErrorBody(data: unknown): data is HorizonSubmitErrorBody {
  return !!(
    data &&
    typeof data === "object" &&
    "extras" in data &&
    typeof data.extras === "object" &&
    data.extras !== null &&
    "result_codes" in data.extras &&
    data.extras.result_codes !== undefined &&
    typeof data.extras.result_codes === "object"
  );
}

/**
 * Horizon submit failures are usually {@link BadResponseError} with `response` = problem+json body.
 * In practice axios rejects with `AxiosError` first; the SDK's `.catch` forwards it unchanged (see js-stellar-sdk horizon/server.js),
 * so the Horizon body lives on `error.response.data`.
 */
function getHorizonBodyFromSubmitFailure(error: unknown): HorizonSubmitErrorBody | null {
  if (error instanceof BadResponseError && isHorizonSubmitErrorBody(error.response)) {
    return error.response;
  }
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as { response?: { data?: unknown } }).response?.data;
    if (isHorizonSubmitErrorBody(data)) {
      return data;
    }
  }
  return null;
}

function decodeTransactionResultFields(resultXdrBase64: string | undefined):
  | {
      feeChargedStroops?: string;
      resultXdrSwitchName?: string;
      decodedResultXdr: StellarDecodedResultXdr;
    }
  | undefined {
  if (!resultXdrBase64) {
    return undefined;
  }
  try {
    const tr = xdr.TransactionResult.fromXDR(resultXdrBase64, "base64");
    const feeChargedStroops = tr.feeCharged().toString();
    const resultXdrSwitchName = tr.result().switch().name;
    const decodedResultXdr: StellarDecodedResultXdr = {
      feeChargedStroops,
      resultSwitch: resultXdrSwitchName,
    };
    return { feeChargedStroops, resultXdrSwitchName, decodedResultXdr };
  } catch {
    return {
      decodedResultXdr: { decodeFailed: true, rawResultXdrBase64: resultXdrBase64 },
    };
  }
}

function makeBroadcastFailedError(body: HorizonSubmitErrorBody, cause: Error): Error {
  const extras = body.extras;
  const horizonTransactionCode = extras?.result_codes?.transaction ?? "";
  const horizonOperationCodes = extras?.result_codes?.operations;
  const documentationSummary =
    (horizonTransactionCode &&
      HORIZON_TRANSACTION_RESULT_CODE_DOCUMENTATION[horizonTransactionCode]) ||
    "Unknown transaction result code.";
  const decodedResult = decodeTransactionResultFields(extras?.result_xdr);
  const feeChargedStroops = decodedResult?.feeChargedStroops;
  const resultXdrSwitchName = decodedResult?.resultXdrSwitchName;
  const decodedResultXdr = decodedResult?.decodedResultXdr;
  const envelopeXdr = extras?.envelope_xdr ?? "";
  const message =
    body.detail || body.title || `Transaction submission failed (${body.status ?? "unknown"}).`;

  return new StellarBroadcastFailedError(
    message,
    {
      documentationSummary,
      horizonTransactionCode,
      horizonOperationCodes,
      resultXdrSwitchName,
      feeChargedStroops,
      stellarDocUrl: STELLAR_TX_RESULT_CODES_DOC_URL,
      decodedResultXdr,
      envelopeXdr,
    },
    { cause },
  );
}

// Horizon client instance is cached to avoid costly rebuild at every request
// Watch out: cache key is the URL, coin module can be instantiated several times with different URLs
const servers = new Map<string, Horizon.Server>();
function getServer(): Horizon.Server {
  const url = coinConfig.getCoinConfig().explorer.url;
  let server = servers.get(url);
  if (server === undefined) {
    server = new Horizon.Server(url);
    servers.set(url, server);
  }
  return server;
}

// Tracks request start times for response-duration logging.
// WeakMap avoids mutating the feaxios request config (whose type doesn't include `metadata`).
const requestStartTimes = new WeakMap<object, number>();

let interceptorsRegistered = false;

/**
 * Register logging and URL-fix interceptors on Horizon.AxiosClient.
 * Must be called once after coinConfig is initialised (i.e. inside createApi).
 *
 * Logging is gated on coinConfig.enableNetworkLogs (driven by the ENABLE_NETWORK_LOGS env var).
 * Horizon.AxiosClient uses feaxios internally, so we type the callbacks via the inferred
 * InterceptorManager types rather than importing live-network's axios-typed interceptors.
 */
export function registerHorizonInterceptors(): void {
  if (interceptorsRegistered) return;
  interceptorsRegistered = true;

  Horizon.AxiosClient.interceptors.request.use(config => {
    let enableNetworkLogs = false;
    try {
      enableNetworkLogs = !!coinConfig.getCoinConfig().enableNetworkLogs;
    } catch {
      return config;
    }
    if (enableNetworkLogs) {
      const { baseURL, url, method = "", data } = config;
      log("network", `${method} ${baseURL ?? ""}${url}`, { data });
      requestStartTimes.set(config, Date.now());
    }
    return config;
  });

  Horizon.AxiosClient.interceptors.response.use(response => {
    let enableNetworkLogs = false;
    try {
      enableNetworkLogs = !!coinConfig.getCoinConfig().enableNetworkLogs;
    } catch {
      // coinConfig not initialised on this instance; skip logging and leave URLs untouched
    }
    if (enableNetworkLogs) {
      // response.config is typed as `any` in stellar-sdk's HttpClientResponse
      const startTime = requestStartTimes.get(response.config) ?? 0;
      requestStartTimes.delete(response.config);
      log(
        "network-success",
        `${response.status} ${response.config?.method ?? ""} ${response.config?.baseURL ?? ""}${response.config?.url ?? ""} (${(Date.now() - startTime).toFixed(0)}ms)`,
        { data: response.data },
      );
    }

    // FIXME: workaround for the Stellar SDK not using the correct URL: the "next" URL
    // included in server responses points to the node itself instead of our reverse proxy...
    // (https://github.com/stellar/js-stellar-sdk/issues/637)
    const next_href = response?.data?._links?.next?.href;
    if (next_href) {
      response.data._links.next.href = useConfigHostAndProtocol(next_href);
    }
    response?.data?._embedded?.records?.forEach((r: any) => {
      const href = r.transaction?._links?.ledger?.href;
      if (href) r.transaction._links.ledger.href = useConfigHostAndProtocol(href);
    });

    return response;
  });
}

// It replaces the host and the protocol of the URL returned with the original ones.
export function useConfigHostAndProtocol(url: string): string {
  const originalUrl = new URL(coinConfig.getCoinConfig().explorer.url);
  // URL.protocol setter silently fails when changing between special (https://) and
  // non-special (injected://) schemes, so reconstruct via string replacement instead.
  return url.replace(/^[^:]+:\/\/[^/]+/, `${originalUrl.protocol}//${originalUrl.host}`);
}

const getMinimumBalance = (account: Horizon.ServerApi.AccountRecord): BigNumber => {
  return parseAPIValue(getReservedBalance(account).toString());
};

export async function getAccountSpendableBalance(
  balance: BigNumber,
  account: Horizon.ServerApi.AccountRecord,
): Promise<BigNumber> {
  const minimumBalance = getMinimumBalance(account);
  const { recommendedFee } = await fetchBaseFee();
  return BigNumber.max(balance.minus(minimumBalance).minus(recommendedFee), 0);
}

export async function fetchBaseFee(): Promise<{
  baseFee: number;
  recommendedFee: number;
  networkCongestionLevel: NetworkCongestionLevel;
}> {
  // For tests
  if (coinConfig.getCoinConfig().useStaticFees) {
    return {
      baseFee: 100,
      recommendedFee: 100,
      networkCongestionLevel: NetworkCongestionLevel.LOW,
    };
  }

  const baseFee = new BigNumber(BASE_FEE).toNumber() || FALLBACK_BASE_FEE;
  let recommendedFee = baseFee;
  let networkCongestionLevel = NetworkCongestionLevel.MEDIUM;

  try {
    const feeStats = await getServer().feeStats();
    const ledgerCapacityUsage = feeStats.ledger_capacity_usage;
    recommendedFee = new BigNumber(feeStats.fee_charged.mode).toNumber();

    if (
      new BigNumber(ledgerCapacityUsage).toNumber() > TRESHOLD_LOW &&
      new BigNumber(ledgerCapacityUsage).toNumber() <= TRESHOLD_MEDIUM
    ) {
      networkCongestionLevel = NetworkCongestionLevel.MEDIUM;
    } else if (new BigNumber(ledgerCapacityUsage).toNumber() > TRESHOLD_MEDIUM) {
      networkCongestionLevel = NetworkCongestionLevel.HIGH;
    } else {
      networkCongestionLevel = NetworkCongestionLevel.LOW;
    }
  } catch {
    // do nothing, will use defaults
  }

  return {
    baseFee,
    recommendedFee,
    networkCongestionLevel,
  };
}

/**
 * Get all account-related data
 *
 * @async
 * @param {string} addr
 */
export async function fetchAccount(addr: string): Promise<{
  blockHeight: number;
  balance: BigNumber;
  spendableBalance: BigNumber;
  assets: BalanceAsset[];
}> {
  let account: Horizon.ServerApi.AccountRecord = {} as Horizon.ServerApi.AccountRecord;
  let assets: BalanceAsset[] = [];
  let balance = "0";

  try {
    account = await getServer().accounts().accountId(addr).call();
    balance =
      account.balances?.find(balance => {
        return balance.asset_type === "native";
      })?.balance || "0";
    // Getting all non-native (XLM) assets on the account
    assets = account.balances?.filter(balance => {
      return balance.asset_type !== "native";
    }) as BalanceAsset[];
  } catch {
    balance = "0";
  }

  const formattedBalance = parseAPIValue(balance);

  const spendableBalance = await getAccountSpendableBalance(formattedBalance, account);

  return {
    blockHeight: account.sequence ? new BigNumber(account.sequence).toNumber() : 0,
    balance: formattedBalance,
    spendableBalance,
    assets,
  };
}

/**
 * Fetch operations for a single account from indexer
 *
 * @param {string} accountId
 * @param {string} addr
 * @param {string} order - "desc" or "asc" order of returned records
 * @param {string} cursor - point to start fetching records
 * @param {number} maxOperations - maximum number of operations to return, stops fetching after reaching this threshold
 *
 * @return {Operation[]}
 */
export async function fetchAllOperations(
  accountId: string,
  addr: string,
  order: "asc" | "desc",
  cursor: string = "",
  maxOperations?: number,
): Promise<Operation[]> {
  if (!addr) {
    return [];
  }

  const limit = coinConfig.getCoinConfig().explorer.fetchLimit ?? FETCH_LIMIT;
  let operations: Operation[] = [];
  let fetchedOpsCount = limit;

  try {
    let rawOperations = await getServer()
      .operations()
      .forAccount(addr)
      .limit(limit)
      .order(order)
      .cursor(cursor)
      .includeFailed(true)
      .join("transactions")
      .call();

    if (!rawOperations || !rawOperations.records.length) {
      return [];
    }

    operations = operations.concat(
      await rawOperationsToOperations(rawOperations.records as RawOperation[], addr, accountId, 0),
    );

    while (rawOperations.records.length > 0) {
      if (maxOperations && fetchedOpsCount >= maxOperations) {
        break;
      }
      fetchedOpsCount += limit;

      rawOperations = await rawOperations.next();
      operations = operations.concat(
        await rawOperationsToOperations(
          rawOperations.records as RawOperation[],
          addr,
          accountId,
          0,
        ),
      );
    }

    return operations;
  } catch (e: unknown) {
    // FIXME: terrible hacks, because Stellar SDK fails to cast network failures to typed errors in react-native...
    // (https://github.com/stellar/js-stellar-sdk/issues/638)
    const errorMsg = e ? String(e) : "";

    if (e instanceof NotFoundError || errorMsg.match(/status code 404/)) {
      return [];
    }

    if (errorMsg.match(/status code 4[0-9]{2}/)) {
      throw new LedgerAPI4xx();
    }

    if (errorMsg.match(/status code 5[0-9]{2}/)) {
      throw new LedgerAPI5xx();
    }

    if (
      e instanceof NetworkError ||
      errorMsg.match(/ECONNRESET|ECONNREFUSED|ENOTFOUND|EPIPE|ETIMEDOUT/) ||
      errorMsg.match(/undefined is not an object/)
    ) {
      throw new NetworkDown();
    }

    throw e;
  }
}

// https://developers.stellar.org/docs/data/horizon/api-reference/get-operations-by-account-id
export async function fetchOperations({
  accountId,
  addr,
  minHeight,
  order,
  cursor,
  limit,
}: {
  accountId: string;
  addr: string;
  minHeight: number;
  order: "asc" | "desc";
  cursor: string | undefined;
  limit?: number | undefined;
}): Promise<Page<Operation>> {
  const noResult: Page<Operation> = { items: [], next: "" };
  if (!addr) {
    return noResult;
  }

  const requestedLimit = limit ?? coinConfig.getCoinConfig().explorer.fetchLimit ?? FETCH_LIMIT;

  try {
    const rawOperations = await getServer()
      .operations()
      .forAccount(addr)
      .limit(requestedLimit)
      .order(order)
      .cursor(cursor ?? "")
      .includeFailed(true)
      .join("transactions")
      .call();

    if (!rawOperations || !rawOperations.records.length) {
      return noResult;
    }

    const rawOps = rawOperations.records as RawOperation[];
    const filteredOps = await rawOperationsToOperations(rawOps, addr, accountId, minHeight);

    // Always return the cursor so the caller can continue pagination,
    // even when filteredOps is empty (e.g. page of unsupported types).
    const nextCursor = rawOps.length < requestedLimit ? "" : rawOps[rawOps.length - 1].paging_token;

    return { items: filteredOps, next: nextCursor };
  } catch (e: unknown) {
    // FIXME: terrible hacks, because Stellar SDK fails to cast network failures to typed errors in react-native...
    // (https://github.com/stellar/js-stellar-sdk/issues/638)
    // update 2025-04-01: in case of NetworkError, the error.response fields are undefined. Hence we cannot rely on status code
    // the only way to check is the errror message, which may break at some point
    const errorMsg = e ? String(e) : "";

    if (e instanceof NotFoundError || errorMsg.match(/status code 404/)) {
      return noResult;
    }
    if (errorMsg.match(/too many requests/i)) {
      throw new LedgerAPI4xx("status code 4xx", { status: 429, url: undefined, method: "GET" });
    }
    if (errorMsg.match(/status code 4[0-9]{2}/)) {
      throw new LedgerAPI4xx();
    }
    if (errorMsg.match(/status code 5[0-9]{2}/)) {
      throw new LedgerAPI5xx();
    }

    if (
      e instanceof NetworkError ||
      errorMsg.match(/ECONNRESET|ECONNREFUSED|ENOTFOUND|EPIPE|ETIMEDOUT/) ||
      errorMsg.match(/undefined is not an object/)
    ) {
      throw new NetworkDown();
    }

    throw e;
  }
}

export async function fetchAccountNetworkInfo(account: string): Promise<NetworkInfo> {
  try {
    const extendedAccount = await getServer().accounts().accountId(account).call();
    const baseReserve = getReservedBalance(extendedAccount);
    const { recommendedFee, networkCongestionLevel, baseFee } = await fetchBaseFee();

    return {
      family: "stellar",
      fees: new BigNumber(recommendedFee.toString()),
      baseFee: new BigNumber(baseFee.toString()),
      baseReserve,
      networkCongestionLevel,
    };
  } catch {
    return {
      family: "stellar",
      fees: new BigNumber(0),
      baseFee: new BigNumber(100),
      baseReserve: new BigNumber(0),
    };
  }
}

export async function fetchSequence(address: string): Promise<BigNumber> {
  const extendedAccount = await loadAccount(address);
  return extendedAccount ? new BigNumber(extendedAccount.sequence) : new BigNumber(0);
}

export async function fetchSigners(account: string): Promise<Signer[]> {
  try {
    const extendedAccount = await getServer().accounts().accountId(account).call();
    return extendedAccount.signers;
  } catch {
    return [];
  }
}

function interpretedError(error: unknown): unknown {
  const body = getHorizonBodyFromSubmitFailure(error);
  if (body) {
    const cause = error instanceof Error ? error : new Error(String(error));
    return makeBroadcastFailedError(body, cause);
  }
  return error;
}

export async function broadcastTransaction(signedTransaction: string): Promise<string> {
  try {
    patchHermesTypedArraysIfNeeded();
    const transaction = new StellarSdkTransaction(signedTransaction, Networks.PUBLIC);

    try {
      const res = await getServer().submitTransaction(transaction, {
        skipMemoRequiredCheck: true,
      });
      return res.hash;
    } catch (error: unknown) {
      throw interpretedError(error);
    }
  } finally {
    // Restore
    unpatchHermesTypedArrays();
  }
}

export async function loadAccount(addr: string): Promise<Horizon.AccountResponse | null> {
  if (!addr || !addr.length) {
    return null;
  }

  try {
    return await getServer().loadAccount(addr);
  } catch {
    return null;
  }
}

export async function getLastBlock(): Promise<{
  height: number;
  hash: string;
  time: Date;
}> {
  const ledger = await getServer().ledgers().order("desc").limit(1).call();
  return {
    height: ledger.records[0].sequence,
    hash: ledger.records[0].hash,
    time: new Date(ledger.records[0].closed_at),
  };
}

/**
 * Loads a single ledger (closed block) by sequence number.
 *
 * Horizon `GET /ledgers/{sequence}` returns one ledger resource, not a page with `records`;
 * do not read `records[0]` from this `.call()` result.
 *
 * @throws Error when the ledger does not exist (Horizon 404).
 */
export async function fetchLedgerRecord(sequence: number): Promise<Horizon.ServerApi.LedgerRecord> {
  try {
    const record = await getServer().ledgers().ledger(sequence).call();
    // Horizon returns a single ledger; SDK typings still use CollectionPage for this builder.
    return record as unknown as Horizon.ServerApi.LedgerRecord;
  } catch (e: unknown) {
    throwHorizonLedgerOrOperationsError(e, `Stellar ledger ${sequence} not found`);
  }
}

/**
 * Returns all operations included in `ledgerSequence`, ascending, including failed txs,
 * with joined transaction payloads (same pattern as account operation listing).
 *
 * @throws Error when the ledger does not exist (Horizon 404).
 */
export async function fetchAllLedgerOperations(ledgerSequence: number): Promise<RawOperation[]> {
  const limit = coinConfig.getCoinConfig().explorer.fetchLimit ?? FETCH_LIMIT;

  try {
    let response = await getServer()
      .operations()
      .forLedger(ledgerSequence)
      .includeFailed(true)
      .join("transactions")
      .order("asc")
      .limit(limit)
      .call();

    const records: RawOperation[] = [...(response.records as RawOperation[])];

    while (response.records.length === limit) {
      response = await response.next();
      records.push(...(response.records as RawOperation[]));
      if (response.records.length === 0) {
        break;
      }
    }

    return records;
  } catch (e: unknown) {
    throwHorizonLedgerOrOperationsError(e, `Stellar ledger ${ledgerSequence} not found`);
  }
}

export const getRecipientAccount: CacheRes<
  Array<{
    recipient: string;
  }>,
  {
    id: string | null;
    isMuxedAccount: boolean;
    assetIds: string[];
  } | null
> = makeLRUCache(
  async ({ recipient }) => await recipientAccount(recipient),
  extract => extract.recipient,
  {
    max: 300,
    ttl: 5 * 60,
  }, // 5 minutes
);

async function recipientAccount(address?: string): Promise<{
  id: string | null;
  isMuxedAccount: boolean;
  assetIds: string[];
} | null> {
  if (!address) {
    return null;
  }

  let accountAddress = address;

  const isMuxedAccount = StrKey.isValidMed25519PublicKey(address);

  if (isMuxedAccount) {
    const muxedAccount = MuxedAccount.fromAddress(address, "0");
    accountAddress = muxedAccount.baseAccount().accountId();
  }

  const account: Horizon.AccountResponse | null = await loadAccount(accountAddress);

  if (!account) {
    return null;
  }

  return {
    id: account.id,
    isMuxedAccount,
    assetIds: account.balances.reduce((allAssets: any[], balance: any) => {
      return [...allAssets, getBalanceId(balance)];
    }, []),
  };
}

function getBalanceId(balance: BalanceAsset): string | null {
  switch (balance.asset_type) {
    case "native":
      return "native";
    case "liquidity_pool_shares":
      return balance.liquidity_pool_id || null;
    case "credit_alphanum4":
    case "credit_alphanum12":
      return `${balance.asset_code}:${balance.asset_issuer}`;
    default:
      return null;
  }
}

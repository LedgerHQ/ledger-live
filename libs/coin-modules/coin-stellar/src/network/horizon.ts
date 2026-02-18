import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { LedgerAPI4xx, LedgerAPI5xx, NetworkDown } from "@ledgerhq/errors";
import type { CacheRes } from "@ledgerhq/live-network/cache";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { log } from "@ledgerhq/logs";
import {
  // @ts-expect-error stellar-sdk ts definition missing?
  AccountRecord,
  BASE_FEE,
  Horizon,
  MuxedAccount,
  NetworkError,
  Networks,
  NotFoundError,
  Transaction as StellarSdkTransaction,
  StrKey,
} from "@stellar/stellar-sdk";
import { BigNumber } from "bignumber.js";
import coinConfig from "../config";
import { patchHermesTypedArraysIfNeeded, unpatchHermesTypedArrays } from "../polyfill";
import {
  type BalanceAsset,
  type NetworkInfo,
  type RawOperation,
  type Signer,
  NetworkCongestionLevel,
  StellarOperation,
} from "../types";
import { getReservedBalance, rawOperationsToOperations } from "./serialization";

const FALLBACK_BASE_FEE = 100;
const TRESHOLD_LOW = 0.5;
const TRESHOLD_MEDIUM = 0.75;
const FETCH_LIMIT = 100;
const currency = getCryptoCurrencyById("stellar");

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

// Due to the inconsistency between the axios version (1.6.5) used by `stellar-sdk`
// and the version (0.26.1) used by `@ledgerhq/live-network/network`, it is not possible to use the interceptors
// provided by `@ledgerhq/live-network/network`.
Horizon.AxiosClient.interceptors.request.use(config => {
  if (!coinConfig.getCoinConfig().enableNetworkLogs) {
    return config;
  }

  const { url, method, data } = config;
  log("network", `${method} ${url}`, { data });
  return config;
});

// This function allows to fix the URL, because the url returned by the Stellar SDK is not the correct one.
// It replaces the host of the URL returned with the host of the explorer.
function useConfigHost(url: string): string {
  const u = new URL(url);
  u.host = new URL(coinConfig.getCoinConfig().explorer.url).host;
  return u.toString();
}

const getMinimumBalance = (account: Horizon.ServerApi.AccountRecord): BigNumber => {
  return parseCurrencyUnit(currency.units[0], getReservedBalance(account).toString());
};

export async function getAccountSpendableBalance(
  balance: BigNumber,
  account: Horizon.ServerApi.AccountRecord,
): Promise<BigNumber> {
  const minimumBalance = getMinimumBalance(account);
  const { recommendedFee } = await fetchBaseFee();
  return BigNumber.max(balance.minus(minimumBalance).minus(recommendedFee), 0);
}

Horizon.AxiosClient.interceptors.response.use(response => {
  if (coinConfig.getCoinConfig().enableNetworkLogs) {
    const { url, method } = response.config;
    log("network-success", `${response.status} ${method} ${url}`, { data: response.data });
  }

  // FIXME: workaround for the Stellar SDK not using the correct URL: the "next" URL
  // included in server responses points to the node itself instead of our reverse proxy...
  // (https://github.com/stellar/js-stellar-sdk/issues/637)

  const next_href = response?.data?._links?.next?.href;

  if (next_href) {
    response.data._links.next.href = useConfigHost(next_href);
  }

  response?.data?._embedded?.records?.forEach((r: any) => {
    const href = r.transaction?._links?.ledger?.href;
    if (href) r.transaction._links.ledger.href = useConfigHost(href);
  });

  return response;
});

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

  const formattedBalance = parseCurrencyUnit(currency.units[0], balance);

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
): Promise<StellarOperation[]> {
  if (!addr) {
    return [];
  }

  const limit = coinConfig.getCoinConfig().explorer.fetchLimit ?? FETCH_LIMIT;
  let operations: StellarOperation[] = [];
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
}): Promise<[StellarOperation[], string]> {
  const noResult: [StellarOperation[], string] = [[], ""];
  if (!addr) {
    return noResult;
  }

  const defaultFetchLimit = coinConfig.getCoinConfig().explorer.fetchLimit ?? FETCH_LIMIT;

  try {
    const rawOperations = await getServer()
      .operations()
      .forAccount(addr)
      .limit(limit ?? defaultFetchLimit)
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

    // in this context, if we have filtered out operations it means those operations were < minHeight, so we are done
    const nextCursor =
      filteredOps.length === rawOps.length ? rawOps[rawOps.length - 1].paging_token : "";

    return [filteredOps, nextCursor];
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

export async function broadcastTransaction(signedTransaction: string): Promise<string> {
  try {
    patchHermesTypedArraysIfNeeded();
    const transaction = new StellarSdkTransaction(signedTransaction, Networks.PUBLIC);

    const res = await getServer().submitTransaction(transaction, {
      skipMemoRequiredCheck: true,
    });
    return res.hash;
  } finally {
    // Restore
    unpatchHermesTypedArrays();
  }
}

export async function loadAccount(addr: string): Promise<AccountRecord | null> {
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

  const account: AccountRecord = await loadAccount(accountAddress);

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

import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { LedgerAPI4xx, LedgerAPI5xx, NetworkDown } from "@ledgerhq/errors";
import type { CacheRes } from "@ledgerhq/live-network/cache";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { log } from "@ledgerhq/logs";
import type { Account, Operation } from "@ledgerhq/types-live";
import {
  // @ts-expect-error stellar-sdk ts definition missing?
  AccountRecord,
  BASE_FEE,
  Horizon,
  NetworkError,
  Networks,
  NotFoundError,
  Transaction as StellarSdkTransaction,
  StrKey,
  MuxedAccount,
} from "@stellar/stellar-sdk";
import { BigNumber } from "bignumber.js";
import {
  getAccountSpendableBalance,
  getReservedBalance,
  rawOperationsToOperations,
} from "../bridge/logic";
import coinConfig from "../config";
import {
  type BalanceAsset,
  type NetworkInfo,
  type RawOperation,
  type Signer,
  NetworkCongestionLevel,
} from "../types";

const FALLBACK_BASE_FEE = 100;
const TRESHOLD_LOW = 0.5;
const TRESHOLD_MEDIUM = 0.75;
const FETCH_LIMIT = 100;
const currency = getCryptoCurrencyById("stellar");
let server: Horizon.Server | undefined;
const getServer = () => {
  if (!server) {
    server = new Horizon.Server(coinConfig.getCoinConfig().explorer.url);
  }
  return server;
};

// Constants
export const BASE_RESERVE = 0.5;
export const BASE_RESERVE_MIN_COUNT = 2;
export const MIN_BALANCE = 1;

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
    const next = new URL(next_href);
    next.host = new URL(coinConfig.getCoinConfig().explorer.url).host;
    response.data._links.next.href = next.toString();
  }

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
  } catch (e) {
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
  } catch (e) {
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
 * Fetch all operations for a single account from indexer
 *
 * @param {string} accountId
 * @param {string} addr
 * @param {string} order - "desc" or "asc" order of returned records
 * @param {string} cursor - point to start fetching records
 *
 * @return {Operation[]}
 */
export async function fetchOperations({
  accountId,
  addr,
  order,
  cursor,
}: {
  accountId: string;
  addr: string;
  order: "asc" | "desc";
  cursor: string;
}): Promise<Operation[]> {
  if (!addr) {
    return [];
  }

  let operations: Operation[] = [];

  try {
    let rawOperations = await getServer()
      .operations()
      .forAccount(addr)
      .limit(coinConfig.getCoinConfig().explorer.fetchLimit ?? FETCH_LIMIT)
      .order(order)
      .cursor(cursor)
      .includeFailed(true)
      .join("transactions")
      .call();

    if (!rawOperations || !rawOperations.records.length) {
      return [];
    }

    operations = operations.concat(
      await rawOperationsToOperations(rawOperations.records as RawOperation[], addr, accountId),
    );

    while (rawOperations.records.length > 0) {
      rawOperations = await rawOperations.next();
      operations = operations.concat(
        await rawOperationsToOperations(rawOperations.records as RawOperation[], addr, accountId),
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

export async function fetchAccountNetworkInfo(account: Account): Promise<NetworkInfo> {
  try {
    const extendedAccount = await getServer().accounts().accountId(account.freshAddress).call();
    const baseReserve = getReservedBalance(extendedAccount);
    const { recommendedFee, networkCongestionLevel, baseFee } = await fetchBaseFee();

    return {
      family: "stellar",
      fees: new BigNumber(recommendedFee.toString()),
      baseFee: new BigNumber(baseFee.toString()),
      baseReserve,
      networkCongestionLevel,
    };
  } catch (error) {
    return {
      family: "stellar",
      fees: new BigNumber(0),
      baseFee: new BigNumber(0),
      baseReserve: new BigNumber(0),
    };
  }
}

export async function fetchSequence(account: Account): Promise<BigNumber> {
  const extendedAccount = await loadAccount(account.freshAddress);
  return extendedAccount ? new BigNumber(extendedAccount.sequence) : new BigNumber(0);
}

export async function fetchSigners(account: Account): Promise<Signer[]> {
  try {
    const extendedAccount = await getServer().accounts().accountId(account.freshAddress).call();
    return extendedAccount.signers;
  } catch (error) {
    return [];
  }
}

export async function broadcastTransaction(signedTransaction: string): Promise<string> {
  const transaction = new StellarSdkTransaction(signedTransaction, Networks.PUBLIC);
  const res = await getServer().submitTransaction(transaction, {
    skipMemoRequiredCheck: true,
  });
  return res.hash;
}

export async function loadAccount(addr: string): Promise<AccountRecord | null> {
  if (!addr || !addr.length) {
    return null;
  }

  try {
    return await getServer().loadAccount(addr);
  } catch (e) {
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

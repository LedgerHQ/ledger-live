import { LedgerAPI4xx, LedgerAPI5xx, NetworkDown } from "@ledgerhq/errors";
import { requestInterceptor, responseInterceptor } from "@ledgerhq/live-network/network";
import type { Account, Operation } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import {
  // @ts-expect-error stellar-sdk ts definition missing?
  AccountRecord,
  NetworkError,
  NotFoundError,
  Server,
  HorizonAxiosClient,
  BASE_FEE,
  Asset,
  Operation as StellarSdkOperation,
  Account as StellarSdkAccount,
  Transaction as StellarSdkTransaction,
  TransactionBuilder,
  Networks,
  ServerApi,
} from "stellar-sdk";

import { getCryptoCurrencyById, parseCurrencyUnit } from "../../../currencies";
import { getEnv } from "@ledgerhq/live-env";
import {
  getAccountSpendableBalance,
  getReservedBalance,
  rawOperationsToOperations,
} from "../logic";
import type { BalanceAsset, NetworkInfo, RawOperation } from "../types";
import { NetworkCongestionLevel, Signer } from "../types";

const LIMIT = getEnv("API_STELLAR_HORIZON_FETCH_LIMIT");
const FALLBACK_BASE_FEE = 100;
const TRESHOLD_LOW = 0.5;
const TRESHOLD_MEDIUM = 0.75;
const currency = getCryptoCurrencyById("stellar");
const server = new Server(getEnv("API_STELLAR_HORIZON"));

// Constants
export const BASE_RESERVE = 0.5;
export const BASE_RESERVE_MIN_COUNT = 2;
export const MIN_BALANCE = 1;

HorizonAxiosClient.interceptors.request.use(requestInterceptor);

HorizonAxiosClient.interceptors.response.use(response => {
  responseInterceptor(response);
  // FIXME: workaround for the Stellar SDK not using the correct URL: the "next" URL
  // included in server responses points to the node itself instead of our reverse proxy...
  // (https://github.com/stellar/js-stellar-sdk/issues/637)
  const url = response?.data?._links?.next?.href;

  if (url) {
    const next = new URL(url);
    next.host = new URL(getEnv("API_STELLAR_HORIZON")).host;
    response.data._links.next.href = next.toString();
  }

  return response;
});

const getFormattedAmount = (amount: BigNumber) => {
  return amount.div(new BigNumber(10).pow(currency.units[0].magnitude)).toString(10);
};

export const fetchBaseFee = async (): Promise<{
  baseFee: number;
  recommendedFee: number;
  networkCongestionLevel: NetworkCongestionLevel;
}> => {
  // For tests
  if (getEnv("API_STELLAR_HORIZON_STATIC_FEE")) {
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
    const feeStats = await server.feeStats();
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
};

/**
 * Get all account-related data
 *
 * @async
 * @param {*} addr
 */
export const fetchAccount = async (
  addr: string,
): Promise<{
  blockHeight: number;
  balance: BigNumber;
  spendableBalance: BigNumber;
  assets: BalanceAsset[];
}> => {
  let account: ServerApi.AccountRecord = {} as ServerApi.AccountRecord;
  let assets: BalanceAsset[] = [];
  let balance = "0";

  try {
    account = await server.accounts().accountId(addr).call();
    balance =
      account.balances?.find(balance => {
        return balance.asset_type === "native";
      })?.balance || "0";
    // Getting all non-native (XLM) assets on the account
    assets = account.balances.filter(balance => {
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
};

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
export const fetchOperations = async ({
  accountId,
  addr,
  order,
  cursor,
}: {
  accountId: string;
  addr: string;
  order: "asc" | "desc";
  cursor: string;
}): Promise<Operation[]> => {
  if (!addr) {
    return [];
  }

  let operations: Operation[] = [];

  try {
    let rawOperations = await server
      .operations()
      .forAccount(addr)
      .limit(LIMIT)
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
};

export const fetchAccountNetworkInfo = async (account: Account): Promise<NetworkInfo> => {
  try {
    const extendedAccount = await server.accounts().accountId(account.freshAddress).call();
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
      networkCongestionLevel: undefined,
    };
  }
};

export const fetchSequence = async (a: Account): Promise<BigNumber> => {
  const extendedAccount = await loadAccount(a.freshAddress);
  return extendedAccount ? new BigNumber(extendedAccount.sequence) : new BigNumber(0);
};

export const fetchSigners = async (a: Account): Promise<Signer[]> => {
  try {
    const extendedAccount = await server.accounts().accountId(a.freshAddress).call();
    return extendedAccount.signers;
  } catch (error) {
    return [];
  }
};

export const broadcastTransaction = async (signedTransaction: string): Promise<string> => {
  const transaction = new StellarSdkTransaction(signedTransaction, Networks.PUBLIC);
  const res = await server.submitTransaction(transaction, {
    skipMemoRequiredCheck: true,
  });
  return res.hash;
};

export const buildPaymentOperation = ({
  destination,
  amount,
  assetCode,
  assetIssuer,
}: {
  destination: string;
  amount: BigNumber;
  assetCode: string | undefined;
  assetIssuer: string | undefined;
}) => {
  const formattedAmount = getFormattedAmount(amount);
  // Non-native assets should always have asset code and asset issuer. If an
  // asset doesn't have both, we assume it is native asset.
  const asset = assetCode && assetIssuer ? new Asset(assetCode, assetIssuer) : Asset.native();
  return StellarSdkOperation.payment({
    destination: destination,
    amount: formattedAmount,
    asset,
  });
};

export const buildCreateAccountOperation = (destination: string, amount: BigNumber) => {
  const formattedAmount = getFormattedAmount(amount);
  return StellarSdkOperation.createAccount({
    destination: destination,
    startingBalance: formattedAmount,
  });
};

export const buildChangeTrustOperation = (assetCode: string, assetIssuer: string) => {
  return StellarSdkOperation.changeTrust({
    asset: new Asset(assetCode, assetIssuer),
  });
};

export const buildTransactionBuilder = (source: StellarSdkAccount, fee: BigNumber) => {
  const formattedFee = fee.toString();
  return new TransactionBuilder(source, {
    fee: formattedFee,
    networkPassphrase: Networks.PUBLIC,
  });
};

export const loadAccount = async (addr: string): Promise<AccountRecord | null> => {
  if (!addr || !addr.length) {
    return null;
  }

  try {
    return await server.loadAccount(addr);
  } catch (e) {
    return null;
  }
};

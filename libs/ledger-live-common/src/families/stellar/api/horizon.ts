import { BigNumber } from "bignumber.js";
import StellarSdk, {
  // @ts-expect-error stellar-sdk ts definition missing?
  AccountRecord,
  NotFoundError,
  NetworkError,
} from "stellar-sdk";
import { getEnv } from "../../../env";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../../currencies";
import type { Account, Operation } from "../../../types";
import type { NetworkInfo } from "../types";
import {
  getAccountSpendableBalance,
  rawOperationsToOperations,
} from "../logic";
import { NetworkDown, LedgerAPI4xx, LedgerAPI5xx } from "@ledgerhq/errors";
import { requestInterceptor, responseInterceptor } from "../../../network";

const LIMIT = getEnv("API_STELLAR_HORIZON_FETCH_LIMIT");
const FALLBACK_BASE_FEE = 100;
const currency = getCryptoCurrencyById("stellar");
const server = new StellarSdk.Server(getEnv("API_STELLAR_HORIZON"));

StellarSdk.HorizonAxiosClient.interceptors.request.use(requestInterceptor);

StellarSdk.HorizonAxiosClient.interceptors.response.use((response) => {
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
  return amount
    .div(new BigNumber(10).pow(currency.units[0].magnitude))
    .toString(10);
};

export const fetchBaseFee = async (): Promise<number> => {
  let baseFee;

  try {
    baseFee = await server.fetchBaseFee();
  } catch (e) {
    baseFee = FALLBACK_BASE_FEE;
  }

  return baseFee;
};

/**
 * Get all account-related data
 *
 * @async
 * @param {*} addr
 */
export const fetchAccount = async (
  addr: string
): Promise<{
  blockHeight?: number;
  balance: BigNumber;
  spendableBalance: BigNumber;
}> => {
  let account: typeof AccountRecord = {};
  let balance: Record<string, any> = {};

  try {
    account = await server.accounts().accountId(addr).call();
    balance = account.balances.find((balance) => {
      return balance.asset_type === "native";
    });
  } catch (e) {
    balance.balance = "0";
  }

  const formattedBalance = parseCurrencyUnit(
    currency.units[0],
    balance.balance
  );

  const spendableBalance = await getAccountSpendableBalance(
    formattedBalance,
    account
  );

  return {
    blockHeight: account.sequence ? Number(account.sequence) : undefined,
    balance: formattedBalance,
    spendableBalance,
  };
};

/**
 * Fetch all operations for a single account from indexer
 *
 * @param {string} accountId
 * @param {string} addr
 * @param {number} startAt - blockHeight after which you fetch this op (included)
 *
 * @return {Operation[]}
 */
export const fetchOperations = async (
  accountId: string,
  addr: string,
  startAt = 0
): Promise<Operation[]> => {
  if (!addr || !addr.length) {
    return [];
  }

  let operations: Operation[] = [];
  let rawOperations: Record<string, any> = {};

  try {
    rawOperations = await server
      .operations()
      .forAccount(addr)
      .join("transactions")
      .includeFailed(true)
      .limit(LIMIT)
      .cursor(startAt)
      .call();
  } catch (e: any) {
    // FIXME: terrible hacks, because Stellar SDK fails to cast network failures to typed errors in react-native...
    // (https://github.com/stellar/js-stellar-sdk/issues/638)
    const errorMsg = e ? e.toString() : "";

    if (e instanceof NotFoundError || errorMsg.match(/status code 404/)) {
      return [];
    }

    if (errorMsg.match(/status code 4[0-9]{2}/)) {
      return new LedgerAPI4xx();
    }

    if (errorMsg.match(/status code 5[0-9]{2}/)) {
      return new LedgerAPI5xx();
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

  if (!rawOperations || !rawOperations.records.length) {
    return [];
  }

  operations = operations.concat(
    await rawOperationsToOperations(rawOperations.records, addr, accountId)
  );

  while (rawOperations.records.length > 0) {
    rawOperations = await rawOperations.next();
    operations = operations.concat(
      await rawOperationsToOperations(rawOperations.records, addr, accountId)
    );
  }

  return operations;
};
export const fetchAccountNetworkInfo = async (
  account: Account
): Promise<NetworkInfo> => {
  try {
    const extendedAccount = await server
      .accounts()
      .accountId(account.freshAddress)
      .call();
    const numberOfEntries = extendedAccount.subentry_count;
    const ledger = await server
      .ledgers()
      .ledger(extendedAccount.last_modified_ledger)
      .call();
    const baseReserve = new BigNumber(
      (ledger.base_reserve_in_stroops * (2 + numberOfEntries)).toString()
    );
    const fees = new BigNumber(ledger.base_fee_in_stroops.toString());
    return {
      family: "stellar",
      fees,
      baseReserve,
    };
  } catch (error) {
    return {
      family: "stellar",
      fees: new BigNumber(0),
      baseReserve: new BigNumber(0),
    };
  }
};

export const fetchSequence = async (a: Account): Promise<BigNumber> => {
  const extendedAccount = await loadAccount(a.freshAddress);
  return extendedAccount
    ? new BigNumber(extendedAccount.sequence)
    : new BigNumber(0);
};

export const fetchSigners = async (a: Account) => {
  try {
    const extendedAccount = await server
      .accounts()
      .accountId(a.freshAddress)
      .call();
    return extendedAccount.signers;
  } catch (error) {
    return [];
  }
};

export const broadcastTransaction = async (
  signedTransaction: string
): Promise<string> => {
  const transaction = new StellarSdk.Transaction(
    signedTransaction,
    StellarSdk.Networks.PUBLIC
  );
  const res = await server.submitTransaction(transaction, {
    skipMemoRequiredCheck: true,
  });
  return res.hash;
};

export const buildPaymentOperation = (
  destination: string,
  amount: BigNumber
): any => {
  const formattedAmount = getFormattedAmount(amount);
  return StellarSdk.Operation.payment({
    destination: destination,
    amount: formattedAmount,
    asset: StellarSdk.Asset.native(),
  });
};

export const buildCreateAccountOperation = (
  destination: string,
  amount: BigNumber
): any => {
  const formattedAmount = getFormattedAmount(amount);
  return StellarSdk.Operation.createAccount({
    destination: destination,
    startingBalance: formattedAmount,
  });
};

export const buildTransactionBuilder = (
  source: typeof StellarSdk.Account,
  fee: BigNumber
): any => {
  const formattedFee = fee.toString();
  return new StellarSdk.TransactionBuilder(source, {
    fee: formattedFee,
    networkPassphrase: StellarSdk.Networks.PUBLIC,
  });
};

export const loadAccount = async (addr: string): Promise<any> => {
  if (!addr || !addr.length) {
    return null;
  }

  try {
    return await server.loadAccount(addr);
  } catch (e) {
    return null;
  }
};

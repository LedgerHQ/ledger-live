//@flow
import { BigNumber } from "bignumber.js";
import StellarSdk from "stellar-sdk";
import { getEnv } from "../../../env";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../../currencies";
import type { Account, NetworkInfo, Operation } from "../../../types";
import type { RawAccount, RawTransaction } from "./horizon.types";
import { getAccountSpendableBalance, rawOperationToOperation } from "../logic";

const LIMIT = getEnv("API_STELLAR_HORIZON_FETCH_LIMIT");
const FALLBACK_BASE_FEE = 100;

const currency = getCryptoCurrencyById("stellar");

const getServer = () => {
  const server = new StellarSdk.Server(getEnv("API_STELLAR_HORIZON"));

  return server;
};

const getFormattedAmount = (amount: BigNumber) => {
  return amount
    .div(BigNumber(10).pow(currency.units[0].magnitude))
    .toString(10);
};

export const fetchBaseFee = async (): Promise<number> => {
  let baseFee;

  try {
    baseFee = await getServer().fetchBaseFee();
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
export const fetchAccount = async (addr: string) => {
  let account: RawAccount = {};
  let balance = {};
  try {
    account = await getServer().accounts().accountId(addr).call();
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
  startAt: number = 0
): Promise<Operation[]> => {
  const transactions = await fetchTransactionsList(accountId, addr, startAt);
  return await fetchOperationList(accountId, addr, transactions);
};

const fetchTransactionsList = async (
  accountId: string,
  addr: string,
  startAt: number
): Promise<RawTransaction[]> => {
  let transactions = {};
  let mergedTransactions = [];

  try {
    transactions = await getServer()
      .transactions()
      .forAccount(addr)
      .cursor(startAt)
      .limit(LIMIT)
      .call();

    mergedTransactions = transactions.records;

    while (transactions.records.length > 0) {
      transactions = await transactions.next();
      mergedTransactions = mergedTransactions.concat(transactions.records);
    }
  } catch (e) {
    return [];
  }

  return mergedTransactions;
};

const fetchOperationList = async (
  accountId: string,
  addr: string,
  transactions: RawTransaction[]
): Promise<Operation[]> => {
  let formattedMergedOp = [];

  for (let i = 0; i < transactions.length; i++) {
    let operations = await getServer()
      .operations()
      .forTransaction(transactions[i].id)
      .limit(LIMIT)
      .call();

    formattedMergedOp = formattedMergedOp.concat(
      rawOperationToOperation(
        operations.records,
        transactions[i],
        addr,
        accountId
      )
    );

    while (operations.records.length > 0) {
      operations = await operations.next();

      formattedMergedOp = formattedMergedOp.concat(
        rawOperationToOperation(
          operations.records,
          transactions[i],
          addr,
          accountId
        )
      );
    }
  }

  return formattedMergedOp;
};

export const fetchAccountNetworkInfo = async (
  account: Account
): Promise<NetworkInfo> => {
  try {
    const extendedAccount = await getServer()
      .accounts()
      .accountId(account.freshAddress)
      .call();

    const numberOfEntries = extendedAccount.subentry_count;

    const ledger = await getServer()
      .ledgers()
      .ledger(extendedAccount.last_modified_ledger)
      .call();

    const baseReserve = BigNumber(
      (ledger.base_reserve_in_stroops * (2 + numberOfEntries)).toString()
    );

    const fees = BigNumber(ledger.base_fee_in_stroops.toString());

    return {
      family: "stellar",
      fees,
      baseReserve,
    };
  } catch (error) {
    return {
      family: "stellar",
      fees: BigNumber(0),
      baseReserve: BigNumber(0),
    };
  }
};

export const fetchSequence = async (a: Account) => {
  const extendedAccount = await getServer().loadAccount(a.freshAddress);
  return BigNumber(extendedAccount.sequence);
};

export const fetchSigners = async (a: Account) => {
  try {
    const extendedAccount = await getServer()
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

  const res = await getServer().submitTransaction(transaction, {
    skipMemoRequiredCheck: true,
  });
  return res.hash;
};

export const buildPaymentOperation = (
  destination: string,
  amount: BigNumber
) => {
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
) => {
  const formattedAmount = getFormattedAmount(amount);

  return StellarSdk.Operation.createAccount({
    destination: destination,
    startingBalance: formattedAmount,
  });
};

export const buildTransactionBuilder = (
  source: typeof StellarSdk.Account,
  fee: BigNumber
) => {
  const formattedFee = fee.toString();

  return new StellarSdk.TransactionBuilder(source, {
    fee: formattedFee,
    networkPassphrase: StellarSdk.Networks.PUBLIC,
  });
};

export const loadAccount = (addr: string) => {
  return getServer().loadAccount(addr);
};

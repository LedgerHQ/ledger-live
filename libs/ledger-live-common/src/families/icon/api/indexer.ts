import network from "@ledgerhq/live-network/network";
import IconService from "icon-sdk-js";
import { BigNumber } from "bignumber.js";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-env";
import { encodeOperationId } from "../../../operation";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { LIMIT } from "../constants";
import { isTestnet } from "../logic";
import { APITransaction } from "./api-type";

const { IconAmount } = IconService;
/**
 * Returns Testnet API URL if the current currency is testnet
 *
 * @param {currency} CryptoCurrency
 */
export function getApiUrl(currency: CryptoCurrency): string {
  let apiUrl = getEnv("ICON_INDEXER_ENDPOINT");
  if (isTestnet(currency)) {
    apiUrl = getEnv("ICON_TESTNET_INDEXER_ENDPOINT");
  }
  return apiUrl;
}

export const getAccountBalance = async (addr: string, url: string): Promise<string> => {
  try {
    const resp = await network({
      method: "GET",
      url: `${url}/addresses/details/${addr.toString()}?address=${addr.toString()}`,
    });
    const { data } = resp;
    const balance = data?.balance;
    return balance;
  } catch (error) {
    return "0";
  }
};

/**
 * Get account balances and nonce
 */
export const getAccount = async (addr: string, currency: CryptoCurrency) => {
  const url = getApiUrl(currency);
  const balance = await getAccountBalance(addr, url);
  const blockHeight = await getLatestBlockHeight(url);
  return {
    blockHeight: Number(blockHeight) || undefined,
    balance: new BigNumber(balance).decimalPlaces(2),
    nonce: 0,
  };
};
/**
 * Returns true if account is the signer
 */
function isSender(transaction: APITransaction, addr: string): boolean {
  return transaction.from_address === addr;
}

/**
 * Map transaction to an Operation Type
 */
function getOperationType(transaction: APITransaction, addr: string): OperationType {
  return isSender(transaction, addr) ? "OUT" : "IN";
}

/**
 * Map transaction to a correct Operation Value (affecting account balance)
 */
function getOperationValue(transaction: APITransaction, addr: string): BigNumber {
  return isSender(transaction, addr)
    ? new BigNumber(transaction.value_decimal ?? 0).plus(transaction.transaction_fee ?? 0)
    : new BigNumber(transaction.value_decimal ?? 0);
}

/**
 * Map the ICON history transaction to a Ledger Live Operation
 */
function transactionToOperation(
  accountId: string,
  addr: string,
  transaction: APITransaction,
): Operation {
  const type = getOperationType(transaction, addr);
  const iconUnit = IconAmount.Unit.ICX.toString();
  transaction.transaction_fee = new BigNumber(
    IconAmount.fromLoop((transaction.transaction_fee || 0).toString(), iconUnit),
  );
  return {
    id: encodeOperationId(accountId, transaction.hash ?? "", type),
    accountId,
    fee: transaction.transaction_fee,
    value: getOperationValue(transaction, addr),
    type,
    hash: transaction.hash ?? "",
    blockHash: null,
    blockHeight: transaction.block_number,
    date: new Date(transaction.block_timestamp ? transaction.block_timestamp / 1000 : 0),
    senders: [transaction.from_address ?? ""],
    recipients: transaction.to_address ? [transaction.to_address] : [],
    extra: {},
    transactionSequenceNumber: isSender(transaction, addr) ? transaction.nonce : undefined,
    hasFailed: transaction.status !== "0x1",
  };
}

/**
 * Fetch operation list
 */
export const getOperations = async (
  accountId: string,
  addr: string,
  skip: number,
  currency: CryptoCurrency,
): Promise<Operation[]> => {
  const url = getApiUrl(currency);
  const rawTransactions = await getHistory(addr, skip, url);
  if (!rawTransactions) return rawTransactions;
  return rawTransactions.map(transaction => transactionToOperation(accountId, addr, transaction));
};

export const getLatestBlockHeight = async (url: string): Promise<number> => {
  const resp = await network({
    method: "GET",
    url: `${url}/blocks`,
  });
  const { data } = resp;
  const blockHeight = data[0]?.number;

  return Number(blockHeight);
};

export const getHistory = async (addr: string, skip: number, url: string) => {
  const result = await network({
    method: "GET",
    url: `${url}/transactions/address/${addr}?address=${addr}&skip=${skip}&limit=${LIMIT}`,
  });
  const { data: respData } = result;
  if (!respData) {
    return [];
  }

  let allTransactions = [...respData];
  if (LIMIT == allTransactions.length) {
    while (LIMIT == allTransactions.length) {
      skip += LIMIT;
      const { data: res } = await network({
        method: "GET",
        url: `${url}/transactions/address/${addr}?address=${addr}&skip=${skip}&limit=${LIMIT}`,
      });

      allTransactions = [...allTransactions, ...(res || [])];
    }
  }

  return allTransactions;
};

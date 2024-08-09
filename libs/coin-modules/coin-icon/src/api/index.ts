import network from "@ledgerhq/live-network/network";
import { BigNumber } from "bignumber.js";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { LIMIT } from "../constants";
import { isTestnet } from "../logic";
import { AccountType, IconTransactionType } from "./api-type";
import { log } from "@ledgerhq/logs";
import { IconOperation } from "../types/index";
import querystring from "querystring";
import { getCoinConfig } from "../config";

/**
 * Returns Testnet API URL if the current network is testnet
 *
 * @param {network} network
 */
function getApiUrl(network: CryptoCurrency): string {
  const currencyConfig = getCoinConfig();
  let apiUrl = currencyConfig.infra.indexer;
  if (isTestnet(network)) {
    apiUrl = currencyConfig.infra.indexer_testnet;
  }
  return apiUrl;
}

async function fetch(url: string) {
  const { data } = await network({
    method: "GET",
    url,
  });

  if (data.Error) {
    log("icon-error", data.Error, {
      url,
    });
    throw new Error(data.Error);
  }

  return data;
}

export const getAccount = async (addr: string, network: CryptoCurrency): Promise<AccountType> => {
  const data = await fetch(`${getApiUrl(network)}/addresses/details/${addr}`);
  return data;
};

export const getCurrentBlockHeight = async (
  network: CryptoCurrency,
): Promise<number | undefined> => {
  const data = await fetch(`${getApiUrl(network)}/blocks`);
  return data?.[0].number;
};

/**
 * Returns true if account is the signer
 */
function isSender(transaction: IconTransactionType, addr: string): boolean {
  return transaction.from_address === addr;
}

/**
 * Map transaction to an Operation Type
 */
function getOperationType(transaction: IconTransactionType, addr: string): OperationType {
  return isSender(transaction, addr) ? "OUT" : "IN";
}

/**
 * Map transaction to a correct Operation Value (affecting account balance)
 */
function getOperationValue(transaction: IconTransactionType, addr: string): BigNumber {
  if (isSender(transaction, addr)) {
    return transaction.value
      ? new BigNumber(transaction.value).plus(transaction.transaction_fee)
      : new BigNumber(0);
  } else {
    return transaction.value ? new BigNumber(transaction.value) : new BigNumber(0);
  }
}

/**
 * Map the ICON history transaction to a Ledger Live Operation
 */
function txToOperation(
  accountId: string,
  addr: string,
  transaction: IconTransactionType,
): IconOperation {
  const type = getOperationType(transaction, addr);

  return {
    id: encodeOperationId(accountId, transaction.hash, type),
    accountId,
    fee: new BigNumber(transaction.transaction_fee),
    value: getOperationValue(transaction, addr),
    type,
    hash: transaction.hash,
    blockHash: null,
    blockHeight: transaction.block_number,
    date: new Date(transaction.block_timestamp / 1000),
    senders: [transaction.from_address],
    recipients: [transaction.to_address],
    extra: {},
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
  network: CryptoCurrency,
  maxLength: number,
): Promise<Operation[]> => {
  return await fetchOperationList(accountId, addr, skip, network, maxLength);
};

export const fetchOperationList = async (
  accountId: string,
  addr: string,
  skip: number,
  network: CryptoCurrency,
  maxLength: number,
  prevOperations: IconOperation[] = [],
): Promise<IconOperation[]> => {
  const data = await getTxHistory(addr, skip, network);
  const operations = data.map((transaction: IconTransactionType) =>
    txToOperation(accountId, addr, transaction),
  );

  const mergedOp = [...prevOperations, ...operations];
  if (operations.length < LIMIT || operations.length >= maxLength) {
    return mergedOp;
  }
  return await fetchOperationList(accountId, addr, skip + LIMIT, network, maxLength, mergedOp);
};

export const getTxHistory = async (
  addr: string,
  skip: number,
  network: CryptoCurrency,
  limit: number = LIMIT,
): Promise<IconTransactionType[]> => {
  const query = querystring.stringify({
    skip: skip,
    limit: limit,
  });

  const data = await fetch(`${getApiUrl(network)}/transactions/address/${addr}?${query}`);
  return data;
};

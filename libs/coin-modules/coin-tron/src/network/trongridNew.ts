/**
 * This file is a revamp of Trongrid network calls.
 * If a function is not implemented, either use the legacy one (`index.ts` fiel) or implement it please.
 */

import network from "@ledgerhq/live-network";
import { getCoinConfig } from "../config";
import { TrongridTxInfo } from "../types";
import { formatTrongridTxResponse } from "./format";
import { TransactionResponseTronAPI, TransactionTronAPI } from "./types";

const getBaseApiUrl = () => getCoinConfig().explorer.url;

export async function getTransactions(
  address: string,
  blockNumber: number,
): Promise<TrongridTxInfo[]> {
  const txs = await fetchTransactions(address, blockNumber);
  return txs.map(formatTrongridTxResponse).filter(tx => !!tx) as TrongridTxInfo[];
}

async function fetchTransactions(
  address: string,
  blockNumber: number,
  fingerprint?: string,
): Promise<TransactionTronAPI[]> {
  const { data, meta } = await fetch<TransactionResponseTronAPI<TransactionTronAPI>>(
    `v1/accounts/${address}/transactions`,
    {
      limit: 100, // max is 200
      // order_by: "block_timestamp,desc", // Default ordering (https://developers.tron.network/reference/get-transaction-info-by-account-address)
      fingerprint,
    },
  );

  // console.log("DEB:", data[data.length - 1]);
  if (data[data.length - 1].blockNumber! > blockNumber && meta.fingerprint) {
    return data.concat(await fetchTransactions(address, blockNumber, meta.fingerprint));
  } else {
    return data.filter(tx => tx.blockNumber! > blockNumber);
  }
}

async function fetch<T extends object = any>(
  path: string,
  params: unknown = undefined,
): Promise<T> {
  const { data } = await network<T>({ url: `${getBaseApiUrl()}/${path}`, params });

  // // Ugly but trongrid send a 200 status event if there are errors
  // if ("Error" in data) {
  //   log("tron-error", stringify(data.Error as any), {
  //     url,
  //   });
  //   throw new Error(stringify(data.Error as any));
  // }

  return data;
}

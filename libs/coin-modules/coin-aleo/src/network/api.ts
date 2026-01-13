import network from "@ledgerhq/live-network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { LiveNetworkResponse } from "@ledgerhq/live-network/network";
import aleoConfig from "../config";
import {
  AleoLatestBlockResponse,
  AleoPublicTransaction,
  AleoPublicTransactionDetails,
  AleoPublicTransactions,
} from "../types/api";

const getNodeUrl = (currency: CryptoCurrency): string => {
  return aleoConfig.getCoinConfig(currency).nodeUrl;
};

async function getLatestBlock(currency: CryptoCurrency): Promise<AleoLatestBlockResponse> {
  const res = await network<AleoLatestBlockResponse>({
    method: "GET",
    url: `${getNodeUrl(currency)}/blocks/latest`,
  });

  return res.data;
}

async function getAccountBalance(
  currency: CryptoCurrency,
  address: string,
): Promise<string | null> {
  const res = await network<string | null>({
    method: "GET",
    url: `${getNodeUrl(currency)}/programs/program/credits.aleo/mapping/account/${address}`,
  });

  return res.data;
}

async function getTranscationByTransactionId(
  currency: CryptoCurrency,
  transactionId: string,
): Promise<AleoPublicTransactionDetails> {
  const res = await network<AleoPublicTransactionDetails>({
    method: "GET",
    url: `${getNodeUrl(currency)}/transactions/${transactionId}`,
  });

  return res.data;
}

async function getAccountPublicTransactions({
  currency,
  address,
  minHeight,
  limit = 50,
  order = "desc",
  direction = "next",
}: {
  currency: CryptoCurrency;
  address: string;
  minHeight: number | null;
  limit?: number | undefined;
  order?: "asc" | "desc" | undefined;
  direction?: "prev" | "next" | undefined;
}): Promise<{ transactions: AleoPublicTransaction[] }> {
  const transactions: AleoPublicTransaction[] = [];

  const params = new URLSearchParams({
    limit: limit.toString(),
    order,
    direction,
  });

  if (minHeight) {
    params.append("cursor_block_number", minHeight.toString());
  }

  let nextPath: string | null = `/transactions/address/${address}?${params.toString()}`;

  while (nextPath) {
    const res: LiveNetworkResponse<AleoPublicTransactions> = await network({
      method: "GET",
      url: `${getNodeUrl(currency)}${nextPath}`,
    });

    const newTransactions = res.data.transactions;
    transactions.push(...newTransactions);

    const nextCursorBlockNumber = res.data.next_cursor?.block_number;

    if (nextCursorBlockNumber) {
      const updatedParams = new URLSearchParams(params);
      updatedParams.set("cursor_block_number", nextCursorBlockNumber.toString());
      nextPath = `/transactions/address/${address}?${updatedParams.toString()}`;
    } else break;
  }

  return { transactions };
}

export const apiClient = {
  getLatestBlock,
  getAccountBalance,
  getTranscationByTransactionId,
  getAccountPublicTransactions,
};

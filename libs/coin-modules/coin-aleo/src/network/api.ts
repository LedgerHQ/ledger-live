import network from "@ledgerhq/live-network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { LiveNetworkResponse } from "@ledgerhq/live-network/network";
import aleoConfig from "../config";
import { PROGRAM_ID } from "../constants";
import type {
  AleoLatestBlockResponse,
  AleoPublicTransactionDetailsResponse,
  AleoPublicTransactionsResponse,
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
    url: `${getNodeUrl(currency)}/programs/program/${PROGRAM_ID.CREDITS}/mapping/account/${address}`,
  });

  return res.data;
}

async function getTransactionById(
  currency: CryptoCurrency,
  transactionId: string,
): Promise<AleoPublicTransactionDetailsResponse> {
  const res = await network<AleoPublicTransactionDetailsResponse>({
    method: "GET",
    url: `${getNodeUrl(currency)}/transactions/${transactionId}`,
  });

  return res.data;
}

async function getAccountPublicTransactions({
  currency,
  address,
  cursor,
  limit = 50,
  order = "asc",
  direction = "next",
}: {
  currency: CryptoCurrency;
  address: string;
  cursor?: string;
  limit?: number;
  order?: "asc" | "desc";
  direction?: "prev" | "next";
}): Promise<AleoPublicTransactionsResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    sort: order,
    direction,
    ...(cursor && { cursor_block_number: cursor }),
  });

  const res: LiveNetworkResponse<AleoPublicTransactionsResponse> = await network({
    method: "GET",
    url: `${getNodeUrl(currency)}/transactions/address/${address}?${params.toString()}`,
  });

  return res.data;
}

export const apiClient = {
  getLatestBlock,
  getAccountBalance,
  getTransactionById,
  getAccountPublicTransactions,
};

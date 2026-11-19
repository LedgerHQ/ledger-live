import network from "@ledgerhq/live-network/network";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { getCoinConfig } from "../config";
import { LIMIT } from "../constants";
import { isTestnet } from "../logic";
import type { AccountType, IconTransactionType } from "./types";

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

export const getTxHistory = async (
  addr: string,
  skip: number,
  network: CryptoCurrency,
  limit: number = LIMIT,
): Promise<IconTransactionType[]> => {
  const query = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });

  const data = await fetch(`${getApiUrl(network)}/transactions/address/${addr}?${query}`);
  return data;
};

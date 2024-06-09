import network from "@ledgerhq/live-network";
import {
  FetchAccountBalanceResponse,
  FetchAccountTransactionsResponse,
  FetchNetworkStatusResponse,
} from "./types";
import { getCoinConfig } from "../../config";
import { addNetworkIdentifier, buildAccountIdentifier } from "./utils";

const getRosettaUrl = (route: string): string => {
  const currencyConfig = getCoinConfig();
  return `${currencyConfig.infra.API_MINA_ROSETTA_NODE}${route || ""}`;
};

export const fetchNetworkStatus = async () => {
  const { data } = await network<FetchNetworkStatusResponse>({
    method: "POST",
    url: getRosettaUrl("/network/status"),
    data: addNetworkIdentifier({}),
  });

  return data;
};

export const fetchAccountBalance = async (address: string) => {
  const { data } = await network<FetchAccountBalanceResponse>({
    method: "POST",
    url: getRosettaUrl("/account/balance"),
    data: addNetworkIdentifier(buildAccountIdentifier(address)),
  });

  return data;
};

export const fetchAccountTransactions = async (address: string) => {
  const { data } = await network<FetchAccountTransactionsResponse>({
    method: "POST",
    url: getRosettaUrl("/search/transactions"),
    data: addNetworkIdentifier(buildAccountIdentifier(address)),
  });

  return data;
};

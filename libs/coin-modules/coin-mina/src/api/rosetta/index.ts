import network from "@ledgerhq/live-network";
import {
  FetchAccountBalanceResponse,
  FetchAccountTransactionsResponse,
  FetchNetworkStatusResponse,
  RosettaBlockInfoResponse,
  RosettaMetadataResponse,
  RosettaPreprocessResponse,
  RosettaSubmitResponse,
} from "./types";
import { getCoinConfig } from "../../config";
import { addNetworkIdentifier, buildAccountIdentifier, makeTransferPayload } from "./utils";

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
    data: { ...addNetworkIdentifier(buildAccountIdentifier(address)), include_timestamp: true },
  });

  return data;
};

const rosettaPreprocess = async (from: string, to: string, feeNano: number, valueNano: number) => {
  const payload = makeTransferPayload(from, to, feeNano, valueNano);
  const { data } = await network<RosettaPreprocessResponse>({
    method: "POST",
    url: getRosettaUrl("/construction/preprocess"),
    data: addNetworkIdentifier(payload),
  });

  return data;
};

export const fetchTransactionMetadata = async (
  srcAddress: string,
  destAddress: string,
  feeNano: number,
  valueNano: number,
) => {
  const options = await rosettaPreprocess(srcAddress, destAddress, feeNano, valueNano);
  const payload = makeTransferPayload(srcAddress, destAddress, feeNano, valueNano);
  return await network<RosettaMetadataResponse>({
    method: "POST",
    url: getRosettaUrl("/construction/metadata"),
    data: addNetworkIdentifier({ ...payload, ...options }),
  });
};

export const rosettaSubmitTransaction = async (blob: string) => {
  return await network<RosettaSubmitResponse>({
    method: "POST",
    url: getRosettaUrl("/construction/submit"),
    data: addNetworkIdentifier({ signed_transaction: blob }),
  });
};

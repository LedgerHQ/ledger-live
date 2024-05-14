import { getCoinConfig } from "../../config";
import { MAX_TRANSACTIONS_PER_PAGE } from "../../consts";
import { makeNetworkRequest } from "../network";
import {
  FetchAccountBalanceResponse,
  FetchAccountTransactionsResponse,
  FetchNetworkStatusResponse,
  RosettaBlockInfoResponse,
  RosettaMetadataResponse,
  RosettaPreprocessResponse,
  RosettaSubmitResponse,
  RosettaTransaction,
} from "./types";
import { addNetworkIdentifier, buildAccountIdentifier, makeTransferPayload } from "./utils";

const getRosettaUrl = (route: string): string => {
  const currencyConfig = getCoinConfig();
  return `${currencyConfig.infra.API_MINA_ROSETTA_NODE}${route || ""}`;
};

export const fetchNetworkStatus = async () => {
  return await makeNetworkRequest<FetchNetworkStatusResponse>({
    method: "POST",
    url: getRosettaUrl("/network/status"),
    data: addNetworkIdentifier({}),
  });
};

export const fetchAccountBalance = async (address: string) => {
  return await makeNetworkRequest<FetchAccountBalanceResponse>({
    method: "POST",
    url: getRosettaUrl("/account/balance"),
    data: addNetworkIdentifier(buildAccountIdentifier(address)),
  });
};

export const fetchAccountTransactions = async (
  address: string,
  offset: number = 0,
): Promise<RosettaTransaction[]> => {
  const transactions: RosettaTransaction[] = [];
  let currentOffset: number | undefined = offset;
  while (currentOffset !== undefined) {
    const response: FetchAccountTransactionsResponse =
      await makeNetworkRequest<FetchAccountTransactionsResponse>({
        method: "POST",
        url: getRosettaUrl("/search/transactions"),
        data: {
          ...addNetworkIdentifier(buildAccountIdentifier(address)),
          offset: currentOffset,
          limit: MAX_TRANSACTIONS_PER_PAGE,
          include_timestamp: true,
        },
      });
    transactions.push(...response.transactions);

    currentOffset = response.next_offset;
  }

  return transactions;
};

export const rosettaGetBlockInfo = async (blockHeight: number) => {
  return await makeNetworkRequest<RosettaBlockInfoResponse>({
    method: "POST",
    url: getRosettaUrl("/block"),
    data: addNetworkIdentifier({ block_identifier: { index: blockHeight } }),
  });
};

const rosettaPreprocess = async (from: string, to: string, feeNano: number, valueNano: number) => {
  const payload = makeTransferPayload(from, to, feeNano, valueNano);
  return await makeNetworkRequest<RosettaPreprocessResponse>({
    method: "POST",
    url: getRosettaUrl("/construction/preprocess"),
    data: addNetworkIdentifier(payload),
  });
};

export const fetchTransactionMetadata = async (
  srcAddress: string,
  destAddress: string,
  feeNano: number,
  valueNano: number,
) => {
  const options = await rosettaPreprocess(srcAddress, destAddress, feeNano, valueNano);
  const payload = makeTransferPayload(srcAddress, destAddress, feeNano, valueNano);
  return await makeNetworkRequest<RosettaMetadataResponse>({
    method: "POST",
    url: getRosettaUrl("/construction/metadata"),
    data: addNetworkIdentifier({ ...payload, ...options }),
  });
};

export const rosettaSubmitTransaction = async (blob: string) => {
  return await makeNetworkRequest<RosettaSubmitResponse>({
    method: "POST",
    url: getRosettaUrl("/construction/submit"),
    data: addNetworkIdentifier({ signed_transaction: blob }),
  });
};

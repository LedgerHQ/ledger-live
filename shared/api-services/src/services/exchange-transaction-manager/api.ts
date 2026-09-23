import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import {
  EXCHANGE_TRANSACTION_MANAGER_REDUCER_PATH,
  HEADER_X_LEDGER_CLIENT_VERSION,
} from "./constants";
import { ExchangeTransactionManagerApiExtraSchema } from "./schema";
import type { ExchangeTransactionManagerApiExtra } from "./types";

export function exchangeTransactionManagerApiExtra(
  extra: ExchangeTransactionManagerApiExtra,
): ExchangeTransactionManagerApiExtra {
  return ExchangeTransactionManagerApiExtraSchema.parse(extra);
}

const exchangeTransactionManagerBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = (args, api, extraOptions) => {
  const extra = ExchangeTransactionManagerApiExtraSchema.parse(api.extra);

  return fetchBaseQuery({
    baseUrl: extra.exchangeTransactionManagerApiBaseUrl,
    prepareHeaders: headers => {
      headers.set("Content-Type", "application/json");
      headers.set(HEADER_X_LEDGER_CLIENT_VERSION, extra.ledgerClientVersion);
      return headers;
    },
  })(args, api, extraOptions);
};

export const exchangeTransactionManagerApi = createApi({
  reducerPath: EXCHANGE_TRANSACTION_MANAGER_REDUCER_PATH,
  baseQuery: exchangeTransactionManagerBaseQuery,
  tagTypes: [],
  endpoints: () => ({}),
});

export type ExchangeTransactionManagerApi = typeof exchangeTransactionManagerApi;

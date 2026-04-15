import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getEnv } from "@ledgerhq/live-env";

export enum BaanxTags {
  UserCard = "BaanxUserCard",
  UserWallets = "BaanxUserWallets",
  Loans = "BaanxLoans",
  StakingDeals = "BaanxStakingDeals",
  Settings = "BaanxSettings",
  Transactions = "BaanxTransactions",
}

interface AuthArg {
  accessToken: string;
}

function authHeaders(accessToken: string): Record<string, string> {
  return {
    authorization: accessToken,
    Accept: "application/json, text/plain, */*",
    "X-Request-Origin": "Standalone https://ledger-ui.baanx.co.uk",
    "X-Product-Version": "999",
    "X-Platform": "web",
    "X-product": "LEDGER",
  };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export const baanxApi = createApi({
  reducerPath: "baanxApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getEnv("BAANX_API_URL"),
  }),
  tagTypes: Object.values(BaanxTags),
  endpoints: build => ({
    getUserCard: build.query<unknown, AuthArg>({
      query: ({ accessToken }) => ({
        url: "/iframe/api/v2/user/card",
        headers: authHeaders(accessToken),
      }),
      providesTags: [BaanxTags.UserCard],
      keepUnusedDataFor: 120,
    }),

    getUserWallets: build.query<unknown, AuthArg>({
      query: ({ accessToken }) => ({
        url: "/iframe/api/v2/user/wallets",
        headers: authHeaders(accessToken),
      }),
      providesTags: [BaanxTags.UserWallets],
      keepUnusedDataFor: 60,
    }),

    getLoans: build.query<unknown, AuthArg>({
      query: ({ accessToken }) => ({
        url: "/iframe/api/v2/loans",
        headers: authHeaders(accessToken),
      }),
      providesTags: [BaanxTags.Loans],
      keepUnusedDataFor: 60,
    }),

    getStakingDeals: build.query<unknown, AuthArg>({
      query: ({ accessToken }) => ({
        url: "/iframe/api/v2/staking_deals",
        headers: authHeaders(accessToken),
      }),
      providesTags: [BaanxTags.StakingDeals],
      keepUnusedDataFor: 60,
    }),

    getSettings: build.query<unknown, AuthArg>({
      query: ({ accessToken }) => ({
        url: "/iframe/api/v2/new_settings",
        headers: authHeaders(accessToken),
      }),
      providesTags: [BaanxTags.Settings],
      keepUnusedDataFor: 300,
    }),

    getWalletTransactions: build.query<
      unknown,
      AuthArg & { address: string; coin: string; page?: number }
    >({
      query: ({ accessToken, address, coin, page }) => ({
        url: `/iframe/api/v2/user/wallet/address/${encodeURIComponent(address)}/${coin}/transactions/paginated`,
        params: { page: String(page ?? 0) },
        headers: authHeaders(accessToken),
      }),
      providesTags: [BaanxTags.Transactions],
      keepUnusedDataFor: 30,
    }),

    getCardBalance: build.query<unknown, AuthArg>({
      query: ({ accessToken }) => ({
        url: "/api/v1/card/monavate/balance",
        headers: authHeaders(accessToken),
      }),
      keepUnusedDataFor: 30,
    }),

    getCardTransactions: build.query<
      unknown,
      AuthArg & { pageNumber?: number; pageSize?: number; fromDate?: string; toDate?: string }
    >({
      query: ({ accessToken, pageNumber, pageSize, fromDate, toDate }) => ({
        url: "/api/v1/card/monavate/transactions",
        params: {
          pageNumber: String(pageNumber ?? 0),
          pageSize: String(pageSize ?? 50),
          includeDeclined: "1",
          from_date: fromDate ?? daysAgoISO(90),
          to_date: toDate ?? todayISO(),
        },
        headers: authHeaders(accessToken),
      }),
      providesTags: [BaanxTags.Transactions],
      keepUnusedDataFor: 30,
    }),

    getCardTransactionDetail: build.query<unknown, AuthArg & { transactionId: string }>({
      query: ({ accessToken, transactionId }) => ({
        url: `/iframe/api/v2/card/transaction/${encodeURIComponent(transactionId)}`,
        headers: authHeaders(accessToken),
      }),
      keepUnusedDataFor: 60,
    }),

    getCardTransactionFundingSources: build.query<unknown, AuthArg & { transactionId: string }>({
      query: ({ accessToken, transactionId }) => ({
        url: `/iframe/api/v2/card/transaction/${encodeURIComponent(transactionId)}/funding_sources`,
        headers: authHeaders(accessToken),
      }),
      keepUnusedDataFor: 60,
    }),

    getCheckPIN: build.query<unknown, AuthArg>({
      query: ({ accessToken }) => ({
        url: "/iframe/api/v2/card/monavate/checkPIN",
        headers: authHeaders(accessToken),
      }),
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetUserCardQuery,
  useGetUserWalletsQuery,
  useGetLoansQuery,
  useGetStakingDealsQuery,
  useGetSettingsQuery,
  useGetWalletTransactionsQuery,
  useGetCardBalanceQuery,
  useGetCardTransactionsQuery,
  useGetCardTransactionDetailQuery,
  useGetCardTransactionFundingSourcesQuery,
  useGetCheckPINQuery,
} = baanxApi;

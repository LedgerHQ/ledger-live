import type {
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from "@reduxjs/toolkit/query";
import { portfolioApi } from "@shared/api-services";
import type { ZodType } from "zod";
import {
  BalanceHistoryPageSchema,
  BalancePageSchema,
  PortfolioAccountSchema,
  PortfolioSchema,
  UpdatesPageSchema,
} from "./schema";
import type {
  AddAddressesParams,
  AddRegistrationsParams,
  BalanceHistoryPage,
  BalanceHistoryParams,
  BalancePage,
  Portfolio,
  PortfolioAccount,
  PortfolioParams,
  PortfolioReadParams,
  RemoveRegistrationsParams,
  UpdatesPage,
} from "./types";

/** Cache tags belong to the use case that owns the data — not to the shared service. */
export const PORTFOLIO_TAGS = ["Portfolio", "PortfolioBalance", "PortfolioUpdates"] as const;

const readParams = ({ portfolioId: _, ...query }: PortfolioReadParams) => query;

type PortfolioQueryResult = QueryReturnValue<unknown, FetchBaseQueryError, FetchBaseQueryMeta>;

/** What RTK passes as the fourth argument of `queryFn`: a result, or a promise of one. */
type PortfolioQuery = (
  args: string | FetchArgs,
) => PortfolioQueryResult | PromiseLike<PortfolioQueryResult>;

/** Keeps the HTTP status, the JSON the service sent, and the schema issues when validation fails. */
function parsed<Result, Arg>(schema: ZodType<Result>, toQuery: (arg: Arg) => string | FetchArgs) {
  return async (arg: Arg, _api: unknown, _extra: unknown, baseQuery: PortfolioQuery) => {
    const result = await baseQuery(toQuery(arg));
    if (result.error) return result;
    const checked = schema.safeParse(result.data);
    if (checked.success) return { data: checked.data, meta: result.meta };
    return {
      error: {
        status: result.meta?.response?.status ?? 200,
        data: result.data,
        issues: checked.error.issues,
      } as FetchBaseQueryError,
      meta: result.meta,
    };
  };
}

/**
 * Portfolio service endpoints, injected into the shared Portfolio service api. Every response is
 * validated against its zod schema, so a contract drift surfaces as an error rather than bad data.
 */
export const accountPortfolioApi = portfolioApi
  .enhanceEndpoints({ addTagTypes: PORTFOLIO_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      getPortfolio: build.query<Portfolio, PortfolioParams>({
        queryFn: parsed(
          PortfolioSchema,
          ({ portfolioId }: PortfolioParams) => `/v1/portfolio/${encodeURIComponent(portfolioId)}`,
        ),
        providesTags: ["Portfolio"],
      }),

      createPortfolio: build.mutation<Portfolio, PortfolioParams>({
        queryFn: parsed(PortfolioSchema, ({ portfolioId }: PortfolioParams) => ({
          url: `/v1/portfolio/${encodeURIComponent(portfolioId)}`,
          method: "PUT",
        })),
        invalidatesTags: ["Portfolio"],
      }),

      addRegistrations: build.mutation<Portfolio, AddRegistrationsParams>({
        queryFn: parsed(
          PortfolioSchema,
          ({ portfolioId, registrations }: AddRegistrationsParams) => ({
            url: `/v1/portfolio/${encodeURIComponent(portfolioId)}/registrations`,
            method: "POST",
            body: registrations,
          }),
        ),
        invalidatesTags: ["Portfolio", "PortfolioBalance", "PortfolioUpdates"],
      }),

      removeRegistrations: build.mutation<Portfolio, RemoveRegistrationsParams>({
        queryFn: parsed(
          PortfolioSchema,
          ({ portfolioId, registrationIds }: RemoveRegistrationsParams) => ({
            url: `/v1/portfolio/${encodeURIComponent(portfolioId)}/registrations`,
            method: "DELETE",
            body: registrationIds,
          }),
        ),
        invalidatesTags: ["Portfolio", "PortfolioBalance", "PortfolioUpdates"],
      }),

      addAddresses: build.mutation<PortfolioAccount, AddAddressesParams>({
        queryFn: parsed(
          PortfolioAccountSchema,
          ({ portfolioId, accountId, addresses }: AddAddressesParams) => ({
            url: `/v1/portfolio/${encodeURIComponent(portfolioId)}/accounts/${encodeURIComponent(accountId)}/addresses`,
            method: "POST",
            body: { type: "account", addresses },
          }),
        ),
        invalidatesTags: ["Portfolio", "PortfolioBalance", "PortfolioUpdates"],
      }),

      getUpdates: build.query<UpdatesPage, PortfolioReadParams>({
        queryFn: parsed(UpdatesPageSchema, (params: PortfolioReadParams) => ({
          url: `/v1/portfolio/${encodeURIComponent(params.portfolioId)}/updates`,
          params: readParams(params),
        })),
        providesTags: ["PortfolioUpdates"],
      }),

      getBalanceHistory: build.query<BalanceHistoryPage, BalanceHistoryParams>({
        queryFn: parsed(BalanceHistoryPageSchema, (params: BalanceHistoryParams) => ({
          url: `/v1/portfolio/${encodeURIComponent(params.portfolioId)}/balance/history`,
          params: readParams(params),
        })),
        providesTags: ["PortfolioBalance"],
      }),

      getBalance: build.query<BalancePage, PortfolioReadParams>({
        queryFn: parsed(BalancePageSchema, (params: PortfolioReadParams) => ({
          url: `/v1/portfolio/${encodeURIComponent(params.portfolioId)}/balance`,
          params: readParams(params),
        })),
        providesTags: ["PortfolioBalance"],
      }),
    }),
  });

export const {
  useGetPortfolioQuery,
  useLazyGetPortfolioQuery,
  useCreatePortfolioMutation,
  useAddRegistrationsMutation,
  useRemoveRegistrationsMutation,
  useAddAddressesMutation,
  useLazyGetUpdatesQuery,
  useLazyGetBalanceQuery,
  useLazyGetBalanceHistoryQuery,
} = accountPortfolioApi;

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

function queryWithoutPortfolioId({ portfolioId: _, ...query }: PortfolioReadParams) {
  return query;
}

type PortfolioQueryResult = QueryReturnValue<unknown, FetchBaseQueryError, FetchBaseQueryMeta>;

type PortfolioBaseQuery = (
  args: string | FetchArgs,
) => PortfolioQueryResult | PromiseLike<PortfolioQueryResult>;

/** Keeps the HTTP status, the JSON the service sent, and the schema issues when validation fails. */
function validatedQuery<Result, Argument>(
  schema: ZodType<Result>,
  buildRequest: (argument: Argument) => string | FetchArgs,
) {
  return async (
    argument: Argument,
    _queryApi: unknown,
    _extraOptions: unknown,
    baseQuery: PortfolioBaseQuery,
  ) => {
    const result = await baseQuery(buildRequest(argument));
    if (result.error) return result;
    const parsedResponse = schema.safeParse(result.data);
    // Keep the payload the service sent. The schema only checks the fields this package reads.
    if (parsedResponse.success) return { data: result.data as Result, meta: result.meta };
    const error: FetchBaseQueryError = {
      status: "CUSTOM_ERROR",
      error: "Response does not match the Portfolio schema",
      data: {
        httpStatus: result.meta?.response?.status,
        body: result.data,
        issues: parsedResponse.error.issues,
      },
    };
    return { error, meta: result.meta };
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
        queryFn: validatedQuery(
          PortfolioSchema,
          ({ portfolioId }: PortfolioParams) => `/v1/portfolio/${encodeURIComponent(portfolioId)}`,
        ),
        providesTags: ["Portfolio"],
      }),

      createPortfolio: build.mutation<Portfolio, PortfolioParams>({
        queryFn: validatedQuery(PortfolioSchema, ({ portfolioId }: PortfolioParams) => ({
          url: `/v1/portfolio/${encodeURIComponent(portfolioId)}`,
          method: "PUT",
        })),
        invalidatesTags: ["Portfolio"],
      }),

      addRegistrations: build.mutation<Portfolio, AddRegistrationsParams>({
        queryFn: validatedQuery(
          PortfolioSchema,
          ({ portfolioId, registrations }: AddRegistrationsParams) => ({
            url: `/v1/portfolio/${encodeURIComponent(portfolioId)}/registrations`,
            method: "POST",
            body: registrations,
          }),
        ),
        invalidatesTags: PORTFOLIO_TAGS,
      }),

      removeRegistrations: build.mutation<Portfolio, RemoveRegistrationsParams>({
        queryFn: validatedQuery(
          PortfolioSchema,
          ({ portfolioId, registrationIds }: RemoveRegistrationsParams) => ({
            url: `/v1/portfolio/${encodeURIComponent(portfolioId)}/registrations`,
            method: "DELETE",
            body: registrationIds,
          }),
        ),
        invalidatesTags: PORTFOLIO_TAGS,
      }),

      addAddresses: build.mutation<PortfolioAccount, AddAddressesParams>({
        queryFn: validatedQuery(
          PortfolioAccountSchema,
          ({ portfolioId, accountId, addresses }: AddAddressesParams) => ({
            url: `/v1/portfolio/${encodeURIComponent(portfolioId)}/accounts/${encodeURIComponent(accountId)}/addresses`,
            method: "POST",
            body: { type: "account", addresses },
          }),
        ),
        invalidatesTags: PORTFOLIO_TAGS,
      }),

      getUpdates: build.query<UpdatesPage, PortfolioReadParams>({
        queryFn: validatedQuery(UpdatesPageSchema, (params: PortfolioReadParams) => ({
          url: `/v1/portfolio/${encodeURIComponent(params.portfolioId)}/updates`,
          params: queryWithoutPortfolioId(params),
        })),
        providesTags: ["PortfolioUpdates"],
      }),

      getBalanceHistory: build.query<BalanceHistoryPage, BalanceHistoryParams>({
        queryFn: validatedQuery(BalanceHistoryPageSchema, (params: BalanceHistoryParams) => ({
          url: `/v1/portfolio/${encodeURIComponent(params.portfolioId)}/balance/history`,
          params: queryWithoutPortfolioId(params),
        })),
        providesTags: ["PortfolioBalance"],
      }),

      getBalance: build.query<BalancePage, PortfolioReadParams>({
        queryFn: validatedQuery(BalancePageSchema, (params: PortfolioReadParams) => ({
          url: `/v1/portfolio/${encodeURIComponent(params.portfolioId)}/balance`,
          params: queryWithoutPortfolioId(params),
        })),
        providesTags: ["PortfolioBalance"],
      }),
    }),
  });

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
import { planRegistrations } from "./registration/reconcile";
import type {
  AddAddressesParams,
  AddRegistrationsParams,
  BalanceGroup,
  BalanceHistoryPage,
  BalanceHistoryParams,
  BalancePage,
  BalanceSnapshot,
  BalanceSnapshotParams,
  Portfolio,
  PortfolioAccount,
  PortfolioParams,
  PortfolioReadParams,
  RemoveRegistrationsParams,
  SyncPortfolioParams,
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

type Parsed<Result> =
  | { data: Result; error?: undefined }
  | { data?: undefined; error: FetchBaseQueryError };

/** Keeps the HTTP status, the JSON the service sent, and the schema issues when validation fails. */
async function fetchParsed<Result>(
  baseQuery: PortfolioQuery,
  schema: ZodType<Result>,
  args: string | FetchArgs,
): Promise<Parsed<Result> & { meta?: FetchBaseQueryMeta }> {
  const result = await baseQuery(args);
  if (result.error) return { error: result.error, meta: result.meta };
  const checked = schema.safeParse(result.data);
  // Keep the payload the service sent. The schema only checks the fields this package reads.
  if (checked.success) return { data: result.data as Result, meta: result.meta };
  const error: FetchBaseQueryError = {
    status: "CUSTOM_ERROR",
    error: "Response does not match the Portfolio schema",
    data: {
      httpStatus: result.meta?.response?.status,
      body: result.data,
      issues: checked.error.issues,
    },
  };
  return { error, meta: result.meta };
}

function parsed<Result, Arg>(schema: ZodType<Result>, toQuery: (arg: Arg) => string | FetchArgs) {
  return (arg: Arg, _api: unknown, _extra: unknown, baseQuery: PortfolioQuery) =>
    fetchParsed(baseQuery, schema, toQuery(arg));
}

const portfolioPath = (portfolioId: string) => `/v1/portfolio/${encodeURIComponent(portfolioId)}`;

/** The service answers a second create with 409, or with a 500 naming its primary key. */
function isAlreadyExisting(error: FetchBaseQueryError): boolean {
  if (error.status === 409) return true;
  const text = typeof error.data === "string" ? error.data : JSON.stringify(error.data ?? "");
  return /already exists|portfolio_pkey/i.test(text);
}

async function readOrCreatePortfolio(
  baseQuery: PortfolioQuery,
  portfolioId: string,
): Promise<Parsed<Portfolio>> {
  const read = await fetchParsed(baseQuery, PortfolioSchema, portfolioPath(portfolioId));
  if (!read.error || read.error.status !== 404) return read;
  const created = await fetchParsed(baseQuery, PortfolioSchema, {
    url: portfolioPath(portfolioId),
    method: "PUT",
  });
  if (created.error && !isAlreadyExisting(created.error)) return created;
  return fetchParsed(baseQuery, PortfolioSchema, portfolioPath(portfolioId));
}

async function syncPortfolio(
  { portfolioId, registrations }: SyncPortfolioParams,
  _api: unknown,
  _extra: unknown,
  baseQuery: PortfolioQuery,
): Promise<Parsed<Portfolio>> {
  const read = await readOrCreatePortfolio(baseQuery, portfolioId);
  if (read.error) return read;
  let portfolio = read.data;
  const { toAdd, toRemove } = planRegistrations(portfolio.registrations ?? [], registrations);
  if (toRemove.length > 0) {
    const removed = await fetchParsed(baseQuery, PortfolioSchema, {
      url: `${portfolioPath(portfolioId)}/registrations`,
      method: "DELETE",
      body: toRemove,
    });
    if (removed.error) return removed;
    portfolio = removed.data;
  }
  if (toAdd.length > 0) {
    const added = await fetchParsed(baseQuery, PortfolioSchema, {
      url: `${portfolioPath(portfolioId)}/registrations`,
      method: "POST",
      body: toAdd,
    });
    if (added.error) return added;
    portfolio = added.data;
  }
  return { data: portfolio };
}

/** Beyond this, the snapshot is refused rather than returned short of some balances. */
export const MAX_BALANCE_PAGES = 50;
const BALANCE_PAGE_SIZE = 100;

async function readBalanceSnapshot(
  { portfolioId, currency }: BalanceSnapshotParams,
  _api: unknown,
  _extra: unknown,
  baseQuery: PortfolioQuery,
): Promise<Parsed<BalanceSnapshot>> {
  const items: BalanceGroup[] = [];
  const seenTokens = new Set<string>();
  let token: string | undefined;
  for (let page = 0; page < MAX_BALANCE_PAGES; page += 1) {
    const result = await fetchParsed(baseQuery, BalancePageSchema, {
      url: `${portfolioPath(portfolioId)}/balance`,
      params: { currency, size: BALANCE_PAGE_SIZE, token },
    });
    if (result.error) return result;
    items.push(...result.data.items);
    const next = result.data.nextToken;
    if (!next) return { data: { currency, items } };
    if (seenTokens.has(next)) break;
    seenTokens.add(next);
    token = next;
  }
  return {
    error: {
      status: "CUSTOM_ERROR",
      error: "Portfolio balance is incomplete: the service kept paginating",
      data: { pagesRead: seenTokens.size + 1 },
    },
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

      syncPortfolio: build.mutation<Portfolio, SyncPortfolioParams>({
        queryFn: syncPortfolio,
        invalidatesTags: ["Portfolio", "PortfolioBalance", "PortfolioUpdates"],
      }),

      getBalanceSnapshot: build.query<BalanceSnapshot, BalanceSnapshotParams>({
        queryFn: readBalanceSnapshot,
        providesTags: ["PortfolioBalance"],
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

import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { accountPortfolioApi, type PortfolioRegistration } from "@domain/api-account-portfolio";
import { cryptoAssetsApi } from "@domain/api-currency-token";
import { applyTokens, fetchTokens, type TokenLookup } from "../portfolioTokens";
import type { PortfolioAction, PortfolioRequest, PortfolioView } from "./types";
import { toBalanceView, toHistoryView, toPortfolioView, toUpdatesView } from "./viewMappers";

export type PortfolioDispatch = ThunkDispatch<unknown, unknown, UnknownAction>;

interface RunContext {
  readonly dispatch: PortfolioDispatch;
  readonly request: PortfolioRequest;
  /** The body, as `REQUESTS` built it. */
  readonly payload: unknown;
}

type Runner = (context: RunContext) => Promise<{ body: unknown; view: PortfolioView }>;

/** A real call per click, never served from the RTK Query cache. */
const QUERY = { forceRefetch: true, subscribe: false } as const;
const { endpoints } = accountPortfolioApi;

/** CAL, asked by network and contract address: it knows what the Portfolio service does not. */
const lookupToken =
  (dispatch: PortfolioDispatch): TokenLookup =>
  async (network, address) => {
    const token = await dispatch(
      cryptoAssetsApi.endpoints.findTokenByAddressInCurrency.initiate(
        { contract_address: address, network },
        { subscribe: false },
      ),
    ).unwrap();
    const decimals = token?.units[0]?.magnitude;
    return token && decimals !== undefined
      ? { calId: token.id, ticker: token.ticker, name: token.name, decimals }
      : undefined;
  };

/** Completes the tokens the service sent as bare contract addresses, which CAL can name. */
async function withResolvedTokens(
  dispatch: PortfolioDispatch,
  view: PortfolioView,
): Promise<PortfolioView> {
  const lookup = lookupToken(dispatch);
  if (view.kind === "balance") {
    const tokens = await fetchTokens(view.entries, lookup);
    return { ...view, entries: view.entries.map(entry => applyTokens(entry, tokens)) };
  }
  if (view.kind === "history") {
    const tokens = await fetchTokens(view.points, lookup);
    return { ...view, points: view.points.map(point => applyTokens(point, tokens)) };
  }
  if (view.kind === "updates") {
    const tokens = await fetchTokens(
      view.operations.flatMap(operation => operation.deltas),
      lookup,
    );
    return {
      ...view,
      operations: view.operations.map(operation => ({
        ...operation,
        deltas: operation.deltas.map(delta => applyTokens(delta, tokens)),
      })),
    };
  }
  return view;
}

const readParams = ({ portfolioId, currency, account, pageToken }: PortfolioRequest) => ({
  portfolioId,
  currency,
  account,
  token: pageToken || undefined,
});

/** One entry per action; each calls its endpoint and reduces the answer to what the tool shows. */
export const RUNNERS: Readonly<Record<PortfolioAction, Runner>> = {
  // Portfolio
  getPortfolio: async ({ dispatch, request }) => {
    const body = await dispatch(
      endpoints.getPortfolio.initiate({ portfolioId: request.portfolioId }, QUERY),
    ).unwrap();
    return { body, view: toPortfolioView(body) };
  },
  createPortfolio: async ({ dispatch, request }) => {
    const body = await dispatch(
      endpoints.createPortfolio.initiate({ portfolioId: request.portfolioId }),
    ).unwrap();
    return { body, view: toPortfolioView(body) };
  },
  registerAccounts: async ({ dispatch, request, payload }) => {
    const body = await dispatch(
      endpoints.addRegistrations.initiate({
        portfolioId: request.portfolioId,
        registrations: payload as PortfolioRegistration[],
      }),
    ).unwrap();
    return { body, view: toPortfolioView(body) };
  },
  removeRegistrations: async ({ dispatch, request }) => {
    const body = await dispatch(
      endpoints.removeRegistrations.initiate({
        portfolioId: request.portfolioId,
        registrationIds: [...(request.registrationIds ?? [])],
      }),
    ).unwrap();
    return { body, view: toPortfolioView(body) };
  },
  addAddresses: async ({ dispatch, request }) => {
    const body = await dispatch(
      endpoints.addAddresses.initiate({
        portfolioId: request.portfolioId,
        accountId: request.addressAccountId ?? "",
        addresses: [...(request.addresses ?? [])],
      }),
    ).unwrap();
    return { body, view: { kind: "account", ...body } };
  },

  // Read
  getBalance: async ({ dispatch, request }) => {
    const body = await dispatch(endpoints.getBalance.initiate(readParams(request), QUERY)).unwrap();
    const view = toBalanceView(body.items, Boolean(body.nextToken));
    return { body, view: await withResolvedTokens(dispatch, view) };
  },
  getBalanceHistory: async ({ dispatch, request }) => {
    const body = await dispatch(
      endpoints.getBalanceHistory.initiate(
        { ...readParams(request), range: toRange(request.range) },
        QUERY,
      ),
    ).unwrap();
    const view = toHistoryView(body.items, body.nextToken);
    return { body, view: await withResolvedTokens(dispatch, view) };
  },
  getUpdates: async ({ dispatch, request }) => {
    const body = await dispatch(endpoints.getUpdates.initiate(readParams(request), QUERY)).unwrap();
    const view = toUpdatesView(body.items, Boolean(body.nextToken));
    return { body, view: await withResolvedTokens(dispatch, view) };
  },
};

const RANGES = ["all", "day", "hour", "month", "week", "year"] as const;
/** The range typed in the tool, or none, which the service reads as `day`. */
function toRange(range: string | undefined) {
  return RANGES.find(candidate => candidate === range);
}

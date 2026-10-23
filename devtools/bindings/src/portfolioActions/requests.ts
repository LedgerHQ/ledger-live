import type { PortfolioAction, PortfolioRequest, PortfolioResult } from "./types";

type HttpMethod = "GET" | "PUT" | "POST" | "DELETE";

/** What a call sends: no network, so it can be shown before and after the call, and tested. */
interface RequestSpec {
  readonly method: HttpMethod;
  /** The route from the service root. */
  readonly path: (request: PortfolioRequest) => string;
  readonly query?: (request: PortfolioRequest) => Readonly<Record<string, string | undefined>>;
  /** The body. Throws a SyntaxError when a JSON field typed by hand is not JSON. */
  readonly body?: (request: PortfolioRequest) => unknown;
}

const enc = encodeURIComponent;
const portfolio = (r: PortfolioRequest) => `/v1/portfolio/${enc(r.portfolioId)}`;
const reads = (r: PortfolioRequest) => ({
  currency: r.currency,
  account: r.account,
  token: r.pageToken,
});

/** One entry per action, so supporting a route is adding its entry here and its runner. */
export const REQUESTS: Readonly<Record<PortfolioAction, RequestSpec>> = {
  // Portfolio
  getPortfolio: { method: "GET", path: portfolio },
  createPortfolio: { method: "PUT", path: portfolio },
  registerAccounts: {
    method: "POST",
    path: r => `${portfolio(r)}/registrations`,
    body: r => JSON.parse(r.registrationsJson ?? "[]"),
  },
  removeRegistrations: {
    method: "DELETE",
    path: r => `${portfolio(r)}/registrations`,
    body: r => r.registrationIds ?? [],
  },
  addAddresses: {
    method: "POST",
    path: r => `${portfolio(r)}/accounts/${enc(r.addressAccountId ?? "")}/addresses`,
    body: r => ({ type: "account", addresses: r.addresses ?? [] }),
  },

  // Read
  getBalance: { method: "GET", path: r => `${portfolio(r)}/balance`, query: reads },
  getBalanceHistory: {
    method: "GET",
    path: r => `${portfolio(r)}/balance/history`,
    query: r => ({ ...reads(r), range: r.range }),
  },
  getUpdates: { method: "GET", path: r => `${portfolio(r)}/updates`, query: reads },
};

/** The body of a call. Throws a SyntaxError when a JSON field typed by hand is not JSON. */
export const bodyOf = (request: PortfolioRequest): unknown =>
  REQUESTS[request.action].body?.(request);

/** What the call sends, for display; it mirrors the endpoints of `@domain/api-account-portfolio`. */
export function describeSent(
  serviceUrl: string,
  request: PortfolioRequest,
  body: unknown,
): PortfolioResult["sent"] {
  const spec = REQUESTS[request.action];
  const query = new URLSearchParams(
    Object.entries(spec.query?.(request) ?? {}).filter(
      (entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== "",
    ),
  ).toString();
  const base = serviceUrl.endsWith("/") ? serviceUrl.slice(0, -1) : serviceUrl;
  return {
    method: spec.method,
    url: `${base}${spec.path(request)}${query ? `?${query}` : ""}`,
    body,
  };
}

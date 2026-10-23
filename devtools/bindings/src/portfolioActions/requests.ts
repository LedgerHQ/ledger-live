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
const network = (r: PortfolioRequest) => `/v1/${enc(r.network ?? "")}`;
const reads = (r: PortfolioRequest) => ({ currency: r.currency, account: r.account });
const intentOf = (r: PortfolioRequest): unknown => JSON.parse(r.intentJson ?? "{}");

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

  // Network
  listNetworks: { method: "GET", path: () => "/v1/networks" },
  getLastBlock: { method: "GET", path: r => `${network(r)}/last-block` },
  getValidators: {
    method: "GET",
    path: r => `${network(r)}/validators`,
    query: r => ({ cursor: r.cursor }),
  },
  validateAddress: {
    method: "GET",
    path: r => `${network(r)}/validate-address`,
    query: r => ({ address: r.address }),
  },
  getNextSequence: {
    method: "GET",
    path: r => `${network(r)}/account/${enc(r.address ?? "")}/next-sequence`,
  },

  // Write
  estimateFee: {
    method: "POST",
    path: r => `${network(r)}/transaction/estimate`,
    body: r => ({ intent: intentOf(r) }),
  },
  encodeTransaction: {
    method: "POST",
    path: r => `${network(r)}/transaction/encode`,
    body: r => ({ intent: intentOf(r), customFees: r.customFees || undefined }),
  },
  combineTransaction: {
    method: "POST",
    path: r => `${network(r)}/transaction/combine`,
    body: r => ({
      rawTransaction: r.rawTransaction ?? "",
      signature: r.signature ?? "",
      pubkey: r.pubkey || undefined,
    }),
  },
  broadcastTransaction: {
    method: "POST",
    path: r => `${network(r)}/transaction/broadcast`,
    body: r => ({ signedTransaction: r.signedTransaction ?? "" }),
  },
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
  return {
    method: spec.method,
    url: `${serviceUrl.replace(/\/+$/, "")}${spec.path(request)}${query ? `?${query}` : ""}`,
    body,
  };
}

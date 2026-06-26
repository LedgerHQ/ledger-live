import { http, HttpResponse } from "msw";
import { type SetupServer, setupServer } from "msw/node";
import MultiversXApi from "../../api/apiCalls";

/**
 * MSW helpers for stubbing the MultiversX REST API in `.test.ts` files.
 * NOTE: return 4xx in error stubs to avoid `@ledgerhq/live-network` retries.
 */

export const TEST_API_ENDPOINT = "https://test-multiversx-api.example.com";
export const TEST_DELEGATION_ENDPOINT = "https://test-multiversx-delegation.example.com";

/** A real client wired to the fake endpoints; requests are intercepted by MSW. */
export function createTestApiClient(): MultiversXApi {
  return new MultiversXApi(TEST_API_ENDPOINT, TEST_DELEGATION_ENDPOINT);
}

type Ctx = { addr: string; url: URL; body?: unknown };
type Handler = (ctx: Ctx) => unknown;

/**
 * Per-route response callbacks. A callback may return:
 * - a plain value → serialized as a `200` JSON body, or
 * - an {@link HttpResponse} (e.g. from {@link errorResponse}) → returned as-is.
 * Routes left undefined are not registered, so hitting one surfaces as an
 * unhandled request (MSW is configured with `onUnhandledRequest: "error"`).
 */
export type MvxHandlers = {
  // main API
  account?: Handler; // GET /accounts/:addr
  tokensCount?: Handler; // GET /accounts/:addr/tokens/count
  tokens?: Handler; // GET /accounts/:addr/tokens
  transfers?: Handler; // GET /accounts/:addr/transfers
  transactionsCount?: Handler; // GET /accounts/:addr/transactions/count
  transactions?: Handler; // GET /accounts/:addr/transactions
  submit?: Handler; // POST /transaction/send
  networkConfig?: Handler; // GET /network/config
  blocks?: Handler; // GET /blocks
  // delegation API
  providers?: Handler; // GET /providers
  delegations?: Handler; // GET /accounts/:addr/delegations
};

function toResponse(value: unknown): Response {
  return value instanceof Response ? value : HttpResponse.json(value as never);
}

/** Convenience for error-path stubs. Uses a 4xx so live-network does not retry. */
export function errorResponse(status = 400, body: unknown = { error: "stubbed error" }): Response {
  return HttpResponse.json(body as never, { status });
}

export function mvxHandlers(handlers: MvxHandlers) {
  const A = TEST_API_ENDPOINT;
  const D = TEST_DELEGATION_ENDPOINT;
  const out = [];

  const get = (path: string, fn?: Handler) =>
    fn
      ? http.get(path, ({ request, params }) =>
          toResponse(fn({ addr: String(params.addr ?? ""), url: new URL(request.url) })),
        )
      : undefined;

  // main API — order the multi-segment routes before their prefixes is unnecessary
  // (MSW `:addr` matches a single segment), but count routes are declared first for clarity.
  const routes = [
    get(`${A}/accounts/:addr/tokens/count`, handlers.tokensCount),
    get(`${A}/accounts/:addr/tokens`, handlers.tokens),
    get(`${A}/accounts/:addr/transfers`, handlers.transfers),
    get(`${A}/accounts/:addr/transactions/count`, handlers.transactionsCount),
    get(`${A}/accounts/:addr/transactions`, handlers.transactions),
    get(`${A}/accounts/:addr`, handlers.account),
    get(`${A}/network/config`, handlers.networkConfig),
    get(`${A}/blocks`, handlers.blocks),
    handlers.submit
      ? http.post(`${A}/transaction/send`, async ({ request }) =>
          toResponse(
            handlers.submit!({ addr: "", url: new URL(request.url), body: await request.json() }),
          ),
        )
      : undefined,
    // delegation API
    get(`${D}/providers`, handlers.providers),
    get(`${D}/accounts/:addr/delegations`, handlers.delegations),
  ];

  for (const r of routes) if (r) out.push(r);
  return out;
}

export const server = setupServer() as unknown as SetupServer;

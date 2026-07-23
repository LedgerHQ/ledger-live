import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { FAKE_HGRAPH_URL, HBAR_USD_RATE, HEDERA } from "./fixtures";

const observer = { callCount: 0, queries: [] as string[] };

export function getHgraphObserver(): { callCount: number; queries: string[] } {
  return observer;
}

/**
 * Response shape is picked by matching the query text against a fixed set of shapes.
 * `ethereum_transaction` must stay non-empty — coin-hedera's invariant would throw otherwise.
 */
async function hgraphHandler(request: Request): Promise<Response> {
  const body = (await request.clone().json()) as { query?: string };
  const query = body.query ?? "";

  observer.callCount += 1;
  observer.queries.push(query);

  if (query.includes("erc_token_account")) {
    return HttpResponse.json({ data: { erc_token_account: [] } });
  }

  if (query.includes("erc_token_transfer")) {
    return HttpResponse.json({ data: { erc_token_transfer: [] } });
  }

  // LatestTransaction / ethereum_transaction — must never be empty.
  return HttpResponse.json({
    data: {
      ethereum_transaction: [{ consensus_timestamp: `${Date.now()}000000` }],
    },
  });
}

export function initMswHandlers(): () => void {
  observer.callCount = 0;
  observer.queries = [];

  const server = setupServer(
    http.post(FAKE_HGRAPH_URL, ({ request }) => hgraphHandler(request)),
    http.get("https://global.api.prd.ledger.com/cal/*", () => HttpResponse.json([])),
    http.get("https://nft.api.live.ledger.com/*", () => HttpResponse.json([])),
    http.get("https://earn.api.live.ledger.com/*", () => HttpResponse.json([])),
    // Must be a real number, not []: getCurrencyToUSDRate swallows failures and returns null
    // (coin-hedera network/utils.ts:218-220), which sends estimateFees down the DEFAULT_TINYBAR_FEE
    // fallback and makes HTS association fail the HEDERA_TOKEN_ASSOCIATION_MIN_USD check.
    // The key is inferCurrencyAPIID(currency) === currency.id (live-countervalues helpers.ts:17).
    http.get("https://countervalues.live.ledger.com/v3/spot/simple", () =>
      HttpResponse.json({ [HEDERA.id]: HBAR_USD_RATE }),
    ),
  );

  server.listen({
    onUnhandledRequest: req => {
      const { hostname } = new URL(req.url);
      // Real local mirror node (Solo) — let it through unmocked.
      if (["127.0.0.1", "localhost"].includes(hostname)) return;
      throw new Error(`Unhandled MSW request: ${req.method} ${req.url}`);
    },
  });

  return () => server.close();
}

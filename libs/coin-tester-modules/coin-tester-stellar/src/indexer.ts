import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

/**
 * Stellar's coin module talks to Horizon over HTTP directly via the
 * `@stellar/stellar-sdk` library — there is no extra indexer layer to mock.
 * The local Stellar Quickstart container exposes Horizon on 127.0.0.1:8000,
 * so the strategy is to let those requests pass through unchanged and only
 * intercept external Ledger services that would otherwise be contacted
 * during a sync (crypto-assets metadata, NFT challenges, etc.).
 *
 * The custom `onUnhandledRequest` handler below ensures every non-local network call is either
 * stubbed here or fails the test loudly — no silent hits on a real backend.
 */
export function initMswHandlers(): () => void {
  const server = setupServer(
    http.get("https://crypto-assets-service.api.ledger.com/*", () => HttpResponse.json([])),
    http.get("https://nft.api.live.ledger.com/*", () => HttpResponse.json([])),
    http.get("https://earn.api.live.ledger.com/*", () => HttpResponse.json([])),
    http.get("https://countervalues.live.ledger.com/*", () => HttpResponse.json([])),
  );

  server.listen({
    onUnhandledRequest: req => {
      const hostname = new URL(req.url).hostname;
      // Allow requests to the local Stellar Quickstart container.
      if (["127.0.0.1", "localhost"].includes(hostname)) return;
      throw new Error(`Unhandled MSW request: ${req.method} ${req.url}`);
    },
  });

  return () => server.close();
}

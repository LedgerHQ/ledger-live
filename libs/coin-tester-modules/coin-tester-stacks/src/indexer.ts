import { setupServer } from "msw/node";

/**
 * Clarinet's devnet bundles a real `stacks-blockchain-api` instance (+ Postgres) by default —
 * verified against `DevnetConfig`'s `disable_stacks_api`/`disable_postgres` fields in the
 * `clarinet` source (both default `false`), not assumed — serving the exact REST surface
 * `coin-stacks`'s `network/api.ts` expects (`/extended/v2/...`, `/v2/...`). So, unlike
 * `coin-tester-near`'s hand-rolled indexer (stubbing a hosted indexer no local node exposes),
 * this one only has to let requests to the local devnet through and fail loudly on anything else,
 * mirroring `coin-tester-vechain`'s `initMSW` — no response translation needed.
 */
export function initMSW(): () => void {
  const server = setupServer();
  server.listen({
    onUnhandledRequest: request => {
      const hostname = new URL(request.url).hostname;
      if (["127.0.0.1", "localhost"].includes(hostname)) return;
      throw new Error(`Unhandled MSW request: ${request.method} ${request.url}`);
    },
  });
  return () => server.close();
}

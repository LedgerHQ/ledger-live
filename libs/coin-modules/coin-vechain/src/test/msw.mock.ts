import { setupServer } from "msw/node";

// Test host that `msw-setup.ts` points `API_VECHAIN_THOREST` at, so MSW handlers intercept the exact
// URL the network layer builds. Shared, empty MSW server; each suite registers handlers via `server.use`.
export const TEST_VECHAIN_ENDPOINT = "https://vechain-test.ledger.com";
export const server = setupServer();

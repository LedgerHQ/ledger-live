import { setupServer } from "msw/node";

// Shared, empty MSW server; each suite registers handlers via `server.use`. The host matches
// TEST_STACKS_ENDPOINT, which `msw-setup.ts` installs as `API_STACKS_ENDPOINT` before any suite
// runs, so handlers intercept the exact URL `network/api.ts`'s `getStacksURL` builds.
export const TEST_STACKS_ENDPOINT = "https://stacks.test.invalid";
export const server = setupServer();

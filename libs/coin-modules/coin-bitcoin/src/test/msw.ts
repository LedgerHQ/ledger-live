import axios from "axios";
import { setupServer } from "msw/node";

// wallet-btc's explorer issues HTTP through @ledgerhq/live-network, which uses axios's Node `http`
// adapter. @mswjs/interceptors cannot parse those requests (it throws "Invalid URL"), so MSW never
// intercepts them. Routing axios through its `fetch` adapter — which MSW intercepts correctly —
// makes the wire-level MSW suites work. Test-only: production keeps axios's default adapter.
axios.defaults.adapter = "fetch";

/**
 * Shared, empty MSW server for the coin-bitcoin wire-level (`.test.ts`) suites. Each suite owns its
 * lifecycle (`server.listen` / `resetHandlers` / `close`) and registers handlers via `server.use(...)`,
 * mirroring the coin-kaspa `test/msw.mock.ts` convention. Importing this module also installs the
 * axios fetch-adapter fix above.
 */
export const server = setupServer();

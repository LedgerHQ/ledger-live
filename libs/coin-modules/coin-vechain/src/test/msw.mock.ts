import { setupServer } from "msw/node";

// Shared, empty MSW server; each suite registers handlers via `server.use`. The host matches the
// node URL the test coin config installs, so handlers intercept the exact URL the network builds.
export { TEST_VECHAIN_ENDPOINT } from "./constants";
export const server = setupServer();

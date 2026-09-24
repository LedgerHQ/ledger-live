import { setupServer } from "msw/node";

export { TEST_STACKS_ENDPOINT } from "./context";

// Shared, empty MSW server; each suite registers handlers via `server.use`.
export const server = setupServer();

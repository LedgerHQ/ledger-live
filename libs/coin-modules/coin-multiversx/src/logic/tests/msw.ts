// Shared MSW (mock service worker) setup for logic tests that exercise the real
// MultiversXNetworkApi client (URL construction, response parsing, pagination)
// against mocked HTTP responses. Complements the .unit.test.ts files, which mock
// the network client away, and the .integ.test.ts files, which hit live endpoints.
import { setupServer } from "msw/node";
import { createNetworkApi, type MultiversXNetworkApi } from "../../network/api";

export const TEST_API = "https://test-api.multiversx.local";
export const TEST_DELEGATION_API = "https://test-delegation.multiversx.local";

export const server = setupServer();

/** Wire the MSW server lifecycle into a describe block. */
export function useMswServer(): void {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}

/** A MultiversXNetworkApi pointed at the mocked endpoints. */
export function testNetworkApi(): MultiversXNetworkApi {
  return createNetworkApi(TEST_API, TEST_DELEGATION_API);
}

import { getSequence } from "./getSequence";
import { createTestApiClient, errorResponse, mvxHandlers, server } from "./helpers/msw-http.mock";

const api = createTestApiClient();
const ADDRESS = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getSequence (MSW integration)", () => {
  it("returns the account nonce as a bigint", async () => {
    server.use(...mvxHandlers({ account: () => ({ balance: "0", nonce: 7, isGuarded: false }) }));

    await expect(getSequence(api, ADDRESS)).resolves.toBe(7n);
  });

  it("returns 0n for a fresh account", async () => {
    server.use(...mvxHandlers({ account: () => ({ balance: "0", nonce: 0, isGuarded: false }) }));

    await expect(getSequence(api, ADDRESS)).resolves.toBe(0n);
  });

  it("wraps HTTP errors from the accounts endpoint", async () => {
    server.use(...mvxHandlers({ account: () => errorResponse(404) }));

    await expect(getSequence(api, ADDRESS)).rejects.toThrow(`Failed to fetch account ${ADDRESS}`);
  });

  it("throws for an invalid address without hitting the network", async () => {
    await expect(getSequence(api, "nope")).rejects.toThrow(/Invalid MultiversX address/);
  });
});

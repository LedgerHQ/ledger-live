import { server, rpcHandler, createTestChainApi } from "./helpers/msw-rpc.mock";
import { getNextSequence } from "../getNextSequence";

const api = createTestChainApi();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getNextSequence (MSW)", () => {
  it("should return the current slot from RPC as bigint", async () => {
    server.use(
      rpcHandler({
        getSlot: () => 350_000_000,
      }),
    );

    const result = await getNextSequence(api, "someAddress");

    expect(result).toBe(350_000_000n);
  });
});

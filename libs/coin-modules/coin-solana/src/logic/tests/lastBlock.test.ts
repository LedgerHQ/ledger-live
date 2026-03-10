import { lastBlock } from "../lastBlock";
import { server, rpcHandler, createTestChainApi } from "./helpers/msw-rpc";

const TEST_BLOCKHASH = "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3";

const api = createTestChainApi();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("lastBlock (MSW integration)", () => {
  it("should return block info with height, hash, and time from RPC", async () => {
    const blockTime = 1700000000;
    server.use(
      rpcHandler({
        getLatestBlockhash: () => ({
          context: { slot: 250000000 },
          value: {
            blockhash: TEST_BLOCKHASH,
            lastValidBlockHeight: 280064048,
          },
        }),
        getSlot: () => 250000000,
        getBlockTime: () => blockTime,
      }),
    );

    const result = await lastBlock(api);

    expect(result).toEqual({
      height: 250000000,
      hash: TEST_BLOCKHASH,
      time: new Date(blockTime * 1000),
    });
  });

  it("should fallback to current date when blockTime is null", async () => {
    server.use(
      rpcHandler({
        getLatestBlockhash: () => ({
          context: { slot: 100 },
          value: { blockhash: TEST_BLOCKHASH, lastValidBlockHeight: 200 },
        }),
        getSlot: () => 100,
        getBlockTime: () => null,
      }),
    );

    const before = Date.now();
    const result = await lastBlock(api);
    const after = Date.now();

    expect(result.height).toBe(100);
    expect(result.hash).toBe(TEST_BLOCKHASH);
    expect(result.time.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.time.getTime()).toBeLessThanOrEqual(after);
  });
});

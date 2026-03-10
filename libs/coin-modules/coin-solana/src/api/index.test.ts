import { server, rpcHandler, TEST_ENDPOINT } from "../logic/tests/helpers/msw-rpc";
import { createApi } from "./index";

const TEST_ADDRESS = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const TEST_BLOCKHASH = "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3";

const api = createApi({
  endpoint: TEST_ENDPOINT,
  token2022Enabled: false,
  legacyOCMSMaxVersion: "1.0.0",
});

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getBalance (integration)", () => {
  it("should fetch balance and rent exemption from RPC", async () => {
    server.use(
      rpcHandler({
        getBalance: () => ({ context: { slot: 100 }, value: 2_000_000_000 }),
        getMinimumBalanceForRentExemption: () => 890880,
        getTokenAccountsByOwner: () => ({ context: { slot: 100 }, value: [] }),
      }),
    );

    const result = await api.getBalance(TEST_ADDRESS);

    expect(result).toEqual([
      {
        value: BigInt(2_000_000_000),
        asset: { type: "native" },
        locked: BigInt(890880),
      },
    ]);
  });
});

describe("lastBlock (integration)", () => {
  it("should fetch latest block info from RPC", async () => {
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

    const result = await api.lastBlock();

    expect(result.hash).toBe(TEST_BLOCKHASH);
    expect(result.height).toBe(250000000);
    expect(result.time).toEqual(new Date(blockTime * 1000));
  });
});

describe("listOperations (integration)", () => {
  it("should return empty page when no signatures found", async () => {
    server.use(
      rpcHandler({
        getSignaturesForAddress: () => [],
      }),
    );

    const result = await api.listOperations(TEST_ADDRESS, { minHeight: 0, order: "desc" });

    expect(result.items).toEqual([]);
    expect(result.next).toBeUndefined();
  });
});

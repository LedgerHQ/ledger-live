import { getBalance } from "./getBalance";
import { createTestApiClient, errorResponse, mvxHandlers, server } from "./helpers/msw-http.mock";

const api = createTestApiClient();
const ADDRESS = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getBalance (MSW integration)", () => {
  it("returns the native EGLD balance first from the accounts endpoint", async () => {
    server.use(
      ...mvxHandlers({
        account: () => ({ balance: "1500000000000000000", nonce: 5, isGuarded: false }),
        tokensCount: () => 0,
      }),
    );

    const result = await getBalance(api, ADDRESS);

    expect(result).toEqual([{ value: 1_500_000_000_000_000_000n, asset: { type: "native" } }]);
  });

  it("appends ESDT token balances after the native balance", async () => {
    server.use(
      ...mvxHandlers({
        account: () => ({ balance: "1000000000000000000", nonce: 10, isGuarded: false }),
        tokensCount: () => 2,
        tokens: () => [
          { identifier: "USDC-c76f1f", name: "WrappedUSDC", balance: "5000000" },
          { identifier: "MEX-455c57", name: "MEX", balance: "10000000000000000000" },
        ],
      }),
    );

    const result = await getBalance(api, ADDRESS);

    expect(result).toEqual([
      { value: 1_000_000_000_000_000_000n, asset: { type: "native" } },
      {
        value: 5_000_000n,
        asset: { type: "esdt", assetReference: "USDC-c76f1f", name: "WrappedUSDC" },
      },
      {
        value: 10_000_000_000_000_000_000n,
        asset: { type: "esdt", assetReference: "MEX-455c57", name: "MEX" },
      },
    ]);
  });

  it("returns a single zero native balance for an empty account (FR4)", async () => {
    server.use(
      ...mvxHandlers({
        account: () => ({ balance: "0", nonce: 0, isGuarded: false }),
        tokensCount: () => 0,
      }),
    );

    const result = await getBalance(api, ADDRESS);

    expect(result).toEqual([{ value: 0n, asset: { type: "native" } }]);
  });

  it("wraps HTTP errors from the accounts endpoint", async () => {
    server.use(
      ...mvxHandlers({
        account: () => errorResponse(404),
        tokensCount: () => 0,
      }),
    );

    await expect(getBalance(api, ADDRESS)).rejects.toThrow(`Failed to fetch account ${ADDRESS}`);
  });

  it("throws for an invalid address without hitting the network", async () => {
    await expect(getBalance(api, "not-a-valid-address")).rejects.toThrow(
      /Invalid MultiversX address/,
    );
  });
});

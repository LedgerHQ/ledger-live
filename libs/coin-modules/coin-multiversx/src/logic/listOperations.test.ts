import { listOperations } from "./listOperations";
import { createTestApiClient, mvxHandlers, server } from "./helpers/msw-http.mock";

const api = createTestApiClient();
const ADDRESS = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
const OTHER = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("listOperations (MSW integration)", () => {
  it("maps an incoming native transfer from the /transfers endpoint to an IN operation", async () => {
    server.use(
      ...mvxHandlers({
        transfers: () => [
          {
            txHash: "hash-in",
            sender: OTHER,
            receiver: ADDRESS,
            value: "5000000000000000000",
            fee: "50000000000000",
            round: 12345,
            timestamp: 1_700_000_000,
            status: "success",
            type: "Transaction",
          },
        ],
      }),
    );

    const { items, next } = await listOperations(api, ADDRESS, { limit: 10, minHeight: 0 });

    expect(next).toBeUndefined();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "hash-in",
      type: "IN",
      value: 5_000_000_000_000_000_000n,
      asset: { type: "native" },
      senders: [OTHER],
      recipients: [ADDRESS],
    });
  });

  it("enriches an ESDT transfer from action.arguments.transfers", async () => {
    server.use(
      ...mvxHandlers({
        transfers: () => [
          {
            txHash: "hash-esdt",
            sender: OTHER,
            receiver: ADDRESS,
            value: "0",
            round: 999,
            timestamp: 1_700_000_100,
            status: "success",
            type: "Transaction",
            action: {
              category: "esdtNft",
              name: "transfer",
              arguments: { transfers: [{ token: "USDC-c76f1f", value: "1000000" }] },
            },
          },
        ],
      }),
    );

    const { items } = await listOperations(api, ADDRESS, { limit: 10, minHeight: 0 });

    expect(items[0].asset).toEqual({ type: "esdt", assetReference: "USDC-c76f1f" });
    expect(items[0].value).toBe(1_000_000n);
  });

  it("excludes SmartContractResult entries from the operation set", async () => {
    server.use(
      ...mvxHandlers({
        transfers: () => [
          {
            txHash: "scr-1",
            sender: OTHER,
            receiver: ADDRESS,
            value: "1",
            timestamp: 1_700_000_200,
            type: "SmartContractResult",
          },
        ],
      }),
    );

    const { items } = await listOperations(api, ADDRESS, { limit: 10, minHeight: 0 });

    expect(items).toEqual([]);
  });

  it("throws for an invalid address without hitting the network", async () => {
    await expect(listOperations(api, "nope", { limit: 10, minHeight: 0 })).rejects.toThrow(
      /Invalid MultiversX address/,
    );
  });
});

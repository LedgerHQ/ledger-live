import { broadcast } from "../broadcast";
import { server, rpcHandler, createTestChainApi } from "./helpers/msw-rpc";

const api = createTestChainApi();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("broadcast (MSW integration)", () => {
  it("should propagate sendTransaction RPC errors through the chain", async () => {
    server.use(
      rpcHandler({
        sendTransaction: () => {
          throw new Error("Transaction simulation failed");
        },
        getLatestBlockhash: () => ({
          context: { slot: 100 },
          value: {
            blockhash: "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3",
            lastValidBlockHeight: 280064048,
          },
        }),
      }),
    );

    const dummyTxBase64 = Buffer.from("dummy-tx-bytes").toString("base64");
    await expect(broadcast(api, dummyTxBase64)).rejects.toThrow();
  });
});

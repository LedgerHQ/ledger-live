import { broadcast } from "../broadcast";
import { server, rpcHandler, createTestChainApi } from "./helpers/msw-rpc.mock";

const api = createTestChainApi();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("broadcast (MSW integration)", () => {
  it("should send the base64-decoded transaction to the sendTransaction RPC method", async () => {
    let capturedTxParam: unknown;

    server.use(
      rpcHandler({
        sendTransaction: params => {
          capturedTxParam = params[0];
          throw new Error("short-circuit after capture");
        },
      }),
    );

    const originalBytes = Buffer.from("real-transaction-bytes");
    const txBase64 = originalBytes.toString("base64");

    await expect(broadcast(api, txBase64)).rejects.toThrow();

    expect(capturedTxParam).toBe(txBase64);
  });

  it("should propagate the RPC error message when sendTransaction fails", async () => {
    server.use(
      rpcHandler({
        sendTransaction: () => {
          throw new Error("Transaction simulation failed: insufficient lamports");
        },
      }),
    );

    const dummyTxBase64 = Buffer.from("dummy-tx-bytes").toString("base64");

    await expect(broadcast(api, dummyTxBase64)).rejects.toThrow(/insufficient lamports/);
  });

  it("should reject when block height is exceeded during confirmation", async () => {
    server.use(
      rpcHandler({
        sendTransaction: () => "5xFakeSignatureABCDEF123456789",
        getLatestBlockhash: () => ({
          context: { slot: 100 },
          value: {
            blockhash: "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3",
            lastValidBlockHeight: 100,
          },
        }),
        getBlockHeight: () => 200,
      }),
    );

    const dummyTxBase64 = Buffer.from("dummy-tx-bytes").toString("base64");

    await expect(broadcast(api, dummyTxBase64)).rejects.toThrow();
  });
});

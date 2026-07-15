import {
  Keypair,
  MessageV0,
  PublicKey,
  SystemProgram,
  VersionedTransaction,
} from "@solana/web3.js";
import { broadcast } from "../broadcast";
import { createTestChainApi, rpcHandler, server } from "./helpers/msw-rpc.mock";

const api = createTestChainApi();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function buildSignedTxBase64(): string {
  const payer = Keypair.generate();
  const message = MessageV0.compile({
    payerKey: payer.publicKey,
    recentBlockhash: "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3",
    instructions: [
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: PublicKey.default,
        lamports: 1,
      }),
    ],
  });
  const tx = new VersionedTransaction(message);
  tx.sign([payer]);
  return Buffer.from(tx.serialize()).toString("base64");
}

const simulateOk = () => ({
  context: { slot: 0 },
  value: {
    err: null,
    logs: [],
    accounts: null,
    unitsConsumed: 0,
    returnData: null,
  },
});

describe("broadcast (MSW integration)", () => {
  it("should send the base64-decoded transaction to the sendTransaction RPC method", async () => {
    let capturedTxParam: unknown;
    const txBase64 = buildSignedTxBase64();

    server.use(
      rpcHandler({
        simulateTransaction: simulateOk,
        sendTransaction: params => {
          capturedTxParam = params[0];
          throw new Error("short-circuit after capture");
        },
      }),
    );

    await expect(broadcast(api, txBase64)).rejects.toThrow();

    expect(capturedTxParam).toBe(txBase64);
  });

  it("should propagate the RPC error message when sendTransaction fails", async () => {
    const txBase64 = buildSignedTxBase64();

    server.use(
      rpcHandler({
        simulateTransaction: simulateOk,
        sendTransaction: () => {
          throw new Error("Transaction simulation failed: insufficient lamports");
        },
      }),
    );

    await expect(broadcast(api, txBase64)).rejects.toThrow(/insufficient lamports/);
  });

  it("should reject when block height is exceeded during confirmation", async () => {
    const txBase64 = buildSignedTxBase64();

    server.use(
      rpcHandler({
        simulateTransaction: simulateOk,
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

    await expect(broadcast(api, txBase64)).rejects.toThrow();
  });
});

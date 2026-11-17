import {
  Keypair,
  MessageV0,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { SolanaTxBlockhashExpired } from "../../errors";
import { broadcast } from "../broadcast";
import { createTestChainApi, rpcHandler, server } from "./helpers/msw-rpc.mock";

const api = createTestChainApi();
const RECENT_BLOCKHASH = "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function buildSignedTxBase64(): string {
  const payer = Keypair.generate();
  const message = MessageV0.compile({
    payerKey: payer.publicKey,
    recentBlockhash: RECENT_BLOCKHASH,
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

// The real layout of a durable-nonce transaction: AdvanceNonceAccount first, the nonce value as blockhash.
function buildDurableNonceTxBase64(): string {
  const payer = Keypair.generate();
  const tx = new Transaction({
    feePayer: payer.publicKey,
    nonceInfo: {
      nonce: RECENT_BLOCKHASH,
      nonceInstruction: SystemProgram.nonceAdvance({
        noncePubkey: Keypair.generate().publicKey,
        authorizedPubkey: payer.publicKey,
      }),
    },
  }).add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: PublicKey.default,
      lamports: 1,
    }),
  );
  tx.sign(payer);
  return tx.serialize().toString("base64");
}

const blockhashValid = () => ({ context: { slot: 0 }, value: true });

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

const simulateBlockhashNotFound = () => ({
  context: { slot: 0 },
  value: {
    err: "BlockhashNotFound",
    logs: [],
    accounts: null,
    unitsConsumed: 0,
    returnData: null,
  },
});

describe("broadcast (MSW integration)", () => {
  it("asks the node whether the blockhash is still valid at processed commitment, and does not simulate an expired one", async () => {
    let capturedParams: unknown[] = [];
    let simulations = 0;

    server.use(
      rpcHandler({
        simulateTransaction: () => {
          simulations += 1;
          return simulateBlockhashNotFound();
        },
        isBlockhashValid: params => {
          capturedParams = params;
          return { context: { slot: 0 }, value: false };
        },
      }),
    );

    await expect(broadcast(api, buildSignedTxBase64())).rejects.toThrow(SolanaTxBlockhashExpired);
    expect(simulations).toBe(0);
    expect(capturedParams).toEqual([RECENT_BLOCKHASH, { commitment: "processed" }]);
  });

  it("does not ask about the blockhash of a durable-nonce transaction, and simulates it", async () => {
    let checks = 0;
    let simulations = 0;

    server.use(
      rpcHandler({
        isBlockhashValid: () => {
          checks += 1;
          return { context: { slot: 0 }, value: false };
        },
        simulateTransaction: () => {
          simulations += 1;
          return simulateOk();
        },
        sendTransaction: () => {
          throw new Error("short-circuit after the simulation");
        },
      }),
    );

    await expect(broadcast(api, buildDurableNonceTxBase64())).rejects.toThrow(/short-circuit/);
    expect(checks).toBe(0);
    expect(simulations).toBe(1);
  });

  it("should send the base64-decoded transaction to the sendTransaction RPC method", async () => {
    let capturedTxParam: unknown;
    const txBase64 = buildSignedTxBase64();

    server.use(
      rpcHandler({
        isBlockhashValid: blockhashValid,
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
        isBlockhashValid: blockhashValid,
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
        isBlockhashValid: blockhashValid,
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

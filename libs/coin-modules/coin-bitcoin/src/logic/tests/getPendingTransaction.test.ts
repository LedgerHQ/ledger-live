import { Transaction, payments } from "bitcoinjs-lib";
import { http, HttpResponse } from "msw";
import { getPendingTransaction } from "../getPendingTransaction";
import {
  explorerUrl,
  makeTx,
  notFound,
  server,
  testContext,
  txHexHandler,
  useMswServer,
} from "./helpers/msw";
import { ADDRESSES, fundingTransaction } from "./helpers/keys";

useMswServer();

const ME = "bc1qhh568mfmwu7ymvwhu5e4mttpfg4ehxfpvhjs64";
const OTHER = "1C6XJtNXiuXvk4oUAVMkKF57CRpaTrN5Ra";
const SEEN_AT = "2026-04-09T15:31:22Z";
const HASH = "11".repeat(32);
const SPENT_TXID = "AA".repeat(32);

const pending = makeTx(HASH, {
  fees: "500",
  received_at: SEEN_AT,
  inputs: [
    { address: ME, value: "12000", output_tx_id: SPENT_TXID, output_index: 0 },
    { address: ME, value: "8000", output_hash: "bb".repeat(32), output_index: 2 },
  ],
  outputs: [
    { address: OTHER, value: "10000", output_index: 0 },
    { address: ME, value: "9500", output_index: 1 },
  ],
});

const txHandler = (hash: string, body: unknown) =>
  http.get(`${explorerUrl()}/tx/${hash}`, () => HttpResponse.json(body as never));

// A real serialized transaction, with its own virtual size.
const funding = fundingTransaction(
  payments.p2wpkh({ address: ADDRESSES.nativeSegwit }).output!,
  1000,
);
const HEX = funding.toHex();

describe("getPendingTransaction", () => {
  it("maps a pending transaction as getBlock does, dated at the first sighting, with its inputs and vsize", async () => {
    server.use(txHandler(HASH, pending), txHexHandler(HASH, HEX));
    const transaction = await getPendingTransaction(testContext(), "bitcoin", HASH);
    expect(transaction).toEqual({
      hash: HASH,
      fees: 500n,
      feesPayer: ME,
      operations: [
        { type: "transfer", address: ME, asset: { type: "native" }, amount: -10000n },
        { type: "transfer", address: OTHER, asset: { type: "native" }, amount: 10000n },
      ],
      date: new Date(SEEN_AT),
      details: {
        inputs: [
          { id: `${"aa".repeat(32)}:0`, value: 12000n },
          { id: `${"bb".repeat(32)}:2`, value: 8000n },
        ],
        vsize: Transaction.fromHex(HEX).virtualSize(),
      },
    });
    expect(transaction).not.toHaveProperty("failed");
  });

  it("gives the request time when the explorer has no first sighting, and the fee payer of a single sender", async () => {
    const single = makeTx(HASH, {
      fees: "100",
      inputs: [{ address: ME, value: "1000", output_tx_id: "cc".repeat(32), output_index: 1 }],
      outputs: [{ address: OTHER, value: "900", output_index: 0 }],
    });
    server.use(txHandler(HASH, single), txHexHandler(HASH, HEX));
    const before = Date.now();
    const transaction = await getPendingTransaction(testContext(), "bitcoin", HASH);
    expect(transaction?.feesPayer).toBe(ME);
    expect(transaction!.date.getTime()).toBeGreaterThanOrEqual(before);
  });

  it("skips a coinbase input, which spends no output", async () => {
    const withCoinbase = makeTx(HASH, {
      fees: "0",
      inputs: [
        { coinbase: "03", value: "5000" },
        { address: ME, value: "1000", output_tx_id: "dd".repeat(32), output_index: 0 },
      ],
      outputs: [],
    });
    server.use(txHandler(HASH, withCoinbase), txHexHandler(HASH, HEX));
    const transaction = await getPendingTransaction(testContext(), "bitcoin", HASH);
    expect(transaction?.details).toEqual({
      inputs: [{ id: `${"dd".repeat(32)}:0`, value: 1000n }],
      vsize: Transaction.fromHex(HEX).virtualSize(),
    });
  });

  it.each([
    ["outpoint", { address: ME, value: "1000" }],
    ["value", { address: ME, value: null, output_tx_id: "dd".repeat(32), output_index: 0 }],
  ])(
    "refuses an input the explorer describes without its %s, which a replacement needs",
    async (_missing, input) => {
      const incomplete = makeTx(HASH, { fees: "0", inputs: [input], outputs: [] });
      server.use(txHandler(HASH, incomplete), txHexHandler(HASH, HEX));
      await expect(getPendingTransaction(testContext(), "bitcoin", HASH)).rejects.toThrow(
        "without its outpoint or value",
      );
    },
  );

  it("returns undefined when the explorer answers with an empty array", async () => {
    server.use(txHandler(HASH, []));
    expect(await getPendingTransaction(testContext(), "bitcoin", HASH)).toBeUndefined();
  });

  it("returns undefined once the transaction has a block", async () => {
    const mined = { ...pending, block: { hash: "cd".repeat(32), height: 1, time: SEEN_AT } };
    server.use(txHandler(HASH, mined));
    await expect(getPendingTransaction(testContext(), "bitcoin", HASH)).resolves.toBeUndefined();
  });

  it("returns undefined for a transaction the explorer does not know (404)", async () => {
    server.use(http.get(`${explorerUrl()}/tx/${HASH}`, () => notFound(HASH)));
    await expect(getPendingTransaction(testContext(), "bitcoin", HASH)).resolves.toBeUndefined();
  });

  it("returns undefined when the explorer still describes the transaction but has dropped its hex", async () => {
    // A replaced transaction: `/tx/{hash}` still answers, `/tx/{hash}/hex` no longer does.
    server.use(
      txHandler(HASH, pending),
      http.get(`${explorerUrl()}/tx/${HASH}/hex`, () => notFound(HASH)),
    );
    expect(await getPendingTransaction(testContext(), "bitcoin", HASH)).toBeUndefined();
  });

  it("rejects on any other explorer failure", async () => {
    server.use(
      http.get(`${explorerUrl()}/tx/${HASH}`, () => HttpResponse.json({}, { status: 500 })),
    );
    await expect(getPendingTransaction(testContext(), "bitcoin", HASH)).rejects.toMatchObject({
      status: 500,
    });
  });

  it("falls back to the byte length when the format does not parse", async () => {
    const hex = "ab".repeat(120);
    server.use(txHandler(HASH, pending), txHexHandler(HASH, hex));
    const transaction = await getPendingTransaction(testContext(), "bitcoin", HASH);
    expect(transaction?.details).toMatchObject({ vsize: 120 });
  });
});

import { http, HttpResponse } from "msw";
import type { ExplorerTx } from "../../network/types";
import { PENDING_TX_CONCURRENCY } from "../getSpendableUtxos";
import { listPendingOperations } from "../listPendingOperations";
import {
  explorerUrl,
  makeTx,
  notFound,
  pendingTxsHandler,
  server,
  testContext,
  txHexHandler,
  useMswServer,
} from "./helpers/msw";

useMswServer();

const ME = "bc1qhh568mfmwu7ymvwhu5e4mttpfg4ehxfpvhjs64";
const OTHER = "1C6XJtNXiuXvk4oUAVMkKF57CRpaTrN5Ra";
const SEEN_AT = "2026-04-09T15:31:22Z";

// The explorer still holds each transaction unmined: `tx/{hash}` without a block, and its hex.
const stillPending = (txs: ExplorerTx[], explorerId?: string) =>
  txs.flatMap(tx => [
    http.get(`${explorerUrl(explorerId)}/tx/${tx.hash}`, () => HttpResponse.json(tx)),
    txHexHandler(tx.hash, "00", explorerId),
  ]);

const sent = makeTx("11".repeat(32), {
  fees: "500",
  received_at: SEEN_AT,
  inputs: [{ address: ME, value: "20000", output_tx_id: "aa".repeat(32), output_index: 0 }],
  outputs: [
    { address: OTHER, value: "10000", output_index: 0 },
    { address: ME, value: "9500", output_index: 1 },
  ],
});
const received = makeTx("22".repeat(32), {
  fees: "100",
  inputs: [{ address: OTHER, value: "20000", output_tx_id: "bb".repeat(32), output_index: 1 }],
  outputs: [{ address: ME, value: "9623", output_index: 0 }],
});
const selfSend = makeTx("33".repeat(32), {
  fees: "300",
  inputs: [{ address: ME, value: "20000", output_tx_id: "cc".repeat(32), output_index: 0 }],
  outputs: [{ address: ME, value: "19700", output_index: 0 }],
});

describe("listPendingOperations", () => {
  it("lists a pending send as OUT with the fee apart, and no block nor failure status", async () => {
    server.use(pendingTxsHandler(ME, [sent]), ...stillPending([sent]));
    const operations = await listPendingOperations(testContext(), "bitcoin", ME);
    expect(operations).toEqual([
      {
        id: sent.hash,
        type: "OUT",
        senders: [ME],
        recipients: [OTHER],
        value: 10000n,
        asset: { type: "native" },
        tx: { hash: sent.hash, fees: 500n, feesPayer: ME, date: new Date(SEEN_AT) },
      },
    ]);
    expect(operations[0].tx).not.toHaveProperty("block");
    expect(operations[0].tx).not.toHaveProperty("failed");
  });

  it("lists a pending receive as IN, dated at the request time when the explorer gives none", async () => {
    server.use(pendingTxsHandler(ME, [received]), ...stillPending([received]));
    const before = Date.now();
    const [operation] = await listPendingOperations(testContext(), "bitcoin", ME);
    expect(operation).toMatchObject({
      type: "IN",
      senders: [OTHER],
      recipients: [ME],
      value: 9623n,
    });
    expect(operation.tx.fees).toBe(100n);
    expect(operation.tx.date.getTime()).toBeGreaterThanOrEqual(before);
    expect(operation.tx.date.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("lists a send to itself as FEES with a zero value", async () => {
    server.use(pendingTxsHandler(ME, [selfSend]), ...stillPending([selfSend]));
    const [operation] = await listPendingOperations(testContext(), "bitcoin", ME);
    expect(operation).toMatchObject({ type: "FEES", value: 0n, recipients: [] });
    expect(operation.tx.fees).toBe(300n);
  });

  it("skips a transaction that has a block, and one that does not move the address's funds", async () => {
    const mined = { ...sent, block: { hash: "cd".repeat(32), height: 1, time: SEEN_AT } };
    const unrelated = makeTx("44".repeat(32), {
      inputs: [{ address: OTHER, value: "5", output_index: 0 }],
      outputs: [{ address: OTHER, value: "5", output_index: 0 }],
    });
    server.use(pendingTxsHandler(ME, [mined, unrelated, received]), ...stillPending([received]));
    const operations = await listPendingOperations(testContext(), "bitcoin", ME);
    expect(operations.map(operation => operation.tx.hash)).toEqual([received.hash]);
  });

  it("leaves out a transaction the address still lists but the explorer has since mined", async () => {
    const minedSince = { ...sent, block: { hash: "cd".repeat(32), height: 1, time: SEEN_AT } };
    server.use(
      pendingTxsHandler(ME, [sent, received]),
      http.get(`${explorerUrl()}/tx/${sent.hash}`, () => HttpResponse.json(minedSince)),
      ...stillPending([received]),
    );
    const operations = await listPendingOperations(testContext(), "bitcoin", ME);
    expect(operations.map(operation => operation.tx.hash)).toEqual([received.hash]);
  });

  it("leaves out a replaced transaction the address still lists, whose hex the explorer dropped", async () => {
    server.use(
      pendingTxsHandler(ME, [sent, received]),
      http.get(`${explorerUrl()}/tx/${sent.hash}`, () => HttpResponse.json(sent)),
      http.get(`${explorerUrl()}/tx/${sent.hash}/hex`, () => notFound(sent.hash)),
      ...stillPending([received]),
    );
    const operations = await listPendingOperations(testContext(), "bitcoin", ME);
    expect(operations.map(operation => operation.tx.hash)).toEqual([received.hash]);
  });

  it("leaves out a transaction the explorer no longer knows", async () => {
    server.use(
      pendingTxsHandler(ME, [sent]),
      http.get(`${explorerUrl()}/tx/${sent.hash}`, () => notFound(sent.hash)),
    );
    await expect(listPendingOperations(testContext(), "bitcoin", ME)).resolves.toEqual([]);
  });

  it("rejects when checking a listed transaction fails otherwise", async () => {
    server.use(
      pendingTxsHandler(ME, [sent]),
      http.get(`${explorerUrl()}/tx/${sent.hash}`, () => HttpResponse.json({}, { status: 500 })),
    );
    await expect(listPendingOperations(testContext(), "bitcoin", ME)).rejects.toMatchObject({
      status: 500,
    });
  });

  it("checks the listed transactions a few at a time, keeping their order", async () => {
    const many = Array.from({ length: 3 * PENDING_TX_CONCURRENCY }, (_, index) =>
      makeTx(index.toString(16).padStart(64, "0"), {
        fees: "100",
        inputs: [{ address: OTHER, value: "20000", output_index: 0 }],
        outputs: [{ address: ME, value: "9900", output_index: 0 }],
      }),
    );
    let inFlight = 0;
    let maxInFlight = 0;
    server.use(
      pendingTxsHandler(ME, many),
      ...many.flatMap(tx => [
        http.get(`${explorerUrl()}/tx/${tx.hash}`, async () => {
          inFlight++;
          maxInFlight = Math.max(maxInFlight, inFlight);
          await new Promise(resolve => setTimeout(resolve, 5));
          inFlight--;
          return HttpResponse.json(tx);
        }),
        txHexHandler(tx.hash, "00"),
      ]),
    );
    const operations = await listPendingOperations(testContext(), "bitcoin", ME);
    expect(operations.map(operation => operation.tx.hash)).toEqual(many.map(tx => tx.hash));
    expect(maxInFlight).toBeLessThanOrEqual(PENDING_TX_CONCURRENCY);
  });

  it("returns an empty list when nothing is pending", async () => {
    server.use(pendingTxsHandler(ME, []));
    await expect(listPendingOperations(testContext(), "bitcoin", ME)).resolves.toEqual([]);
  });

  it("queries a Bitcoin Cash address in cashaddr form and matches it in the answer", async () => {
    const prefixless = "qzf9ax7we6swngffah3e9gr4mgh0qw3zcy6kq5afau";
    const prefixed = `bitcoincash:${prefixless}`;
    const tx = makeTx("55".repeat(32), {
      fees: "100",
      inputs: [{ address: OTHER, value: "20000", output_index: 0 }],
      outputs: [{ address: prefixed, value: "9900", output_index: 0 }],
    });
    server.use(pendingTxsHandler(prefixed, [tx], "bch"), ...stillPending([tx], "bch"));
    const operations = await listPendingOperations(
      testContext({ explorerId: "bch" }),
      "bitcoin_cash",
      prefixless,
    );
    expect(operations).toHaveLength(1);
    expect(operations[0]).toMatchObject({ type: "IN", recipients: [prefixed], value: 9900n });
  });
});

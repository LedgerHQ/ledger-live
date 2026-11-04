import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
import { Address } from "@ton/core";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { TON_API_MOCKED, createMockTonContext } from "../../test/context";
import {
  NOT_MASTER,
  OWNER,
  OWNER_JETTON_WALLET_RAW,
  OWNER_RAW,
  PEER_JETTON_WALLET_RAW,
  PEER_RAW,
  excessRefundTx,
  jettonIn,
  jettonInTrace,
  jettonNotifyTx,
  jettonOut,
  jettonOutTrace,
  jettonSendTx,
} from "../../test/history.fixtures";
import { listOperations } from "../listOperations";

const bounceable = (raw: string) =>
  Address.parse(raw).toString({ urlSafe: true, bounceable: true });

type Served = {
  transactions?: unknown[];
  transfers?: unknown[];
  traces?: unknown[];
  block?: { seqno: number; gen_utime: string };
  last?: { seqno: number; gen_utime: string };
};

describe("listOperations", () => {
  const server = setupServer();
  const context = createMockTonContext();
  let requests: Record<string, URLSearchParams[]>;

  const serve = ({ transactions = [], transfers = [], traces = [], block, last }: Served) => {
    const record = (path: string, request: Request) => {
      requests[path] = [...(requests[path] ?? []), new URL(request.url).searchParams];
    };
    server.use(
      http.get(`${TON_API_MOCKED}/transactions`, ({ request }) => {
        record("transactions", request);
        return HttpResponse.json({ transactions, address_book: {} });
      }),
      http.get(`${TON_API_MOCKED}/jetton/transfers`, ({ request }) => {
        record("transfers", request);
        return HttpResponse.json({ jetton_transfers: transfers, address_book: {} });
      }),
      http.get(`${TON_API_MOCKED}/traces`, ({ request }) => {
        record("traces", request);
        const ids = new URL(request.url).searchParams.getAll("trace_id");
        return HttpResponse.json({
          traces: traces.filter(trace => ids.includes((trace as { trace_id: string }).trace_id)),
        });
      }),
      http.get(`${TON_API_MOCKED}/blocks`, ({ request }) => {
        record("blocks", request);
        return HttpResponse.json({ blocks: block ? [{ ...block, root_hash: "hash" }] : [] });
      }),
      http.get(`${TON_API_MOCKED}/masterchainInfo`, () =>
        HttpResponse.json({ last: { ...last, root_hash: "tip" } }),
      ),
    );
  };

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  beforeEach(() => {
    requests = {};
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("maps native and jetton rows into operations, newest first", async () => {
    serve({
      transactions: [excessRefundTx, jettonSendTx, jettonNotifyTx],
      transfers: [jettonOut, jettonIn],
      traces: [jettonOutTrace, jettonInTrace],
    });

    const { items, next } = await listOperations(context, OWNER, { minHeight: 0 });

    expect(next).toBeUndefined();
    expect(items.map(op => [op.type, op.asset.type, op.tx.hash])).toEqual([
      ["IN", "native", excessRefundTx.in_msg.hash],
      ["OUT", "jetton", jettonSendTx.in_msg.hash],
      ["OUT", "native", jettonSendTx.in_msg.hash],
      ["IN", "native", jettonNotifyTx.in_msg.hash],
      ["IN", "jetton", jettonIn.transaction_hash],
    ]);
  });

  it("reports a native send under the hash of the signed message, its fee counting the forward fee", async () => {
    serve({ transactions: [jettonSendTx] });

    const { items } = await listOperations(context, OWNER, { minHeight: 0 });

    expect(items).toEqual([
      {
        id: `${jettonSendTx.in_msg.hash}-OUT`,
        type: "OUT",
        senders: [OWNER],
        recipients: [bounceable(OWNER_JETTON_WALLET_RAW)],
        value: 100000000n,
        asset: { type: "native" },
        details: {
          familyExtra: {
            comment: { isEncrypted: false, text: "" },
            lt: jettonSendTx.lt,
            explorerHash: jettonSendTx.hash,
          },
        },
        tx: {
          hash: jettonSendTx.in_msg.hash,
          block: { height: 40170315, hash: "", time: new Date(1725542832000) },
          // total_fees plus the forward fee of the message sent
          fees: 2600565n + 535471n,
          date: new Date(1725542832000),
          failed: false,
        },
      },
    ]);
  });

  it("reports a native receipt with the fee the account paid on it", async () => {
    serve({ transactions: [excessRefundTx] });

    const { items } = await listOperations(context, OWNER, { minHeight: 0 });

    expect(items).toEqual([
      expect.objectContaining({
        type: "IN",
        senders: [bounceable(PEER_JETTON_WALLET_RAW)],
        recipients: [OWNER],
        value: 89965561n,
        tx: expect.objectContaining({ fees: 396410n, failed: false }),
      }),
    ]);
  });

  it("reads a text comment into the memo and the legacy comment", async () => {
    const commented = {
      ...excessRefundTx,
      in_msg: {
        ...excessRefundTx.in_msg,
        message_content: {
          decoded: { "@type": "text_comment", type: "text_comment", comment: "thanks" },
        },
      },
    };
    serve({ transactions: [commented] });

    const { items } = await listOperations(context, OWNER, { minHeight: 0 });

    expect(items[0].details).toEqual({
      memo: "thanks",
      familyExtra: {
        comment: { isEncrypted: false, text: "thanks" },
        lt: excessRefundTx.lt,
        explorerHash: excessRefundTx.hash,
      },
    });
  });

  it("reads the comment of a sent transfer from its outgoing message", async () => {
    const [jettonTransfer] = jettonSendTx.out_msgs;
    const commented = {
      ...jettonSendTx,
      out_msgs: [
        {
          ...jettonTransfer,
          destination: PEER_RAW,
          message_content: {
            decoded: { "@type": "text_comment", type: "text_comment", comment: "rent" },
          },
        },
      ],
    };
    serve({ transactions: [commented] });

    const { items } = await listOperations(context, OWNER, { minHeight: 0 });

    expect(items.map(op => [op.type, op.details?.memo])).toEqual([["OUT", "rent"]]);
  });

  it("flags an encrypted comment without reading it", async () => {
    const encrypted = {
      ...excessRefundTx,
      in_msg: {
        ...excessRefundTx.in_msg,
        message_content: { decoded: { "@type": "binary_comment", type: "binary_comment" } },
      },
    };
    serve({ transactions: [encrypted] });

    const { items } = await listOperations(context, OWNER, { minHeight: 0 });

    expect(items[0].details).toEqual({
      familyExtra: {
        comment: { isEncrypted: true, text: "" },
        lt: excessRefundTx.lt,
        explorerHash: excessRefundTx.hash,
      },
    });
  });

  it("asks for each jetton row's trace once, in batches of 20", async () => {
    const rows = Array.from({ length: 27 }, (_, i) => ({
      ...jettonIn,
      transaction_hash: `jetton-transaction-${i}`,
      trace_id: `trace-${Math.min(i, 25)}`,
    }));
    const traces = Array.from({ length: 26 }, (_, i) => ({
      trace_id: `trace-${i}`,
      trace: { tx_hash: `root-${i}`, in_msg_hash: `root-message-${i}` },
      transactions: Object.fromEntries(
        rows
          .filter(row => row.trace_id === `trace-${i}`)
          .map(row => [
            row.transaction_hash,
            { account: PEER_JETTON_WALLET_RAW, hash: row.transaction_hash, mc_block_seqno: 1 },
          ]),
      ),
    }));
    serve({ transfers: rows, traces });

    const { items } = await listOperations(context, OWNER, { minHeight: 0 });

    expect(items).toHaveLength(27);
    const batches = requests.traces.map(params => ({
      ids: params.getAll("trace_id").length,
      limit: params.get("limit"),
    }));
    expect(batches.sort((a, b) => a.ids - b.ids)).toEqual([
      { ids: 6, limit: "6" },
      { ids: 20, limit: "20" },
    ]);
  });

  it("marks a transaction whose compute phase failed", async () => {
    const failed = {
      ...jettonSendTx,
      description: { aborted: true, compute_ph: { success: false, exit_code: 33 } },
    };
    serve({ transactions: [failed] });

    const { items } = await listOperations(context, OWNER, { minHeight: 0 });

    expect(items[0].tx.failed).toBe(true);
  });

  it("reports a sent jetton under the signed message hash, on the block that moved it", async () => {
    serve({ transfers: [jettonOut], traces: [jettonOutTrace] });

    const { items } = await listOperations(context, OWNER, { minHeight: 0 });

    expect(items).toEqual([
      {
        id: `${jettonOut.transaction_hash}-OUT`,
        type: "OUT",
        senders: [OWNER],
        recipients: [bounceable(PEER_RAW)],
        value: 5000000000n,
        asset: { type: "jetton", assetReference: NOT_MASTER, assetOwner: OWNER },
        details: {
          memo: "Sending NOT",
          familyExtra: {
            comment: { isEncrypted: false, text: "Sending NOT" },
            lt: jettonOut.transaction_lt,
            explorerHash: jettonOut.transaction_hash,
          },
        },
        tx: {
          hash: jettonSendTx.in_msg.hash,
          block: { height: 40170319, hash: "", time: new Date(1725542848000) },
          fees: 0n,
          date: new Date(1725542848000),
          failed: false,
        },
      },
    ]);
    expect(requests.traces.map(params => params.getAll("trace_id"))).toEqual([
      [jettonOut.trace_id],
    ]);
  });

  it("reports a received jetton under its own transaction hash", async () => {
    serve({ transfers: [jettonIn], traces: [jettonInTrace] });

    const { items } = await listOperations(context, OWNER, { minHeight: 0 });

    expect(items).toEqual([
      expect.objectContaining({
        id: `${jettonIn.transaction_hash}-IN`,
        type: "IN",
        senders: [bounceable(PEER_RAW)],
        recipients: [OWNER],
        value: 40000000000n,
        asset: { type: "jetton", assetReference: NOT_MASTER, assetOwner: OWNER },
        tx: expect.objectContaining({
          hash: jettonIn.transaction_hash,
          block: { height: 40170273, hash: "", time: new Date(1725542663000) },
          fees: 0n,
        }),
      }),
    ]);
  });

  it("keeps the transfer's own hash when the owner's wallet did not order it", async () => {
    const orphanTrace = {
      ...jettonOutTrace,
      trace: { tx_hash: jettonOut.transaction_hash, in_msg_hash: "external" },
    };
    serve({ transfers: [jettonOut], traces: [orphanTrace] });

    const { items } = await listOperations(context, OWNER, { minHeight: 0 });

    expect(items[0].tx.hash).toBe(jettonOut.transaction_hash);
  });

  it("marks an aborted jetton transfer as failed", async () => {
    serve({ transfers: [{ ...jettonIn, transaction_aborted: true }], traces: [jettonInTrace] });

    const { items } = await listOperations(context, OWNER, { minHeight: 0 });

    expect(items[0].tx.failed).toBe(true);
  });

  it("refuses a jetton transfer whose trace is not indexed", async () => {
    serve({ transfers: [jettonIn], traces: [] });

    await expect(listOperations(context, OWNER, { minHeight: 0 })).rejects.toThrow(
      `TON trace ${jettonIn.trace_id} does not hold the committed transaction`,
    );
  });

  it("refuses a native transaction with no masterchain block", async () => {
    serve({ transactions: [{ ...excessRefundTx, mc_block_seqno: null }] });

    await expect(listOperations(context, OWNER, { minHeight: 0 })).rejects.toThrow(
      "has no masterchain block",
    );
  });

  it("asks both sources for the same newest-first window of the owner", async () => {
    serve({});

    await listOperations(context, OWNER, { minHeight: 0 });

    for (const params of [...requests.transactions, ...requests.transfers]) {
      expect(Object.fromEntries(params)).toEqual(
        expect.objectContaining({ limit: "256", sort: "desc" }),
      );
      expect(params.has("start_utime")).toBe(false);
      expect(params.has("end_utime")).toBe(false);
      expect(params.has("offset")).toBe(false);
    }
    expect(requests.transactions[0].get("account")).toBe(OWNER_RAW.toLowerCase());
    expect(requests.transfers[0].get("owner_address")).toBe(OWNER_RAW.toLowerCase());
    expect(requests.traces).toBeUndefined();
  });

  it("stops a full page before its last second and resumes at that second", async () => {
    const refunds = Array.from({ length: 20 }, (_, i) => ({
      ...excessRefundTx,
      hash: `refund-${i}`,
      now: 1725542870 - i * 10,
      in_msg: { ...excessRefundTx.in_msg, hash: `refund-message-${i}` },
    }));
    serve({
      transactions: refunds,
      transfers: [jettonOut, jettonIn],
      traces: [jettonOutTrace, jettonInTrace],
    });

    const first = await listOperations(context, OWNER, { minHeight: 0, limit: 20 });

    expect(first.items).toHaveLength(20);
    expect(first.items.at(-1)?.tx.date).toEqual(new Date(1725542690000));
    expect(first.next).toBe("1725542680");
    expect(requests.traces.map(params => params.getAll("trace_id"))).toEqual([
      [jettonOut.trace_id],
    ]);

    server.resetHandlers();
    requests = {};
    serve({
      transactions: [refunds[19], { ...jettonNotifyTx, now: 1725542670 }],
      transfers: [jettonIn],
      traces: [jettonInTrace],
    });

    const second = await listOperations(context, OWNER, {
      minHeight: 0,
      limit: 20,
      cursor: first.next,
    });

    expect(second.next).toBeUndefined();
    expect(second.items.map(op => op.tx.date.getTime() / 1000)).toEqual([
      1725542680, 1725542670, 1725542663,
    ]);
    for (const params of [requests.transactions[0], requests.transfers[0]]) {
      expect(params.get("end_utime")).toBe("1725542680");
      expect(params.has("offset")).toBe(false);
    }
  });

  it("reads a second that fills a whole page on its own and resumes past it", async () => {
    const crowded = Array.from({ length: 20 }, (_, i) => ({
      ...excessRefundTx,
      hash: `crowded-${i}`,
      in_msg: { ...excessRefundTx.in_msg, hash: `crowded-message-${i}` },
    }));
    serve({ transactions: crowded });

    const { items, next } = await listOperations(context, OWNER, { minHeight: 0, limit: 20 });

    expect(items).toHaveLength(20);
    expect(next).toBe(String(excessRefundTx.now - 1));
    for (const params of [requests.transactions[1], requests.transfers[1]]) {
      expect(Object.fromEntries(params)).toEqual(
        expect.objectContaining({
          start_utime: String(excessRefundTx.now),
          end_utime: String(excessRefundTx.now),
          limit: "1000",
        }),
      );
    }
  });

  it("refuses a second holding more rows than the indexer serves at once", async () => {
    serve({ transactions: Array.from({ length: 1000 }, () => excessRefundTx) });

    await expect(listOperations(context, OWNER, { minHeight: 0, limit: 20 })).rejects.toThrow(
      `holds over 1000 rows at ${excessRefundTx.now}`,
    );
  });

  it("raises a page size the indexer cannot serve to its floor", async () => {
    serve({});

    await listOperations(context, OWNER, { minHeight: 0, limit: 2 });

    expect(requests.transactions[0].get("limit")).toBe("20");
    expect(requests.transfers[0].get("limit")).toBe("20");
  });

  it("walks oldest first from the cursor's second", async () => {
    serve({});

    await listOperations(context, OWNER, {
      minHeight: 0,
      order: "asc",
      cursor: "1725542692",
    });

    for (const params of [requests.transactions[0], requests.transfers[0]]) {
      expect(Object.fromEntries(params)).toEqual(
        expect.objectContaining({ start_utime: "1725542692", sort: "asc" }),
      );
      expect(params.has("end_utime")).toBe(false);
    }
  });

  it("opens the window before minHeight's block and keeps rows from that block on", async () => {
    serve({
      transactions: [jettonNotifyTx],
      transfers: [jettonIn],
      traces: [jettonInTrace],
      block: { seqno: 40170280, gen_utime: "1725542695" },
    });

    const { items } = await listOperations(context, OWNER, { minHeight: 40170280 });

    expect(requests.blocks[0].get("seqno")).toBe("40170280");
    expect(requests.transactions[0].get("start_utime")).toBe("1725542395");
    expect(requests.transfers[0].get("start_utime")).toBe("1725542395");
    expect(items.map(op => op.tx.hash)).toEqual([jettonNotifyTx.in_msg.hash]);
  });

  it("opens the window at the tip when minHeight is past it", async () => {
    serve({ last: { seqno: 40170280, gen_utime: "1725542695" } });

    await listOperations(context, OWNER, { minHeight: 40170281 });

    expect(requests.transactions[0].get("start_utime")).toBe("1725542395");
  });

  it.each([0, 1001, 1.5])("rejects a limit of %s", async limit => {
    await expect(listOperations(context, OWNER, { minHeight: 0, limit })).rejects.toThrow(
      InvalidParameterError,
    );
  });

  it("rejects a cursor it did not issue", async () => {
    await expect(
      listOperations(context, OWNER, { minHeight: 0, cursor: "not-a-cursor" }),
    ).rejects.toThrow(InvalidParameterError);
  });
});

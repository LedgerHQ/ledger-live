import { CosmosAPI } from "../../network/Cosmos";
import { CosmosTx } from "../../types";
import { listOperations } from "./listOperations";

const ADDR = "cosmos1sender";

const makeTx = (overrides: Partial<{ txhash: string; height: string }> = {}): CosmosTx =>
  ({
    txhash: overrides.txhash ?? "HASH1",
    height: overrides.height ?? "100",
    timestamp: "2024-01-01T00:00:00Z",
    code: 0,
    events: [],
    tx: {
      body: {
        messages: [
          {
            "@type": "/cosmos.bank.v1beta1.MsgSend",
            from_address: ADDR,
            to_address: "cosmos1recipient",
            amount: [{ denom: "uatom", amount: "1000000" }],
          },
        ],
        memo: "hello",
      },
      auth_info: {
        fee: { amount: [{ denom: "uatom", amount: "500" }] },
        signer_infos: [{ sequence: "3" }],
      },
    },
  }) as unknown as CosmosTx;

const apiWith = (txs: CosmosTx[], hasMore = false): CosmosAPI =>
  ({ getTransactionsPage: jest.fn().mockResolvedValue({ txs, hasMore }) }) as unknown as CosmosAPI;

const makeUnknownTx = (overrides: { txhash: string; height: string }): CosmosTx =>
  ({
    ...makeTx(overrides),
    tx: {
      body: { messages: [{ "@type": "/cosmos.gov.v1beta1.MsgVote" }], memo: "" },
      auth_info: { fee: { amount: [] }, signer_infos: [] },
    },
  }) as unknown as CosmosTx;

const makeDelegateTx = (): CosmosTx =>
  ({
    ...makeTx(),
    tx: {
      body: {
        messages: [
          {
            "@type": "/cosmos.staking.v1beta1.MsgDelegate",
            delegator_address: ADDR,
            validator_address: "cosmosvaloper1v",
            amount: { denom: "uatom", amount: "1000000" },
          },
        ],
        memo: "",
      },
      auth_info: {
        fee: { amount: [{ denom: "uatom", amount: "500" }] },
        signer_infos: [{ sequence: "3" }],
      },
    },
  }) as unknown as CosmosTx;

// Models one newest-first stream that honours `count`, so the fetch window is actually bounded.
const apiCounting = (allTxs: CosmosTx[]): CosmosAPI =>
  ({
    getTransactionsPage: jest.fn(async (_addr: string, count: number) => ({
      txs: allTxs.slice(0, count),
      hasMore: allTxs.length > count,
    })),
  }) as unknown as CosmosAPI;

describe("logic/history/listOperations", () => {
  it("maps a native send to an OUT framework operation", async () => {
    const page = await listOperations(apiWith([makeTx()]), ADDR, "cosmos", { minHeight: 0 });

    expect(page.items).toHaveLength(1);
    const op = page.items[0];
    expect(op.type).toBe("OUT");
    expect(op.value).toBe(1_000_500n);
    expect(op.senders).toEqual([ADDR]);
    expect(op.recipients).toEqual(["cosmos1recipient"]);
    expect(op.asset).toEqual({ type: "native" });
    expect(op.tx.hash).toBe("HASH1");
    expect(op.tx.block.height).toBe(100);
    expect(op.tx.fees).toBe(500n);
    expect(op.tx.failed).toBe(false);
    expect(op.tx.date).toBeInstanceOf(Date);
    expect(page.next).toBe(undefined);
  });

  it("serializes BigNumber amounts in details to JSON-safe strings", async () => {
    const page = await listOperations(apiWith([makeDelegateTx()]), ADDR, "cosmos", {
      minHeight: 0,
    });
    const details = page.items[0].details as { validators: { amount: unknown }[] };
    expect(details.validators[0].amount).toBe("1000000");
    expect(typeof details.validators[0].amount).toBe("string");
  });

  it("dedupes a tx returned in both the sender and recipient streams", async () => {
    const page = await listOperations(apiWith([makeTx(), makeTx()]), ADDR, "cosmos", {
      minHeight: 0,
    });
    expect(page.items).toHaveLength(1);
  });

  it("paginates by cursor/limit and always propagates next", async () => {
    const api = apiWith([
      makeTx({ txhash: "HASH1", height: "100" }),
      makeTx({ txhash: "HASH2", height: "200" }),
    ]);

    const first = await listOperations(api, ADDR, "cosmos", { minHeight: 0, limit: 1 });
    expect(first.items).toHaveLength(1);
    expect(first.items[0].tx.hash).toBe("HASH2");
    expect(first.next).toBe("1");

    const second = await listOperations(api, ADDR, "cosmos", {
      minHeight: 0,
      limit: 1,
      cursor: "1",
    });
    expect(second.items).toHaveLength(1);
    expect(second.items[0].tx.hash).toBe("HASH1");
    expect(second.next).toBe(undefined);
  });

  it("clamps a negative cursor to the first page", async () => {
    const api = apiWith([
      makeTx({ txhash: "HASH1", height: "100" }),
      makeTx({ txhash: "HASH2", height: "200" }),
    ]);
    const page = await listOperations(api, ADDR, "cosmos", {
      minHeight: 0,
      limit: 1,
      cursor: "-1",
    });
    expect(api.getTransactionsPage).toHaveBeenCalledWith(ADDR, 1);
    expect(page.items).toHaveLength(1);
    expect(page.items[0].tx.hash).toBe("HASH2");
  });

  it("requests only offset+limit depth from the network", async () => {
    const api = apiWith([makeTx()]);
    await listOperations(api, ADDR, "cosmos", { minHeight: 0, limit: 5, cursor: "10" });
    expect(api.getTransactionsPage).toHaveBeenCalledWith(ADDR, 15);
  });

  it("propagates next when the node reports more and the page is full", async () => {
    const api = apiWith([makeTx({ txhash: "H1", height: "100" })], true);
    const page = await listOperations(api, ADDR, "cosmos", { minHeight: 0, limit: 1 });
    expect(page.items).toHaveLength(1);
    expect(page.next).toBe("1");
  });

  it("stops paginating on a short page even when hasMore is true (minHeight boundary)", async () => {
    const api = apiWith([makeTx({ txhash: "OLD", height: "50" })], true);
    const page = await listOperations(api, ADDR, "cosmos", { minHeight: 100, limit: 5 });
    expect(page.items).toHaveLength(0);
    expect(page.next).toBeUndefined();
  });

  it("keeps advancing on a short page when more txs exist and the floor isn't reached", async () => {
    const api = apiWith([makeTx({ txhash: "H1", height: "100" })], true);
    const page = await listOperations(api, ADDR, "cosmos", { minHeight: 0, limit: 5 });
    expect(page.items).toHaveLength(1);
    expect(page.next).toBe("5");
  });

  it("never skips a valid op across pages when txToOps drops unknown-type txs", async () => {
    const allTxs = [
      makeTx({ txhash: "A", height: "300" }),
      makeUnknownTx({ txhash: "B", height: "250" }),
      makeTx({ txhash: "C", height: "200" }),
      makeUnknownTx({ txhash: "D", height: "150" }),
      makeTx({ txhash: "E", height: "100" }),
    ];
    const api = apiCounting(allTxs);

    const seen: string[] = [];
    let cursor: string | undefined;
    let guard = 0;
    do {
      const page = await listOperations(api, ADDR, "cosmos", { minHeight: 0, limit: 2, cursor });
      seen.push(...page.items.map(o => o.tx.hash));
      cursor = page.next;
      if (++guard > 10) throw new Error("pagination did not terminate");
    } while (cursor);

    expect(seen).toEqual(["A", "C", "E"]);
  });

  it("orders equal-height operations deterministically by id, independent of fetch order", async () => {
    const api = apiWith([
      makeTx({ txhash: "BBB", height: "100" }),
      makeTx({ txhash: "AAA", height: "100" }),
    ]);
    const page = await listOperations(api, ADDR, "cosmos", { minHeight: 0 });
    expect(page.items.map(o => o.tx.hash)).toEqual(["AAA", "BBB"]);
  });

  it("rejects ascending order (backend pages newest-first)", async () => {
    await expect(
      listOperations(apiWith([makeTx()]), ADDR, "cosmos", { minHeight: 0, order: "asc" }),
    ).rejects.toThrow("ascending order is not supported");
  });
});

import {
  createMemoryHistoryStore,
  type AccountData,
  type AccountOperation,
  type SyncEvent,
} from "@ledgerhq/account-module-framework";
import { anOperation, testContext } from "@ledgerhq/account-module-framework/test-utils";
import { createUtxoAccountModule } from "./module";
import { emptyState, versioned } from "./state";
import { addressAt, fakeChain, tx } from "./test/fakeChain";
import type { UtxoAccountState } from "./types";

const context = testContext();
const descriptor = {
  currencyId: "bitcoin",
  derivationMode: "native_segwit",
  index: 0,
  key: "xpub",
  derivationPath: "84'/0'/0'",
};
const block = (height: number) => ({
  height,
  hash: `h${height}`,
  time: "2026-01-01T00:00:00.000Z",
});
const NOW = Date.parse("2026-01-01T00:30:00.000Z");

const account = (
  state?: UtxoAccountState,
  operations: AccountOperation[] = [],
): AccountData<UtxoAccountState> & { history: ReturnType<typeof createMemoryHistoryStore> } => ({
  descriptor,
  state: state ? versioned(state) : undefined,
  history: createMemoryHistoryStore(operations),
});

async function drain(events: AsyncIterable<SyncEvent<UtxoAccountState>>) {
  const all: SyncEvent<UtxoAccountState>[] = [];
  for await (const event of events) all.push(event);
  return all;
}

const funding = tx("fund", {
  block: block(10),
  inputs: [{ txid: "ext", vout: 0, address: "stranger", value: "2000" }],
  outputs: [{ index: 0, address: addressAt(0, 0), value: "1000" }],
});
const spending = tx("spend", {
  block: block(11),
  fees: "50",
  inputs: [{ txid: "fund", vout: 0, address: addressAt(0, 0), value: "1000", sequence: 1 }],
  outputs: [
    { index: 0, address: "stranger", value: "700" },
    { index: 1, address: addressAt(1, 0), value: "250" },
  ],
});
const lateReceive = tx("late", {
  block: block(12),
  outputs: [{ index: 0, address: addressAt(0, 3), value: "300" }],
});

describe("sync", () => {
  it("walks the address chains up to the gap and keeps the account's outputs", async () => {
    const { api } = fakeChain([funding, spending, lateReceive]);
    const module = createUtxoAccountModule(api, { gapLimit: 2, now: () => NOW });
    const data = account();

    const events = await drain(module.sync(context, data));

    expect(events).toHaveLength(2);
    expect(events[0]?.progress).toEqual({ counters: { addressesScanned: 3, transactions: 3 } });
    const last = events[1];
    expect(last?.progress.blockHeight).toBe(100);
    expect(last?.state.data).toMatchObject({
      syncedHeight: 100,
      anchor: { height: 12, hash: "h12" },
      addresses: expect.arrayContaining([
        { address: addressAt(0, 0), chain: 0, index: 0 },
        { address: addressAt(0, 3), chain: 0, index: 3 },
        { address: addressAt(1, 0), chain: 1, index: 0 },
      ]),
    });
    expect(last?.state.data.utxos.map(u => [u.txid, u.value]).sort()).toEqual([
      ["late", "300"],
      ["spend", "250"],
    ]);
    expect(
      data.history
        .snapshot()
        .map(op => op.id)
        .sort(),
    ).toEqual(["fund-IN", "late-IN", "spend-OUT"]);
    expect(api.listAddressTransactions).toHaveBeenCalledWith(context, addressAt(0, 5), {
      minHeight: 0,
      order: "asc",
    });
  });

  it("resumes below the last synced tip for known addresses, from the start for new ones", async () => {
    const { api } = fakeChain([funding]);
    const module = createUtxoAccountModule(api, { gapLimit: 1, rewindBlocks: 3 });
    const state = {
      ...emptyState(),
      syncedHeight: 50,
      addresses: [{ address: addressAt(0, 0), chain: 0, index: 0 }],
    };

    await drain(module.sync(context, account(state)));

    expect(api.listAddressTransactions).toHaveBeenCalledWith(context, addressAt(0, 0), {
      minHeight: 47,
      order: "asc",
    });
    expect(api.listAddressTransactions).toHaveBeenCalledWith(context, addressAt(0, 1), {
      minHeight: 0,
      order: "asc",
    });
  });

  it("starts over on a reorg below its anchor, keeping the optimistic operations", async () => {
    const { api, chain } = fakeChain([funding]);
    chain.blockHashes.set(10, "replaced");
    const module = createUtxoAccountModule(api, { gapLimit: 1, now: () => NOW });
    const state = {
      ...emptyState(),
      syncedHeight: 90,
      anchor: { height: 10, hash: "h10" },
      addresses: [{ address: addressAt(0, 0), chain: 0, index: 0 }],
      utxos: [
        {
          txid: "gone",
          vout: 0,
          value: "5",
          address: addressAt(0, 0),
          height: 9,
          replaceable: false,
        },
      ],
    };
    const optimistic = anOperation({
      id: "sent-OUT",
      hash: "sent",
      block: null,
      optimistic: true,
      date: new Date(NOW),
    });
    const data = account(state, [anOperation({ id: "gone-IN", hash: "gone" }), optimistic]);

    const [, last] = await drain(module.sync(context, data));

    expect(last?.state.data.utxos.map(u => u.txid)).toEqual(["fund"]);
    expect(
      data.history
        .snapshot()
        .map(op => op.id)
        .sort(),
    ).toEqual(["fund-IN", "sent-OUT"]);
    expect(api.listAddressTransactions).toHaveBeenCalledWith(context, addressAt(0, 0), {
      minHeight: 0,
      order: "asc",
    });
  });

  it("does not take a failing anchor check for a reorg", async () => {
    const { api } = fakeChain([funding]);
    api.getBlockInfo.mockRejectedValueOnce(new Error("down"));
    const module = createUtxoAccountModule(api, { gapLimit: 1 });
    const state = { ...emptyState(), syncedHeight: 90, anchor: { height: 10, hash: "h10" } };
    const data = account(state, [anOperation({ id: "kept-IN", hash: "kept" })]);

    await drain(module.sync(context, data));

    expect(data.history.snapshot().map(op => op.id)).toContain("kept-IN");
  });

  it("walks every page of an address and stops on a cursor that does not advance", async () => {
    const { api } = fakeChain();
    api.listAddressTransactions.mockImplementation(async (_context, address, options) => {
      if (address !== addressAt(0, 0)) return { items: [] };
      return options.cursor
        ? { items: [funding, { ...funding, block: null }], next: "1" }
        : { items: [{ ...funding, block: null }], next: "1" };
    });
    const module = createUtxoAccountModule(api, { gapLimit: 1 });

    const [, last] = await drain(module.sync(context, account()));

    expect(last?.state.data.confirmedUtxos.map(u => [u.txid, u.height])).toEqual([["fund", 10]]);
    const firstAddressCalls = api.listAddressTransactions.mock.calls.filter(
      ([, address]) => address === addressAt(0, 0),
    );
    expect(firstAddressCalls.map(([, , options]) => options.cursor)).toEqual([undefined, "1"]);
  });

  it("drops the outputs of a replaced pending transaction and its stale operations", async () => {
    const pending = (id: string, receivedAt: string) =>
      tx(id, {
        block: null,
        receivedAt,
        replaceable: true,
        inputs: [{ txid: "fund", vout: 0, address: addressAt(0, 0), value: "1000" }],
        outputs: [{ index: 0, address: addressAt(1, 0), value: "900" }],
      });
    const { api } = fakeChain([
      funding,
      pending("original", "2026-01-01T00:00:00.000Z"),
      pending("replacement", "2026-01-01T00:10:00.000Z"),
    ]);
    const expiry = jest.fn(async () => 20 * 60_000);
    const module = createUtxoAccountModule(api, {
      gapLimit: 1,
      now: () => NOW,
      replacedOperationExpiryMs: expiry,
    });
    const data = account();

    const [, last] = await drain(module.sync(context, data));

    expect(expiry).toHaveBeenCalledWith(context);
    expect(last?.state.data.utxos.map(u => u.txid)).toEqual(["replacement"]);
    expect(data.history.snapshot().map(op => op.id)).toEqual(["replacement-OUT", "fund-IN"]);
  });

  it("settles the optimistic operations a sync confirms or replaces", async () => {
    const { api } = fakeChain([funding, spending]);
    const module = createUtxoAccountModule(api, { gapLimit: 1, now: () => NOW });
    const optimistic = (hash: string, inputs: string[]) =>
      anOperation({
        id: `${hash}-OUT`,
        hash,
        block: null,
        optimistic: true,
        date: new Date(NOW),
        details: { inputs },
      });
    const data = account(undefined, [
      optimistic("spend", ["fund-0"]),
      optimistic("double-spend", ["fund-0"]),
      optimistic("unrelated", ["other-0"]),
    ]);

    await drain(module.sync(context, data));

    expect(
      data.history
        .snapshot()
        .map(op => op.id)
        .sort(),
    ).toEqual(["fund-IN", "spend-OUT", "unrelated-OUT"]);
  });

  it("stops when aborted", async () => {
    const { api } = fakeChain();
    const controller = new AbortController();
    controller.abort();
    const module = createUtxoAccountModule(api);

    await expect(
      drain(module.sync(context, account(), { signal: controller.signal })),
    ).rejects.toThrow();
  });
});

import {
  createMemoryHistoryStore,
  type AccountDescriptor,
  type AccountOperation,
  type SyncEvent,
  type Versioned,
} from "@ledgerhq/account-module-framework";
import { anOperation, testContext } from "@ledgerhq/account-module-framework/test-utils";
import type {
  Balance,
  ListOperationsOptions,
  Operation,
  Page,
  Stake,
  StakesOptions,
} from "@ledgerhq/coin-module-framework/api/types";
import { emptyState, versioned } from "./state";
import { createSync } from "./sync";
import type { SingleAddressAccountState } from "./types";

const context = testContext();
const date = new Date("2026-01-01T00:00:00.000Z");
const now = date.getTime() + 60_000;
const tip = { height: 100, hash: "tip", time: date };
const native = { type: "native" } as const;

const descriptor: AccountDescriptor = {
  currencyId: "ethereum",
  derivationMode: "",
  index: 0,
  key: "address",
  derivationPath: "44'/60'/0'",
};

const aCoinOperation = (
  id: string,
  height: number,
  fields: Partial<Omit<Operation, "tx">> = {},
  tx: Partial<Operation["tx"]> = {},
): Operation => ({
  id,
  type: "IN",
  senders: ["sender"],
  recipients: ["address"],
  value: 10n,
  asset: native,
  ...fields,
  tx: {
    hash: `hash-${id}`,
    block: { height, hash: `block-${height}`, time: date },
    fees: 1n,
    date,
    failed: false,
    ...tx,
  },
});

const aSyncedOperation = (id: string, height: number): AccountOperation =>
  anOperation({ id, hash: `hash-${id}`, block: { height, hash: `block-${height}`, time: date } });

const anOptimisticOperation = (fields: Partial<AccountOperation>): AccountOperation =>
  anOperation({ type: "OUT", block: null, optimistic: true, date: new Date(now), ...fields });

/** The pages of `listOperations`, chained by their index. */
const chained = <T>(...pages: T[][]): Page<T>[] =>
  pages.map((items, index) =>
    index < pages.length - 1 ? { items, next: String(index + 1) } : { items },
  );

function aCoinModule({
  operations = [[]],
  balances = [{ value: 50n, asset: native }],
  stakes = [[]],
}: { operations?: Operation[][]; balances?: Balance[]; stakes?: Stake[][] } = {}) {
  const operationPages = chained(...operations);
  const stakePages = chained(...stakes);
  return {
    lastBlock: jest.fn(async () => tip),
    listOperations: jest.fn(
      async (_context: unknown, _address: string, { cursor }: ListOperationsOptions) =>
        operationPages[Number(cursor ?? 0)]!,
    ),
    getBalance: jest.fn(async () => balances),
    getStakes: jest.fn(
      async (_context: unknown, _address: string, options?: StakesOptions) =>
        stakePages[Number(options?.cursor ?? 0)]!,
    ),
  };
}

async function collect(
  events: AsyncIterable<SyncEvent<SingleAddressAccountState>>,
): Promise<SyncEvent<SingleAddressAccountState>[]> {
  const collected: SyncEvent<SingleAddressAccountState>[] = [];
  for await (const event of events) collected.push(event);
  return collected;
}

const ids = (operations: AccountOperation[]) => operations.map(op => op.id).sort();

const syncedState = (syncedHeight: number) =>
  versioned({ syncedHeight, balances: [{ value: "1", asset: native }], stakes: [] });

describe("sync", () => {
  it("lists every page from height 0 on a first sync, then records the operations, balances and tip", async () => {
    const coinModule = aCoinModule({
      operations: [[aCoinOperation("a", 90)], [aCoinOperation("b", 80)]],
    });
    const history = createMemoryHistoryStore();

    const events = await collect(
      createSync(coinModule)(context, { descriptor, state: undefined, history }),
    );

    expect(
      coinModule.listOperations.mock.calls.map(([, address, options]) => [address, options]),
    ).toEqual([
      ["address", { minHeight: 0, cursor: undefined }],
      ["address", { minHeight: 0, cursor: "1" }],
    ]);
    expect(events).toEqual([
      { state: versioned(emptyState()), progress: { counters: { operations: 1 } } },
      { state: versioned(emptyState()), progress: { counters: { operations: 2 } } },
      {
        state: versioned({
          syncedHeight: 100,
          balances: [{ value: "50", asset: native }],
          stakes: [],
        }),
        progress: { blockHeight: 100, counters: { operations: 2 } },
      },
    ]);
    expect(history.snapshot()).toEqual([
      expect.objectContaining({ id: "a", hash: "hash-a", value: 10n }),
      expect.objectContaining({ id: "b", hash: "hash-b", value: 10n }),
    ]);
    expect(coinModule.getStakes).not.toHaveBeenCalled();
  });

  it("resumes above the highest synced operation, keeping the history it already holds", async () => {
    const coinModule = aCoinModule({ operations: [[aCoinOperation("new", 95)]] });
    const history = createMemoryHistoryStore([aSyncedOperation("old", 40)]);
    const state = syncedState(90);

    const events = await collect(createSync(coinModule)(context, { descriptor, state, history }));

    expect(coinModule.listOperations).toHaveBeenCalledWith(context, "address", {
      minHeight: 41,
      cursor: undefined,
    });
    expect(events[0]!.state).toEqual(state);
    expect(ids(history.snapshot())).toEqual(["new", "old"]);
  });

  it("lists from height 0 a synced account without any operation", async () => {
    const coinModule = aCoinModule();

    await collect(
      createSync(coinModule)(context, {
        descriptor,
        state: syncedState(90),
        history: createMemoryHistoryStore(),
      }),
    );

    expect(coinModule.listOperations).toHaveBeenCalledWith(context, "address", {
      minHeight: 0,
      cursor: undefined,
    });
  });

  it.each([
    ["of another version", { version: 0, data: emptyState() }],
    ["whose last sync never completed", versioned(emptyState())],
  ])(
    "syncs from scratch with a state %s, dropping the operations the listing misses",
    async (_, state: Versioned<SingleAddressAccountState>) => {
      const coinModule = aCoinModule({ operations: [[aCoinOperation("kept", 40)]] });
      const pending = anOptimisticOperation({ id: "pending", hash: "pending-hash" });
      const history = createMemoryHistoryStore([
        aSyncedOperation("kept", 40),
        aSyncedOperation("reorganized", 41),
        pending,
      ]);

      const events = await collect(
        createSync(coinModule, { now: () => now })(context, { descriptor, state, history }),
      );

      expect(coinModule.listOperations).toHaveBeenCalledWith(context, "address", {
        minHeight: 0,
        cursor: undefined,
      });
      expect(events[0]!.state).toEqual(versioned(emptyState()));
      expect(ids(history.snapshot())).toEqual(["kept", "pending"]);
    },
  );

  it("leaves out the failed incoming operations, whose fee the account did not pay", async () => {
    const coinModule = aCoinModule({
      operations: [
        [
          aCoinOperation("failed-in", 90, { type: "IN" }, { failed: true }),
          aCoinOperation("failed-out", 90, { type: "OUT", senders: ["address"] }, { failed: true }),
        ],
      ],
    });
    const history = createMemoryHistoryStore();

    const events = await collect(
      createSync(coinModule)(context, { descriptor, state: undefined, history }),
    );

    expect(history.snapshot()).toEqual([
      expect.objectContaining({ id: "failed-out", value: 1n, failed: true }),
    ]);
    expect(events.at(-1)!.progress.counters).toEqual({ operations: 1 });
  });

  it("reads every page of stakes with includeStakes, and stores them with the balances", async () => {
    const stake: Stake = {
      uid: "stake",
      address: "address",
      state: "active",
      actions: [],
      asset: native,
      amount: 7n,
      details: { shares: 2n },
    };
    const coinModule = aCoinModule({
      balances: [{ value: 7n, asset: native, stake }],
      stakes: [[stake], [{ ...stake, uid: "other" }]],
    });

    const events = await collect(
      createSync(coinModule, { includeStakes: true })(context, {
        descriptor,
        state: undefined,
        history: createMemoryHistoryStore(),
      }),
    );

    expect(
      coinModule.getStakes.mock.calls.map(([, address, options]) => [address, options]),
    ).toEqual([
      ["address", {}],
      ["address", { cursor: "1" }],
    ]);
    const storedStake = { ...stake, amount: "7", details: { shares: "2" } };
    expect(events.at(-1)!.state.data).toEqual({
      syncedHeight: 100,
      balances: [{ value: "7", asset: native, stake: storedStake }],
      stakes: [storedStake, { ...storedStake, uid: "other" }],
    });
  });

  it("settles the optimistic operations the sync confirmed, replaced, or that expired", async () => {
    const coinModule = aCoinModule({
      operations: [
        [
          aCoinOperation("confirmed", 99, { type: "OUT" }, { hash: "broadcast-hash" }),
          aCoinOperation("sent", 98, { type: "OUT", details: { sequence: 5n } }),
        ],
      ],
    });
    const history = createMemoryHistoryStore([
      anOptimisticOperation({ id: "broadcast-hash-OUT", hash: "broadcast-hash" }),
      anOptimisticOperation({ id: "replaced", hash: "r", details: { sequence: "5" } }),
      anOptimisticOperation({ id: "expired", hash: "e", date: new Date(now - 1_001) }),
      anOptimisticOperation({ id: "pending", hash: "p", details: { sequence: "6" } }),
    ]);

    await collect(
      createSync(coinModule, { now: () => now, optimisticExpiryMs: 1_000 })(context, {
        descriptor,
        state: syncedState(90),
        history,
      }),
    );

    expect(ids(history.snapshot())).toEqual(["confirmed", "pending", "sent"]);
  });

  it("writes nothing to the history when a page fails", async () => {
    const coinModule = aCoinModule();
    coinModule.listOperations
      .mockResolvedValueOnce({ items: [aCoinOperation("a", 90)], next: "1" })
      .mockRejectedValueOnce(new Error("network"));
    const history = createMemoryHistoryStore();

    await expect(
      collect(createSync(coinModule)(context, { descriptor, state: undefined, history })),
    ).rejects.toThrow("network");
    expect(history.snapshot()).toEqual([]);
  });

  it("leaves the history alone when the listing brings nothing new", async () => {
    const history = createMemoryHistoryStore([aSyncedOperation("old", 40)]);
    jest.spyOn(history, "upsert");
    jest.spyOn(history, "remove");

    await collect(
      createSync(aCoinModule())(context, { descriptor, state: syncedState(90), history }),
    );

    expect(history.upsert).not.toHaveBeenCalled();
    expect(history.remove).not.toHaveBeenCalled();
  });

  describe("when aborted", () => {
    it("does not start", async () => {
      const coinModule = aCoinModule();
      const controller = new AbortController();
      controller.abort();

      await expect(
        collect(
          createSync(coinModule)(
            context,
            { descriptor, state: undefined, history: createMemoryHistoryStore() },
            { signal: controller.signal },
          ),
        ),
      ).rejects.toThrow();
      expect(coinModule.lastBlock).not.toHaveBeenCalled();
    });

    it("stops between two pages", async () => {
      const coinModule = aCoinModule({
        operations: [[aCoinOperation("a", 90)], [aCoinOperation("b", 80)]],
      });
      const controller = new AbortController();
      const history = createMemoryHistoryStore();
      const sync = createSync(coinModule)(
        context,
        { descriptor, state: undefined, history },
        { signal: controller.signal },
      );

      const events: SyncEvent<SingleAddressAccountState>[] = [];
      await expect(
        (async () => {
          for await (const event of sync) {
            events.push(event);
            controller.abort();
          }
        })(),
      ).rejects.toThrow();
      expect(events).toHaveLength(1);
      expect(history.snapshot()).toEqual([]);
    });

    it("writes nothing once the last read returns", async () => {
      const controller = new AbortController();
      const coinModule = aCoinModule({ operations: [[aCoinOperation("a", 90)]] });
      coinModule.getBalance.mockImplementation(async () => {
        controller.abort();
        return [];
      });
      const history = createMemoryHistoryStore();

      await expect(
        collect(
          createSync(coinModule)(
            context,
            { descriptor, state: undefined, history },
            { signal: controller.signal },
          ),
        ),
      ).rejects.toThrow();
      expect(history.snapshot()).toEqual([]);
    });
  });
});

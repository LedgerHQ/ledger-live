import {
  createMemoryHistoryStore,
  createMemoryStateStore,
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
import { UnexpectedGetBalanceError } from "@ledgerhq/coin-module-framework/errors";
import { emptyState, versioned } from "./state";
import { createRefresh } from "./sync";
import type {
  SingleAddressAccountModuleOptions,
  SingleAddressAccountState,
  SingleAddressScope,
} from "./types";

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

async function collect(events: AsyncIterable<SyncEvent>): Promise<SyncEvent[]> {
  const collected: SyncEvent[] = [];
  for await (const event of events) collected.push(event);
  return collected;
}

const ids = (operations: AccountOperation[]) => operations.map(op => op.id).sort();

const refreshedAt = { balances: 1, stakes: 2, operations: 3 };

const syncedState = (syncedHeight: number) =>
  versioned({ syncedHeight, balances: [{ value: "1", asset: native }], stakes: [], refreshedAt });

const anAccount = (
  state?: Versioned<SingleAddressAccountState>,
  operations: AccountOperation[] = [],
) => ({
  descriptor,
  state: createMemoryStateStore<SingleAddressAccountState>(state),
  history: createMemoryHistoryStore(operations),
});

type Account = ReturnType<typeof anAccount>;

/** The sync of a module: the refresh of all its scopes. */
const createSync =
  (coinModule: ReturnType<typeof aCoinModule>, options: SingleAddressAccountModuleOptions = {}) =>
  (account: Account, signal?: AbortSignal) => {
    const { scopes, refresh } = createRefresh(coinModule, { now: () => now, ...options });
    return refresh(context, account, scopes, signal);
  };

const refreshOf = (
  coinModule: ReturnType<typeof aCoinModule>,
  account: Account,
  scopes: SingleAddressScope[],
  options: SingleAddressAccountModuleOptions = {},
) => createRefresh(coinModule, { now: () => now, ...options }).refresh(context, account, scopes);

describe("sync", () => {
  it("lists every page from height 0 on a first sync, then records the operations, balances and tip", async () => {
    const coinModule = aCoinModule({
      operations: [[aCoinOperation("a", 90)], [aCoinOperation("b", 80)]],
    });
    const account = anAccount();
    const { history, state } = account;
    const put = jest.spyOn(state, "put");

    const events = await collect(createSync(coinModule)(account));

    expect(
      coinModule.listOperations.mock.calls.map(([, address, options]) => [address, options]),
    ).toEqual([
      ["address", { minHeight: 0, cursor: undefined, order: "desc" }],
      ["address", { minHeight: 0, cursor: "1", order: "desc" }],
    ]);
    expect(events).toEqual([
      { progress: { counters: { operations: 1 } } },
      { progress: { counters: { operations: 2 } } },
      { progress: { blockHeight: 100, counters: { operations: 2 } } },
    ]);
    expect(put).toHaveBeenCalledTimes(1);
    expect(state.snapshot()).toEqual(
      versioned({
        syncedHeight: 100,
        balances: [{ value: "50", asset: native }],
        stakes: [],
        refreshedAt: { balances: now, stakes: 0, operations: now },
      }),
    );
    expect(history.snapshot()).toEqual([
      expect.objectContaining({ id: "a", hash: "hash-a", value: 10n }),
      expect.objectContaining({ id: "b", hash: "hash-b", value: 10n }),
    ]);
    expect(coinModule.getStakes).not.toHaveBeenCalled();
  });

  it("resumes above the highest synced operation, keeping the history it already holds", async () => {
    const coinModule = aCoinModule({ operations: [[aCoinOperation("new", 95)]] });
    const account = anAccount(syncedState(90), [aSyncedOperation("old", 40)]);

    await collect(createSync(coinModule)(account));

    expect(coinModule.listOperations).toHaveBeenCalledWith(context, "address", {
      minHeight: 41,
      cursor: undefined,
      order: "desc",
    });
    expect(ids(account.history.snapshot())).toEqual(["new", "old"]);
    expect(account.state.snapshot()?.data).toMatchObject({ syncedHeight: 100 });
  });

  it("migrates a version 1 state, resuming above its history as before", async () => {
    const coinModule = aCoinModule({ operations: [[aCoinOperation("new", 95)]] });
    const v1 = { syncedHeight: 90, balances: [{ value: "1", asset: native }], stakes: [] };
    const account = anAccount({ version: 1, data: v1 as never }, [aSyncedOperation("old", 40)]);

    await collect(createSync(coinModule)(account));

    expect(coinModule.listOperations).toHaveBeenCalledWith(context, "address", {
      minHeight: 41,
      cursor: undefined,
      order: "desc",
    });
    expect(account.state.snapshot()).toEqual(
      versioned({
        syncedHeight: 100,
        balances: [{ value: "50", asset: native }],
        stakes: [],
        refreshedAt: { balances: now, stakes: 0, operations: now },
      }),
    );
  });

  it("lists from height 0 a synced account without any operation", async () => {
    const coinModule = aCoinModule();

    await collect(createSync(coinModule)(anAccount(syncedState(90))));

    expect(coinModule.listOperations).toHaveBeenCalledWith(context, "address", {
      minHeight: 0,
      cursor: undefined,
      order: "desc",
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
      const account = anAccount(state, [
        aSyncedOperation("kept", 40),
        aSyncedOperation("reorganized", 41),
        pending,
      ]);

      await collect(createSync(coinModule)(account));

      expect(coinModule.listOperations).toHaveBeenCalledWith(context, "address", {
        minHeight: 0,
        cursor: undefined,
        order: "desc",
      });
      expect(ids(account.history.snapshot())).toEqual(["kept", "pending"]);
      expect(account.state.snapshot()?.data.syncedHeight).toBe(100);
    },
  );

  it("reads the balances without options, unless the module has some", async () => {
    const plain = aCoinModule();
    await collect(createSync(plain)(anAccount()));
    expect(plain.getBalance.mock.calls).toEqual([[context, "address"]]);

    const filtered = aCoinModule();
    const balanceOptions = { includeAssets: async () => true };
    await collect(createSync(filtered, { balanceOptions })(anAccount()));
    expect(filtered.getBalance.mock.calls).toEqual([[context, "address", balanceOptions]]);
  });

  it("fails as the bridge does when the balances cannot be read, the cause kept, before any listing", async () => {
    const coinModule = aCoinModule({ operations: [[aCoinOperation("a", 90)]] });
    const cause = Object.assign(new Error("Method Not Allowed"), { status: 405 });
    coinModule.getBalance.mockRejectedValue(cause);
    const account = anAccount(syncedState(90));

    const failure = await collect(createSync(coinModule)(account)).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(UnexpectedGetBalanceError);
    expect(failure).toMatchObject({ name: "UnexpectedGetBalanceError", cause });
    // A listing the region redirects would fail first, with an error of its own.
    expect(coinModule.listOperations).not.toHaveBeenCalled();
    expect(account.history.snapshot()).toEqual([]);
    expect(account.state.snapshot()).toEqual(syncedState(90));
  });

  it("reads the tip, the balances and the stakes together, then lists the operations", async () => {
    const reads: string[] = [];
    const coinModule = aCoinModule({ operations: [[aCoinOperation("a", 90)]] });
    for (const name of ["lastBlock", "getBalance", "getStakes", "listOperations"] as const) {
      const read = coinModule[name].getMockImplementation() as (...args: unknown[]) => unknown;
      coinModule[name].mockImplementation((async (...args: unknown[]) => {
        reads.push(`${name} started`);
        const answer = await read(...args);
        reads.push(`${name} answered`);
        return answer;
      }) as never);
    }

    await collect(createSync(coinModule, { includeStakes: true })(anAccount()));

    expect(reads.slice(0, 3)).toEqual([
      "lastBlock started",
      "getBalance started",
      "getStakes started",
    ]);
    expect(reads.indexOf("listOperations started")).toBeGreaterThan(
      Math.max(
        reads.indexOf("lastBlock answered"),
        reads.indexOf("getBalance answered"),
        reads.indexOf("getStakes answered"),
      ),
    );
  });

  it("leaves out the failed incoming operations, whose fee the account did not pay", async () => {
    const coinModule = aCoinModule({
      operations: [
        [
          aCoinOperation("failed-in", 90, { type: "IN" }, { failed: true }),
          aCoinOperation("failed-out", 90, { type: "OUT", senders: ["address"] }, { failed: true }),
        ],
      ],
    });
    const account = anAccount();
    const { history } = account;

    const events = await collect(createSync(coinModule)(account));

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

    const account = anAccount();

    await collect(createSync(coinModule, { includeStakes: true })(account));

    expect(
      coinModule.getStakes.mock.calls.map(([, address, options]) => [address, options]),
    ).toEqual([
      ["address", {}],
      ["address", { cursor: "1" }],
    ]);
    const storedStake = { ...stake, amount: "7", details: { shares: "2" } };
    expect(account.state.snapshot()?.data).toEqual({
      syncedHeight: 100,
      balances: [{ value: "7", asset: native, stake: storedStake }],
      stakes: [storedStake, { ...storedStake, uid: "other" }],
      refreshedAt: { balances: now, stakes: now, operations: now },
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
    const account = anAccount(syncedState(90), [
      anOptimisticOperation({ id: "broadcast-hash-OUT", hash: "broadcast-hash" }),
      anOptimisticOperation({ id: "replaced", hash: "r", details: { sequence: "5" } }),
      anOptimisticOperation({ id: "expired", hash: "e", date: new Date(now - 1_001) }),
      anOptimisticOperation({ id: "pending", hash: "p", details: { sequence: "6" } }),
    ]);

    await collect(createSync(coinModule, { optimisticExpiryMs: 1_000 })(account));

    expect(ids(account.history.snapshot())).toEqual(["confirmed", "pending", "sent"]);
  });

  it("writes nothing to the history when a page fails", async () => {
    const coinModule = aCoinModule();
    coinModule.listOperations
      .mockResolvedValueOnce({ items: [aCoinOperation("a", 90)], next: "1" })
      .mockRejectedValueOnce(new Error("network"));
    const account = anAccount();

    await expect(collect(createSync(coinModule)(account))).rejects.toThrow("network");
    expect(account.history.snapshot()).toEqual([]);
    expect(account.state.snapshot()).toBeUndefined();
  });

  it("leaves the history alone when the listing brings nothing new", async () => {
    const account = anAccount(syncedState(90), [aSyncedOperation("old", 40)]);
    const { history } = account;
    jest.spyOn(history, "upsert");
    jest.spyOn(history, "remove");

    await collect(createSync(aCoinModule())(account));

    expect(history.upsert).not.toHaveBeenCalled();
    expect(history.remove).not.toHaveBeenCalled();
  });

  describe("when aborted", () => {
    it("does not start", async () => {
      const coinModule = aCoinModule();
      const controller = new AbortController();
      controller.abort();

      await expect(
        collect(createSync(coinModule)(anAccount(), controller.signal)),
      ).rejects.toThrow();
      expect(coinModule.lastBlock).not.toHaveBeenCalled();
    });

    it("stops between two pages", async () => {
      const coinModule = aCoinModule({
        operations: [[aCoinOperation("a", 90)], [aCoinOperation("b", 80)]],
      });
      const controller = new AbortController();
      const account = anAccount();
      const { history } = account;
      const sync = createSync(coinModule)(account, controller.signal);

      const events: SyncEvent[] = [];
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
      expect(account.state.snapshot()).toBeUndefined();
    });

    it("lists nothing once the tip and balances are read", async () => {
      const controller = new AbortController();
      const coinModule = aCoinModule({ operations: [[aCoinOperation("a", 90)]] });
      coinModule.getBalance.mockImplementation(async () => {
        controller.abort();
        return [];
      });
      const account = anAccount();
      const { history } = account;

      await expect(collect(createSync(coinModule)(account, controller.signal))).rejects.toThrow();
      expect(coinModule.listOperations).not.toHaveBeenCalled();
      expect(history.snapshot()).toEqual([]);
    });

    it("writes nothing once the last page is read", async () => {
      const controller = new AbortController();
      const coinModule = aCoinModule({ operations: [[aCoinOperation("a", 90)]] });
      const account = anAccount();
      const { history } = account;
      const sync = createSync(coinModule)(account, controller.signal);

      await expect(
        (async () => {
          for await (const event of sync) {
            if (event.progress.counters?.operations === 1) controller.abort();
          }
        })(),
      ).rejects.toThrow();
      expect(history.snapshot()).toEqual([]);
    });
  });
});

describe("refresh of one scope", () => {
  it("reads the balances alone, keeping the other scopes as stored", async () => {
    const coinModule = aCoinModule({ balances: [{ value: 70n, asset: native }] });
    const account = anAccount(syncedState(90), [aSyncedOperation("old", 40)]);

    const events = await collect(refreshOf(coinModule, account, ["balances"]));

    expect(coinModule.getBalance).toHaveBeenCalledTimes(1);
    expect(coinModule.lastBlock).not.toHaveBeenCalled();
    expect(coinModule.listOperations).not.toHaveBeenCalled();
    expect(coinModule.getStakes).not.toHaveBeenCalled();
    expect(events).toEqual([{ progress: {} }]);
    expect(account.state.snapshot()).toEqual(
      versioned({
        syncedHeight: 90,
        balances: [{ value: "70", asset: native }],
        stakes: [],
        refreshedAt: { ...refreshedAt, balances: now },
      }),
    );
    expect(ids(account.history.snapshot())).toEqual(["old"]);
  });

  it("reads the stakes alone", async () => {
    const stake: Stake = {
      uid: "stake",
      address: "address",
      state: "active",
      actions: [],
      asset: native,
      amount: 7n,
    };
    const coinModule = aCoinModule({ stakes: [[stake]] });
    const account = anAccount(syncedState(90));

    await collect(refreshOf(coinModule, account, ["stakes"], { includeStakes: true }));

    expect(coinModule.getStakes).toHaveBeenCalledTimes(1);
    expect(coinModule.getBalance).not.toHaveBeenCalled();
    expect(coinModule.lastBlock).not.toHaveBeenCalled();
    expect(account.state.snapshot()?.data).toEqual({
      ...syncedState(90).data,
      stakes: [{ ...stake, amount: "7" }],
      refreshedAt: { ...refreshedAt, stakes: now },
    });
  });

  it("lists the operations alone, from the tip, settling the optimistic ones", async () => {
    const coinModule = aCoinModule({
      operations: [[aCoinOperation("new", 95, { type: "OUT" }, { hash: "sent" })]],
    });
    const account = anAccount(syncedState(90), [
      aSyncedOperation("old", 40),
      anOptimisticOperation({ id: "sent-OUT", hash: "sent" }),
    ]);

    const events = await collect(refreshOf(coinModule, account, ["operations"]));

    expect(coinModule.getBalance).not.toHaveBeenCalled();
    expect(coinModule.listOperations).toHaveBeenCalledWith(context, "address", {
      minHeight: 41,
      cursor: undefined,
      order: "desc",
    });
    expect(events.at(-1)).toEqual({
      progress: { blockHeight: 100, counters: { operations: 1 } },
    });
    expect(ids(account.history.snapshot())).toEqual(["new", "old"]);
    expect(account.state.snapshot()).toEqual(
      versioned({
        ...syncedState(90).data,
        syncedHeight: 100,
        refreshedAt: { ...refreshedAt, operations: now },
      }),
    );
  });

  it("stamps the refresh with the current time by default", async () => {
    const clock = jest.spyOn(Date, "now").mockReturnValue(now + 5);
    const account = anAccount();

    await collect(createRefresh(aCoinModule()).refresh(context, account, ["balances"]));

    expect(account.state.snapshot()?.data.refreshedAt.balances).toBe(now + 5);
    clock.mockRestore();
  });

  it("starts from an empty state for an account never synced", async () => {
    const account = anAccount();

    await collect(refreshOf(aCoinModule(), account, ["balances"]));

    expect(account.state.snapshot()).toEqual(
      versioned({
        ...emptyState(),
        balances: [{ value: "50", asset: native }],
        refreshedAt: { balances: now, stakes: 0, operations: 0 },
      }),
    );
  });
});

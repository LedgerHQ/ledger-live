import { configureStore } from "@reduxjs/toolkit";
import { AccountRefSchema, type AccountRef } from "@domain/entity-account";
import {
  accountBalanceBinding,
  accountBalancesSlice,
  selectAccountBalance,
  selectAccountBalanceStatus,
  type AccountBalance,
} from "@domain/entity-account-balance";
import { mockAccountBalance } from "@domain/entity-account-balance/schema.mock";
import {
  accountOperationsBinding,
  accountOperationsSlice,
  selectAccountOperations,
  selectAccountOperationsStatus,
  type AccountOperationsPage,
} from "@domain/entity-account-operations";
import { mockAccountOperation } from "@domain/entity-account-operations/schema.mock";
import { DateTimeIsoSchema } from "@shared/schema-primitives";
import { fetchAccountData } from "./fetchAccountData";
import { createAccountDataRouter } from "./router";
import type { AccountDataSource } from "./source";

const ref: AccountRef = AccountRefSchema.parse({
  accountId: "js:2:ethereum:0xabc:",
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
});
const { accountId } = ref;

function makeStore(sources: AccountDataSource[], extra: unknown = undefined) {
  return configureStore({
    reducer: {
      accountBalances: accountBalancesSlice.reducer,
      accountOperations: accountOperationsSlice.reducer,
    },
    middleware: getDefault =>
      getDefault({
        thunk: { extraArgument: extra ?? { accountData: createAccountDataRouter(sources) } },
      }),
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => (resolve = r));
  return { promise, resolve };
}

const balanceRows = (): AccountBalance[] => [
  mockAccountBalance({ at: DateTimeIsoSchema.parse(new Date().toISOString()) }),
];

const page = (ids: string[], nextCursor?: string): AccountOperationsPage => ({
  operations: ids.map((id, i) =>
    mockAccountOperation({
      id,
      date: DateTimeIsoSchema.parse(new Date(Date.UTC(2026, 0, 31 - i)).toISOString()),
    }),
  ),
  complete: nextCursor === undefined,
  ...(nextCursor === undefined ? {} : { nextCursor }),
});

describe("fetchAccountData", () => {
  describe("a head read", () => {
    it("stores what the chosen source answered, and which source it was", async () => {
      const store = makeStore([
        { id: "full-sync", supports: () => true, balance: async () => balanceRows() },
      ]);
      await store.dispatch(fetchAccountData(accountBalanceBinding, ref));
      expect(selectAccountBalance(store.getState(), accountId)?.balance).toBe(
        "1000000000000000000",
      );
      expect(selectAccountBalanceStatus(store.getState(), accountId)).toEqual({
        pending: false,
        sourceId: "full-sync",
      });
    });

    it("records a failure when no source can answer", async () => {
      const store = makeStore([{ id: "nothing", supports: () => false }]);
      await store.dispatch(fetchAccountData(accountBalanceBinding, ref));
      expect(selectAccountBalanceStatus(store.getState(), accountId).error).toMatch(
        /No account balance source/,
      );
    });

    it("records a failure when the app forgot to inject the router", async () => {
      const store = makeStore([], {});
      await store.dispatch(fetchAccountData(accountBalanceBinding, ref));
      expect(selectAccountBalanceStatus(store.getState(), accountId).error).toMatch(
        /No account data router/,
      );
    });

    it("does not repeat a read younger than maxAge, and repeats it with maxAge 0", async () => {
      const balance = jest.fn(async () => balanceRows());
      const store = makeStore([{ id: "s", supports: () => true, balance }]);
      await store.dispatch(fetchAccountData(accountBalanceBinding, ref));
      await store.dispatch(fetchAccountData(accountBalanceBinding, ref));
      expect(balance).toHaveBeenCalledTimes(1);
      await store.dispatch(fetchAccountData(accountBalanceBinding, ref, { maxAge: 0 }));
      expect(balance).toHaveBeenCalledTimes(2);
    });

    it("treats a stamp from the future as stale rather than fresh", async () => {
      const ahead = new Date(Date.now() + 3_600_000).toISOString();
      const balance = jest.fn(async () => [
        mockAccountBalance({ at: DateTimeIsoSchema.parse(ahead) }),
      ]);
      const store = makeStore([{ id: "s", supports: () => true, balance }]);
      await store.dispatch(fetchAccountData(accountBalanceBinding, ref));
      await store.dispatch(fetchAccountData(accountBalanceBinding, ref));
      expect(balance).toHaveBeenCalledTimes(2);
    });

    it("joins a read already in flight for the same ref", async () => {
      const gate = deferred<AccountBalance[]>();
      const balance = jest.fn(() => gate.promise);
      const store = makeStore([{ id: "s", supports: () => true, balance }]);
      const first = store.dispatch(fetchAccountData(accountBalanceBinding, ref));
      const second = store.dispatch(fetchAccountData(accountBalanceBinding, ref));
      gate.resolve(balanceRows());
      await Promise.all([first, second]);
      expect(balance).toHaveBeenCalledTimes(1);
    });

    it("does not drop a read for another ref of the same account", async () => {
      const gate = deferred<AccountBalance[]>();
      const balance = jest.fn(() => gate.promise);
      const store = makeStore([{ id: "s", supports: () => true, balance }]);
      const first = store.dispatch(fetchAccountData(accountBalanceBinding, ref));
      const second = store.dispatch(
        fetchAccountData(accountBalanceBinding, { ...ref, address: "0xrotated" }),
      );
      gate.resolve(balanceRows());
      await Promise.all([first, second]);
      expect(balance).toHaveBeenCalledTimes(2);
    });

    it("keeps two datums of one account independent", async () => {
      const store = makeStore([
        {
          id: "s",
          supports: () => true,
          balance: async () => balanceRows(),
          operations: async () => page(["op-1"]),
        },
      ]);
      await Promise.all([
        store.dispatch(fetchAccountData(accountBalanceBinding, ref)),
        store.dispatch(fetchAccountData(accountOperationsBinding, ref)),
      ]);
      expect(selectAccountBalance(store.getState(), accountId)).toBeDefined();
      expect(selectAccountOperations(store.getState(), accountId)).toHaveLength(1);
    });

    it("passes the query through to the source", async () => {
      const operations = jest.fn(async () => page(["op-1"]));
      const store = makeStore([{ id: "s", supports: () => true, operations }]);
      await store.dispatch(
        fetchAccountData(accountOperationsBinding, ref, { query: { limit: 10 } }),
      );
      expect(operations).toHaveBeenCalledWith(ref, { limit: 10 }, undefined);
    });
  });

  describe("a next page", () => {
    it("resumes from the stored cursor, keeps the page size and merges the page", async () => {
      const operations = jest.fn(async (_ref: AccountRef, query?: { cursor?: string }) =>
        query?.cursor === "c1" ? page(["op-2"]) : page(["op-1"], "c1"),
      );
      const store = makeStore([{ id: "s", supports: () => true, operations }]);
      await store.dispatch(
        fetchAccountData(accountOperationsBinding, ref, { query: { limit: 1 } }),
      );
      await store.dispatch(
        fetchAccountData(accountOperationsBinding, ref, { query: { limit: 1 }, more: true }),
      );
      expect(operations).toHaveBeenLastCalledWith(ref, { limit: 1, cursor: "c1" }, undefined);
      expect(selectAccountOperations(store.getState(), accountId).map(o => o.id)).toEqual([
        "op-1",
        "op-2",
      ]);
    });

    it("does nothing once the history is complete", async () => {
      const operations = jest.fn(async () => page(["op-1"]));
      const store = makeStore([{ id: "s", supports: () => true, operations }]);
      await store.dispatch(fetchAccountData(accountOperationsBinding, ref));
      await store.dispatch(fetchAccountData(accountOperationsBinding, ref, { more: true }));
      expect(operations).toHaveBeenCalledTimes(1);
    });

    it("does nothing on a datum that is not paginated", async () => {
      const balance = jest.fn(async () => balanceRows());
      const store = makeStore([{ id: "s", supports: () => true, balance }]);
      await store.dispatch(fetchAccountData(accountBalanceBinding, ref, { more: true }));
      expect(balance).not.toHaveBeenCalled();
    });

    it("is not guarded by freshness: reaching the bottom always reads", async () => {
      const operations = jest.fn(async (_ref: AccountRef, query?: { cursor?: string }) =>
        query?.cursor ? page([`op-${query.cursor}`], `${query.cursor}x`) : page(["op-1"], "c"),
      );
      const store = makeStore([{ id: "s", supports: () => true, operations }]);
      await store.dispatch(fetchAccountData(accountOperationsBinding, ref));
      await store.dispatch(fetchAccountData(accountOperationsBinding, ref, { more: true }));
      await store.dispatch(fetchAccountData(accountOperationsBinding, ref, { more: true }));
      expect(operations).toHaveBeenCalledTimes(3);
    });

    it("asks only the source that answered the head, never hands its cursor to another", async () => {
      let granularOn = false;
      const granular = jest.fn(async () => page(["op-granular"]));
      const store = makeStore([
        {
          id: "granular",
          supports: () => granularOn,
          operations: granular,
        },
        {
          id: "paged-legacy",
          supports: () => true,
          operations: async (_ref, query) =>
            query?.cursor ? page(["op-2"]) : page(["op-1"], "legacy-cursor"),
        },
      ]);
      await store.dispatch(fetchAccountData(accountOperationsBinding, ref));
      granularOn = true;
      await store.dispatch(fetchAccountData(accountOperationsBinding, ref, { more: true }));
      expect(granular).not.toHaveBeenCalled();
      expect(selectAccountOperationsStatus(store.getState(), accountId).sourceId).toBe(
        "paged-legacy",
      );
    });
  });
});

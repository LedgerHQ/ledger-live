import { configureStore } from "@reduxjs/toolkit";
import type { AccountRef } from "@domain/entity-account";
import { accountBalanceBinding, accountBalancesSlice } from "@domain/entity-account-balance";
import { mockAccountBalance } from "@domain/entity-account-balance/schema.mock";
import {
  accountOperationsBinding,
  accountOperationsSlice,
} from "@domain/entity-account-operations";
import { mockAccountOperation } from "@domain/entity-account-operations/schema.mock";
import { DateTimeIsoSchema } from "@shared/schema-primitives";
import { createAccountDataRouter, fetchAccountData, type AccountDataSource } from ".";

const ref = {
  accountId: mockAccountBalance().accountId,
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
} as AccountRef;

const makeStore = (sources: AccountDataSource[]) =>
  configureStore({
    reducer: {
      accountBalances: accountBalancesSlice.reducer,
      accountOperations: accountOperationsSlice.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        thunk: { extraArgument: { accountData: createAccountDataRouter(sources) } },
      }),
  });

const source = (methods: Partial<AccountDataSource>, id = "fake"): AccountDataSource => ({
  id,
  supports: () => true,
  ...methods,
});

describe("fetchAccountData, balance", () => {
  it("stores the data and the source that answered", async () => {
    const store = makeStore([source({ balance: async () => [mockAccountBalance()] })]);
    await store.dispatch(fetchAccountData(accountBalanceBinding, ref));
    expect(store.getState().accountBalances.rows[ref.accountId]?.balance).toBe(
      "1000000000000000000",
    );
    expect(store.getState().accountBalances.status[ref.accountId]).toEqual({
      pending: false,
      sourceId: "fake",
    });
  });

  it("skips a read while the stored data is fresh, unless maxAge is 0", async () => {
    const at = DateTimeIsoSchema.parse(new Date().toISOString());
    const balance = jest.fn(async () => [mockAccountBalance({ at })]);
    const store = makeStore([source({ balance })]);
    await store.dispatch(fetchAccountData(accountBalanceBinding, ref));
    await store.dispatch(fetchAccountData(accountBalanceBinding, ref));
    expect(balance).toHaveBeenCalledTimes(1);
    await store.dispatch(fetchAccountData(accountBalanceBinding, ref, { maxAge: 0 }));
    expect(balance).toHaveBeenCalledTimes(2);
  });

  it("treats a stamp in the future as stale", async () => {
    const future = DateTimeIsoSchema.parse(new Date(Date.now() + 3_600_000).toISOString());
    const balance = jest.fn(async () => [mockAccountBalance({ at: future })]);
    const store = makeStore([source({ balance })]);
    await store.dispatch(fetchAccountData(accountBalanceBinding, ref));
    await store.dispatch(fetchAccountData(accountBalanceBinding, ref));
    expect(balance).toHaveBeenCalledTimes(2);
  });

  it("skips a read while one is in flight for the same ref, not for another ref", async () => {
    const releases: Array<() => void> = [];
    const balance = jest.fn(
      () => new Promise<never[]>(resolve => releases.push(() => resolve([]))),
    );
    const store = makeStore([source({ balance })]);
    const first = store.dispatch(fetchAccountData(accountBalanceBinding, ref));
    await store.dispatch(fetchAccountData(accountBalanceBinding, ref));
    expect(balance).toHaveBeenCalledTimes(1);
    const second = store.dispatch(
      fetchAccountData(accountBalanceBinding, { ...ref, address: "0xnew" }),
    );
    expect(balance).toHaveBeenCalledTimes(2);
    releases.forEach(release => release());
    await Promise.all([first, second]);
  });

  it("records the failure when no source supports the account", async () => {
    const store = makeStore([]);
    await store.dispatch(fetchAccountData(accountBalanceBinding, ref));
    expect(store.getState().accountBalances.status[ref.accountId]?.error).toMatch(
      /No account data source/,
    );
  });
});

describe("fetchAccountData, operations", () => {
  const page = (id: string, nextCursor?: string) => ({
    operations: [mockAccountOperation({ id })],
    complete: nextCursor === undefined,
    ...(nextCursor === undefined ? {} : { nextCursor }),
  });

  it("appends the next page from the stored cursor, without a freshness guard", async () => {
    const operations = jest
      .fn()
      .mockResolvedValueOnce(page("op-1", "c1"))
      .mockResolvedValueOnce(page("op-2"));
    const store = makeStore([source({ operations })]);

    await store.dispatch(fetchAccountData(accountOperationsBinding, ref));
    await store.dispatch(fetchAccountData(accountOperationsBinding, ref, { more: true }));

    expect(operations).toHaveBeenNthCalledWith(2, ref, { cursor: "c1", limit: 50 }, undefined);
    const entry = store.getState().accountOperations.byAccount[ref.accountId];
    expect(entry?.operations.map(op => op.id).sort()).toEqual(["op-1", "op-2"]);
    expect(entry?.complete).toBe(true);
  });

  it("never sends a cursor to another source than the one that answered the head", async () => {
    const head = jest.fn().mockResolvedValue(page("op-1", "c1"));
    const other = jest.fn();
    const store = makeStore([
      source({ operations: head }, "coin-module"),
      source({ operations: other }, "full-sync"),
    ]);
    await store.dispatch(fetchAccountData(accountOperationsBinding, ref));
    head.mockRejectedValueOnce(new Error("down"));
    await store.dispatch(fetchAccountData(accountOperationsBinding, ref, { more: true }));
    expect(other).not.toHaveBeenCalled();
    expect(store.getState().accountOperations.status[ref.accountId]?.error).toBe("down");
  });

  it("does nothing to load more without a cursor", async () => {
    const operations = jest.fn();
    const store = makeStore([source({ operations })]);
    await store.dispatch(fetchAccountData(accountOperationsBinding, ref, { more: true }));
    expect(operations).not.toHaveBeenCalled();
  });
});

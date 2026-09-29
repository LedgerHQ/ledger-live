import { configureStore } from "@reduxjs/toolkit";
import { accountBalancesSlice } from "@domain/entity-account-balance";
import { mockAccountBalance } from "@domain/entity-account-balance/schema.mock";
import { DateTimeIsoSchema } from "@shared/schema-primitives";
import {
  createAccountDataRouter,
  type AccountDataSource,
  type AccountRef,
} from "@features/platform-account-data";
import { fetchAccountBalance } from ".";

const ref = {
  accountId: "js:2:ethereum:0xabc:",
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
} as AccountRef;

const makeStore = () =>
  configureStore({ reducer: { accountBalances: accountBalancesSlice.reducer } });

const routerOf = (methods: Partial<AccountDataSource>) =>
  createAccountDataRouter([{ id: "fake", supports: () => true, ...methods }]);

describe("fetchAccountBalance", () => {
  it("stores the balances and the source that answered", async () => {
    const store = makeStore();
    const router = routerOf({ getBalances: async () => [mockAccountBalance()] });
    await store.dispatch(fetchAccountBalance(router, ref));
    expect(store.getState().accountBalances.rows[ref.accountId]?.balance).toBe(
      "1000000000000000000",
    );
    expect(store.getState().accountBalances.status[ref.accountId]).toEqual({
      pending: false,
      sourceId: "fake",
    });
  });

  it("does not read again while the stored balance is fresh, unless maxAge is 0", async () => {
    const store = makeStore();
    const getBalances = jest.fn(async () => [
      mockAccountBalance({ at: DateTimeIsoSchema.parse(new Date().toISOString()) }),
    ]);
    const router = routerOf({ getBalances });
    await store.dispatch(fetchAccountBalance(router, ref));
    await store.dispatch(fetchAccountBalance(router, ref));
    expect(getBalances).toHaveBeenCalledTimes(1);
    await store.dispatch(fetchAccountBalance(router, ref, { maxAge: 0 }));
    expect(getBalances).toHaveBeenCalledTimes(2);
  });

  it("skips a read while one is pending", async () => {
    const store = makeStore();
    let release: () => void = () => undefined;
    const getBalances = jest.fn(
      () => new Promise<never[]>(resolve => (release = () => resolve([]))),
    );
    const router = routerOf({ getBalances });
    const first = store.dispatch(fetchAccountBalance(router, ref));
    await store.dispatch(fetchAccountBalance(router, ref));
    release();
    await first;
    expect(getBalances).toHaveBeenCalledTimes(1);
  });

  it("records the failure, including when no source supports the account", async () => {
    const store = makeStore();
    await store.dispatch(fetchAccountBalance(routerOf({}), ref));
    expect(store.getState().accountBalances.status[ref.accountId]?.error).toMatch(
      /No account data source/,
    );
  });
});

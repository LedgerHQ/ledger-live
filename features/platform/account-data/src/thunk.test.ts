import { configureStore } from "@reduxjs/toolkit";
import { AccountIdSchema } from "@shared/schema-primitives";
import {
  accountBalancesSlice,
  type AccountBalance,
  type WithAccountBalances,
} from "@domain/entity-account-balance";
import {
  mockAccountBalance,
  mockTokenAccountBalance,
} from "@domain/entity-account-balance/schema.mock";
import { getAccountBalanceSources, registerAccountBalanceSources } from "./register";
import { fetchAccountBalance } from "./thunk";
import type { AccountBalanceSource, AccountRef } from "./source";

const accountId = AccountIdSchema.parse("js:2:ethereum:0xabc:");
const ref: AccountRef = {
  accountId,
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
};

const makeStore = () =>
  configureStore({ reducer: { accountBalances: accountBalancesSlice.reducer } });

const sourceReturning = (
  id: string,
  balances: AccountBalance[],
  overrides: Partial<AccountBalanceSource> = {},
): AccountBalanceSource => ({
  id,
  priority: 10,
  supports: () => true,
  getBalances: async () => balances,
  ...overrides,
});

const select = accountBalancesSlice.selectors;

describe("fetchAccountBalance", () => {
  afterEach(() => registerAccountBalanceSources([]));

  it("writes the rows and records the source that answered", async () => {
    const store = makeStore();
    const rows = [mockAccountBalance(), mockTokenAccountBalance()];
    await store.dispatch(
      fetchAccountBalance(ref, { sources: [sourceReturning("granular", rows)] }),
    );

    const state = store.getState();
    expect(select.selectAccountBalance(state, accountId)).toEqual(rows[0]);
    expect(select.selectSubAccountBalances(state, accountId)).toEqual([rows[1]]);
    expect(select.selectAccountBalanceStatus(state, accountId)).toEqual({
      pending: false,
      sourceId: "granular",
    });
  });

  it("reads the registered sources when none are passed", async () => {
    registerAccountBalanceSources([sourceReturning("registered", [mockAccountBalance()])]);
    expect(getAccountBalanceSources()).toHaveLength(1);

    const store = makeStore();
    await store.dispatch(fetchAccountBalance(ref));
    expect(select.selectAccountBalanceStatus(store.getState(), accountId).sourceId).toBe(
      "registered",
    );
  });

  it("skips a balance that is still fresh", async () => {
    const store = makeStore();
    let calls = 0;
    const sources = [
      sourceReturning("granular", [], {
        getBalances: async () => {
          calls++;
          return [mockAccountBalance({ at: new Date().toISOString() as never })];
        },
      }),
    ];

    await store.dispatch(fetchAccountBalance(ref, { sources }));
    await store.dispatch(fetchAccountBalance(ref, { sources }));
    expect(calls).toBe(1);
  });

  it("forces a round-trip on maxAge 0", async () => {
    const store = makeStore();
    let calls = 0;
    const sources = [
      sourceReturning("granular", [], {
        getBalances: async () => {
          calls++;
          return [mockAccountBalance({ at: new Date().toISOString() as never })];
        },
      }),
    ];

    await store.dispatch(fetchAccountBalance(ref, { sources }));
    await store.dispatch(fetchAccountBalance(ref, { sources, maxAge: 0 }));
    expect(calls).toBe(2);
  });

  it("coalesces concurrent reads of the same account into one", async () => {
    const store = makeStore();
    let calls = 0;
    const sources = [
      sourceReturning("granular", [], {
        getBalances: async () => {
          calls++;
          return [mockAccountBalance()];
        },
      }),
    ];

    await Promise.all([
      store.dispatch(fetchAccountBalance(ref, { sources })),
      store.dispatch(fetchAccountBalance(ref, { sources })),
      store.dispatch(fetchAccountBalance(ref, { sources })),
    ]);
    expect(calls).toBe(1);
  });

  it("records a failure without dropping the rows already there", async () => {
    const store = makeStore();
    const rows = [mockAccountBalance()];
    await store.dispatch(
      fetchAccountBalance(ref, { sources: [sourceReturning("granular", rows)] }),
    );

    await store.dispatch(
      fetchAccountBalance(ref, {
        maxAge: 0,
        sources: [
          sourceReturning("granular", [], {
            getBalances: async () => {
              throw new Error("network down");
            },
          }),
        ],
      }),
    );

    const state = store.getState();
    expect(select.selectAccountBalanceStatus(state, accountId)).toEqual({
      pending: false,
      error: "network down",
      sourceId: "granular",
    });
    expect(select.selectAccountBalance(state, accountId)).toEqual(rows[0]);
  });

  it("records an error when nothing supports the ref", async () => {
    const store = makeStore();
    await store.dispatch(fetchAccountBalance(ref, { sources: [] }));
    expect(select.selectAccountBalanceStatus(store.getState(), accountId).error).toContain(
      "No account balance source",
    );
  });

  it("does nothing for a token-account ref", async () => {
    const store = makeStore();
    let calls = 0;
    await store.dispatch(
      fetchAccountBalance(
        { ...ref, accountId: mockTokenAccountBalance().accountId, parentId: accountId },
        {
          sources: [
            sourceReturning("granular", [], {
              getBalances: async () => {
                calls++;
                return [];
              },
            }),
          ],
        },
      ),
    );
    expect(calls).toBe(0);
    expect(store.getState().accountBalances).toEqual({ rows: {}, status: {} });
  });

  it("runs without a store, over the reducer alone", async () => {
    let state: WithAccountBalances = {
      accountBalances: accountBalancesSlice.reducer(undefined, { type: "@@INIT" }),
    };
    const dispatch = (action: { type: string }) => {
      state = { accountBalances: accountBalancesSlice.reducer(state.accountBalances, action) };
    };

    await fetchAccountBalance(ref, {
      sources: [sourceReturning("cli", [mockAccountBalance()])],
    })(dispatch, () => state);

    expect(select.selectAccountBalance(state, accountId)).toEqual(mockAccountBalance());
  });
});

import { configureStore } from "@reduxjs/toolkit";
import { AccountIdSchema } from "@domain/entity-account";
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

  it("treats a stamp from the future as stale, not as fresh forever", async () => {
    // A clock that moved backwards, or a persisted row from a machine that was ahead: a negative age
    // must not read as "younger than maxAge" and freeze the account out of every later read.
    const store = makeStore();
    let calls = 0;
    const ahead = new Date(Date.now() + 3_600_000).toISOString();
    const sources = [
      sourceReturning("granular", [], {
        getBalances: async () => {
          calls++;
          return [mockAccountBalance({ at: ahead as never })];
        },
      }),
    ];

    await store.dispatch(fetchAccountBalance(ref, { sources }));
    await store.dispatch(fetchAccountBalance(ref, { sources }));
    expect(calls).toBe(2);
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

  it("does not coalesce a read of the same account under a different ref", async () => {
    const store = makeStore();
    const seen: string[] = [];
    const sources = [
      sourceReturning("granular", [], {
        getBalances: async (asked: AccountRef) => {
          seen.push(asked.address);
          return [mockAccountBalance()];
        },
      }),
    ];

    // A fresh address rotates while the first read is still in flight. Dropping the second read
    // would leave the table on the old ref's answer with nothing to re-trigger it.
    await Promise.all([
      store.dispatch(fetchAccountBalance(ref, { sources })),
      store.dispatch(fetchAccountBalance({ ...ref, address: "0xdef" }, { sources, maxAge: 0 })),
    ]);
    expect(seen).toEqual(["0xabc", "0xdef"]);
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

  it("fills the token rows from the parent's read, which is the only read there is", async () => {
    const store = makeStore();
    const token = mockTokenAccountBalance();
    await store.dispatch(
      fetchAccountBalance(ref, {
        sources: [sourceReturning("granular", [mockAccountBalance(), token])],
      }),
    );

    const state = store.getState();
    expect(select.selectAccountBalance(state, token.accountId)).toEqual(token);
    expect(select.selectAccountBalanceStatus(state, accountId).sourceId).toBe("granular");
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

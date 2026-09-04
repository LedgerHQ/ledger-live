import { AccountIdSchema } from "@shared/schema-primitives";
import { initialAccountBalancesState, type AccountBalancesState } from "./schema";
import { mockAccountBalance, mockTokenAccountBalance } from "./schema.mock";
import {
  accountBalanceFailed,
  accountBalanceReceived,
  accountBalanceRequested,
  accountBalancesRemoved,
  accountBalancesReset,
  accountBalancesSlice,
} from "./slice";

const reducer = accountBalancesSlice.reducer;
const select = accountBalancesSlice.getSelectors();

const main = mockAccountBalance();
const token = mockTokenAccountBalance();
const otherMain = mockAccountBalance({
  accountId: AccountIdSchema.parse("js:2:ethereum:0xdef:"),
});

const populated: AccountBalancesState = {
  rows: {
    [main.accountId]: main,
    [token.accountId]: token,
    [otherMain.accountId]: otherMain,
  },
  status: { [main.accountId]: { pending: false, sourceId: "granular" } },
};

describe("accountBalancesSlice", () => {
  it("starts empty", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual(initialAccountBalancesState);
  });

  describe("accountBalanceRequested", () => {
    it("marks the account pending", () => {
      const next = reducer(undefined, accountBalanceRequested(main.accountId));
      expect(select.selectAccountBalanceStatus(next, main.accountId).pending).toBe(true);
    });

    it("clears a previous error but keeps the source that last answered", () => {
      const failed = reducer(
        populated,
        accountBalanceFailed({ accountId: main.accountId, error: "boom" }),
      );
      const next = reducer(failed, accountBalanceRequested(main.accountId));
      expect(select.selectAccountBalanceStatus(next, main.accountId)).toEqual({
        pending: true,
        sourceId: "granular",
      });
    });
  });

  describe("accountBalanceReceived", () => {
    it("sets the account row, its token rows and the answering source", () => {
      const next = reducer(
        undefined,
        accountBalanceReceived({
          accountId: main.accountId,
          balances: [main, token],
          sourceId: "granular",
        }),
      );
      expect(next.rows).toEqual({ [main.accountId]: main, [token.accountId]: token });
      expect(select.selectAccountBalanceStatus(next, main.accountId)).toEqual({
        pending: false,
        sourceId: "granular",
      });
    });

    it("drops a token account missing from the new set", () => {
      const next = reducer(
        populated,
        accountBalanceReceived({
          accountId: main.accountId,
          balances: [main],
          sourceId: "granular",
        }),
      );
      expect(next.rows[token.accountId]).toBeUndefined();
      expect(next.rows[main.accountId]).toEqual(main);
    });

    it("never touches another account's rows", () => {
      const next = reducer(
        populated,
        accountBalanceReceived({ accountId: main.accountId, balances: [], sourceId: "full-sync" }),
      );
      expect(next.rows).toEqual({ [otherMain.accountId]: otherMain });
    });
  });

  describe("accountBalanceFailed", () => {
    it("records the error and leaves the stale rows in place", () => {
      const next = reducer(
        populated,
        accountBalanceFailed({ accountId: main.accountId, error: "network down" }),
      );
      expect(select.selectAccountBalanceStatus(next, main.accountId)).toEqual({
        pending: false,
        error: "network down",
        sourceId: "granular",
      });
      expect(next.rows[main.accountId]).toEqual(main);
    });
  });

  describe("accountBalancesRemoved", () => {
    it("removes the account, the token accounts it parents and its status", () => {
      const next = reducer(populated, accountBalancesRemoved([main.accountId]));
      expect(next.rows).toEqual({ [otherMain.accountId]: otherMain });
      expect(next.status[main.accountId]).toBeUndefined();
    });

    it("ignores unknown ids", () => {
      expect(
        reducer(populated, accountBalancesRemoved([AccountIdSchema.parse("js:2:ethereum:0xzzz:")])),
      ).toEqual(populated);
    });
  });

  it("empties the table on reset", () => {
    expect(reducer(populated, accountBalancesReset())).toEqual(initialAccountBalancesState);
  });
});

describe("selectors", () => {
  it("reads an account's own balance", () => {
    expect(select.selectAccountBalance(populated, main.accountId)).toEqual(main);
    expect(select.selectAccountBalance(populated, otherMain.accountId)).toEqual(otherMain);
  });

  it("groups token balances under their parent", () => {
    expect(select.selectSubAccountBalances(populated, main.accountId)).toEqual([token]);
    expect(select.selectSubAccountBalances(populated, otherMain.accountId)).toEqual([]);
  });

  it("returns the same empty array for an account with no token accounts", () => {
    expect(select.selectSubAccountBalances(populated, otherMain.accountId)).toBe(
      select.selectSubAccountBalances(populated, otherMain.accountId),
    );
  });

  it("reports an idle status for an account never read", () => {
    expect(select.selectAccountBalanceStatus(populated, otherMain.accountId)).toEqual({
      pending: false,
    });
  });

  it("reads freshness off the row itself", () => {
    expect(select.selectAccountBalanceAt(populated, main.accountId)).toBe(
      new Date(main.at).getTime(),
    );
    expect(
      select.selectAccountBalanceAt(populated, AccountIdSchema.parse("js:2:ethereum:0xzzz:")),
    ).toBeUndefined();
  });

  it("exposes the whole table", () => {
    expect(select.selectAccountBalanceRows(populated)).toBe(populated.rows);
  });

  it("resolves against the app root state too", () => {
    expect(
      accountBalancesSlice.selectors.selectAccountBalance(
        { accountBalances: populated },
        main.accountId,
      ),
    ).toEqual(main);
  });
});

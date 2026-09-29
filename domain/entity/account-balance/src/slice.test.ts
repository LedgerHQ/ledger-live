import { AccountIdSchema } from "@domain/entity-account";
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

const mainId = AccountIdSchema.parse("js:2:ethereum:0xabc:");
const otherMainId = AccountIdSchema.parse("js:2:ethereum:0xdef:");
const unknownId = AccountIdSchema.parse("js:2:ethereum:0xzzz:");

const main = mockAccountBalance();
const token = mockTokenAccountBalance();
const otherMain = mockAccountBalance({ accountId: otherMainId });

const populated: AccountBalancesState = {
  rows: {
    [main.accountId]: main,
    [token.accountId]: token,
    [otherMain.accountId]: otherMain,
  },
  status: { [mainId]: { pending: false, sourceId: "granular" } },
};

describe("accountBalancesSlice", () => {
  it("starts empty", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual(initialAccountBalancesState);
  });

  describe("accountBalanceRequested", () => {
    it("marks the account pending", () => {
      const next = reducer(undefined, accountBalanceRequested(mainId));
      expect(select.selectAccountBalanceStatus(next, mainId).pending).toBe(true);
    });

    it("clears a previous error but keeps the source that last answered", () => {
      const failed = reducer(populated, accountBalanceFailed({ accountId: mainId, error: "boom" }));
      const next = reducer(failed, accountBalanceRequested(mainId));
      expect(select.selectAccountBalanceStatus(next, mainId)).toEqual({
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
          accountId: mainId,
          balances: [main, token],
          sourceId: "granular",
        }),
      );
      expect(next.rows).toEqual({ [main.accountId]: main, [token.accountId]: token });
      expect(select.selectAccountBalanceStatus(next, mainId)).toEqual({
        pending: false,
        sourceId: "granular",
      });
    });

    it("drops a token account missing from the new set", () => {
      const next = reducer(
        populated,
        accountBalanceReceived({
          accountId: mainId,
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
        accountBalanceReceived({ accountId: mainId, balances: [], sourceId: "full-sync" }),
      );
      expect(next.rows).toEqual({ [otherMain.accountId]: otherMain });
    });

    it("ignores a row the read never asked about, rather than writing it", () => {
      // A read answers for one account. A payload carrying someone else's row is a source bug, and
      // storing it would overwrite a table this read has no business touching.
      const stray = mockAccountBalance({ accountId: otherMainId, balance: "1" as never });
      const next = reducer(
        populated,
        accountBalanceReceived({
          accountId: mainId,
          balances: [main, stray],
          sourceId: "granular",
        }),
      );
      expect(next.rows[otherMainId]).toEqual(otherMain);
    });
  });

  describe("accountBalanceFailed", () => {
    it("records the error and leaves the stale rows in place", () => {
      const next = reducer(
        populated,
        accountBalanceFailed({ accountId: mainId, error: "network down" }),
      );
      expect(select.selectAccountBalanceStatus(next, mainId)).toEqual({
        pending: false,
        error: "network down",
        sourceId: "granular",
      });
      expect(next.rows[main.accountId]).toEqual(main);
    });
  });

  describe("accountBalancesRemoved", () => {
    it("removes the account, the token accounts it parents and its status", () => {
      const next = reducer(populated, accountBalancesRemoved([mainId]));
      expect(next.rows).toEqual({ [otherMain.accountId]: otherMain });
      expect(next.status[mainId]).toBeUndefined();
    });

    it("ignores unknown ids", () => {
      expect(reducer(populated, accountBalancesRemoved([unknownId]))).toEqual(populated);
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
    expect(select.selectSubAccountBalances(populated, mainId)).toEqual([token]);
    expect(select.selectSubAccountBalances(populated, otherMainId)).toEqual([]);
  });

  it("returns the same empty array for an account with no token accounts", () => {
    expect(select.selectSubAccountBalances(populated, otherMainId)).toBe(
      select.selectSubAccountBalances(populated, otherMainId),
    );
  });

  it("reports an idle status for an account never read", () => {
    expect(select.selectAccountBalanceStatus(populated, otherMainId)).toEqual({
      pending: false,
    });
  });

  it("reads freshness off the row itself", () => {
    expect(select.selectAccountBalanceAt(populated, mainId)).toBe(new Date(main.at).getTime());
    expect(select.selectAccountBalanceAt(populated, unknownId)).toBeUndefined();
  });

  it("reports no timestamp rather than NaN when the persisted stamp is unreadable", () => {
    const corrupted = {
      ...populated,
      rows: { ...populated.rows, [mainId]: { ...populated.rows[mainId], at: "nope" } },
    } as typeof populated;
    expect(select.selectAccountBalanceAt(corrupted, mainId)).toBeUndefined();
  });

  it("exposes the whole table", () => {
    expect(select.selectAccountBalanceRows(populated)).toBe(populated.rows);
  });

  it("resolves against the app root state too", () => {
    expect(
      accountBalancesSlice.selectors.selectAccountBalance({ accountBalances: populated }, mainId),
    ).toEqual(main);
  });
});

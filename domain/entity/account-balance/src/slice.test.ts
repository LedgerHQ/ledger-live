import { AccountIdSchema } from "@shared/schema-primitives";
import { initialAccountBalancesState, type AccountBalancesState } from "./schema";
import { mockAccountBalance, mockTokenAccountBalance } from "./schema.mock";
import {
  accountBalancesSlice,
  removeAccountBalances,
  replaceAccountBalances,
  resetAccountBalances,
  upsertAccountBalances,
} from "./slice";

const reducer = accountBalancesSlice.reducer;
const main = mockAccountBalance();
const token = mockTokenAccountBalance();
const otherMain = mockAccountBalance({
  accountId: AccountIdSchema.parse("js:2:ethereum:0xdef:"),
});

const populated: AccountBalancesState = {
  [main.accountId]: main,
  [token.accountId]: token,
  [otherMain.accountId]: otherMain,
};

describe("accountBalancesSlice", () => {
  it("starts empty", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual(initialAccountBalancesState);
  });

  describe("upsertAccountBalances", () => {
    it("inserts rows", () => {
      expect(reducer(undefined, upsertAccountBalances([main, token]))).toEqual({
        [main.accountId]: main,
        [token.accountId]: token,
      });
    });

    it("overwrites an existing row and leaves the others alone", () => {
      const updated = {
        ...main,
        balance: mockAccountBalance({}).balance,
        spendableBalance: token.balance,
      };
      const next = reducer(populated, upsertAccountBalances([updated]));
      expect(next[main.accountId]).toEqual(updated);
      expect(next[token.accountId]).toEqual(token);
      expect(next[otherMain.accountId]).toEqual(otherMain);
    });

    it("does nothing on an empty payload", () => {
      expect(reducer(populated, upsertAccountBalances([]))).toEqual(populated);
    });
  });

  describe("replaceAccountBalances", () => {
    it("sets the account row and its token rows", () => {
      const next = reducer(
        undefined,
        replaceAccountBalances({ accountId: main.accountId, balances: [main, token] }),
      );
      expect(next).toEqual({ [main.accountId]: main, [token.accountId]: token });
    });

    it("drops a token account missing from the new set", () => {
      const next = reducer(
        populated,
        replaceAccountBalances({ accountId: main.accountId, balances: [main] }),
      );
      expect(next[token.accountId]).toBeUndefined();
      expect(next[main.accountId]).toEqual(main);
    });

    it("never touches another account's rows", () => {
      const next = reducer(
        populated,
        replaceAccountBalances({ accountId: main.accountId, balances: [] }),
      );
      expect(next).toEqual({ [otherMain.accountId]: otherMain });
    });
  });

  describe("removeAccountBalances", () => {
    it("removes the account and the token accounts it parents", () => {
      const next = reducer(populated, removeAccountBalances([main.accountId]));
      expect(next).toEqual({ [otherMain.accountId]: otherMain });
    });

    it("ignores unknown ids", () => {
      expect(
        reducer(populated, removeAccountBalances([AccountIdSchema.parse("js:2:ethereum:0xzzz:")])),
      ).toEqual(populated);
    });
  });

  it("empties the table on reset", () => {
    expect(reducer(populated, resetAccountBalances())).toEqual(initialAccountBalancesState);
  });
});

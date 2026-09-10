import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import accountsReducer from "../accounts";
import { AccountsActionTypes } from "~/actions/types";

const bitcoin = getCryptoCurrencyById("bitcoin");

const account = (seed: string) =>
  genAccount(`reducer-update-accounts-${seed}`, { currency: bitcoin });

type AccountUpdate = { accountId: string; updater: (a: Account) => Account };
type AccountsStateLike = { active: Account[] };

function dispatchUpdates(updates: AccountUpdate[], prev: AccountsStateLike) {
  return accountsReducer(
    prev as never,
    {
      type: AccountsActionTypes.UPDATE_ACCOUNTS,
      payload: { updates },
    } as never,
  ) as AccountsStateLike;
}

describe("accounts reducer UPDATE_ACCOUNTS (batched)", () => {
  const accountA = account("a");
  const accountB = account("b");
  const accountC = account("c");
  const state = { active: [accountA, accountB, accountC] };

  it("rebuilds the accounts array exactly once for a batch of updates", () => {
    const result = dispatchUpdates(
      [
        { accountId: accountA.id, updater: a => ({ ...a, blockHeight: 111 }) },
        { accountId: accountB.id, updater: a => ({ ...a, blockHeight: 222 }) },
        { accountId: accountB.id, updater: a => ({ ...a, syncHash: "second-hash" }) },
      ],
      state,
    );

    // One flush = one array rebuild: the array identity must differ from the
    // input (a rebuild happened) while it cannot "rebuild more than once"
    // within a single reducer run — returned array is a fresh allocation,
    // exactly the object the selectors will see once.
    expect(result.active).not.toBe(state.active);
    // Unaffected accounts keep their reference (map returns the same object).
    expect(result.active[2]).toBe(state.active[2]);
  });

  it("applies multiple updaters for the same account in emission order (last wins per field)", () => {
    const result = dispatchUpdates(
      [
        {
          accountId: accountA.id,
          updater: a => ({ ...a, blockHeight: 111, syncHash: "first-hash" }),
        },
        { accountId: accountA.id, updater: a => ({ ...a, blockHeight: 222 }) },
      ],
      state,
    );

    expect(result.active[0].id).toBe(accountA.id);
    expect(result.active[0].blockHeight).toBe(222); // later updater wins
    expect(result.active[0].syncHash).toBe("first-hash"); // earlier updater's other field kept
  });

  it("updates multiple distinct accounts in one pass", () => {
    const result = dispatchUpdates(
      [
        { accountId: accountA.id, updater: a => ({ ...a, blockHeight: 111 }) },
        { accountId: accountC.id, updater: a => ({ ...a, blockHeight: 333 }) },
      ],
      state,
    );

    expect(result.active[0].blockHeight).toBe(111);
    expect(result.active[1]).toBe(accountB); // untouched account keeps identity
    expect(result.active[2].blockHeight).toBe(333);
  });

  it("leaves state untouched when the batch is empty", () => {
    const result = dispatchUpdates([], state);
    expect(result.active).toBe(state.active);
  });

  it("stays backward compatible: single UPDATE_ACCOUNT dispatches still work", () => {
    const prev = { active: [accountA] };
    const next = accountsReducer(
      prev as never,
      {
        type: AccountsActionTypes.UPDATE_ACCOUNT,
        payload: {
          accountId: accountA.id,
          updater: (a: Account) => ({ ...a, blockHeight: 555 }),
        },
      } as never,
    ) as { active: Account[] };

    expect(next.active[0].blockHeight).toBe(555);
  });
});

describe("accounts reducer single UPDATE_ACCOUNT (regression)", () => {
  it("does not touch other accounts", () => {
    const accountA = account("a");
    const accountB = account("b");
    const prev = { active: [accountA, accountB] };

    const next = accountsReducer(
      prev as never,
      {
        type: AccountsActionTypes.UPDATE_ACCOUNT,
        payload: {
          accountId: accountA.id,
          updater: (a: Account) => ({ ...a, blockHeight: 444 }),
        },
      } as never,
    ) as { active: Account[] };

    expect(next.active[0].blockHeight).toBe(444);
    expect(next.active[1]).toBe(accountB);
  });
});

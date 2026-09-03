import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";

jest.mock("~/logic/accountModel", () => {
  const actual = jest.requireActual("~/logic/accountModel").default;
  return { __esModule: true, default: { ...actual, encode: jest.fn(actual.encode) } };
});

import accountModel from "~/logic/accountModel";
import type { State } from "~/reducers/types";
import { exportSelector } from "../accounts";

const encodeMock = accountModel.encode as unknown as jest.Mock;
const bitcoin = getCryptoCurrencyById("bitcoin");

const makeState = (accounts: Account[]) =>
  ({
    accounts: { active: accounts },
    wallet: { accountNames: new Map(), starredAccountIds: new Set() },
  }) as unknown as State;

describe("accounts exportSelector encode cache", () => {
  it("does not re-encode unchanged accounts, encodes the changed one", async () => {
    const accountA = genAccount("export-cache-a", { currency: bitcoin });
    const accountB = genAccount("export-cache-b", { currency: bitcoin });

    // First export: every account is encoded once.
    await exportSelector(makeState([accountA, accountB]));
    expect(encodeMock).toHaveBeenCalledTimes(2);

    // Sync wave: only accountA changed (fresh reference, like the reducer produces).
    const changed = { ...accountA, balance: accountA.balance.plus(1) };
    const result = await exportSelector(makeState([changed, accountB]));

    // accountB kept its reference → no re-encode; accountA re-encoded.
    expect(encodeMock).toHaveBeenCalledTimes(3);
    expect(result.active.map(row => row.data.id)).toEqual([changed.id, accountB.id]);
    // Unchanged account still exports its full data (not a placeholder).
    expect(result.active[1].data.balance).toBe(accountB.balance.toString());
  });
});

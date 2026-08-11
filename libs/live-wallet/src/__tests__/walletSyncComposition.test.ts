import { of } from "rxjs";
import type { Account, AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import { createWalletsync, parseDistantState } from "../walletSyncComposition";

const walletsync = createWalletsync({
  getAccountBridge: <T extends TransactionCommon>() =>
    ({ sync: () => of((acc: Account) => acc) }) as unknown as AccountBridge<T>,
  bridgeCache: {
    hydrateCurrency: () => Promise.resolve(null),
    prepareCurrency: () => Promise.resolve(null),
  },
});

const emptyLocalState = {
  accounts: { list: [], nonImportedAccountInfos: [] },
  accountNames: new Map<string, string>(),
  recentAddresses: {},
};

const distantEmptyState = walletsync.diffLocalToDistant(emptyLocalState, null).nextState;

describe("parseDistantState", () => {
  const withUnknownField = { ...distantEmptyState, fooBAR: { nested: [1, 2, 3] } };

  it("preserves fields written by a newer version that the schema strips", () => {
    expect(walletsync.schema.parse(withUnknownField)).not.toHaveProperty("fooBAR");
    expect(parseDistantState(walletsync, withUnknownField)).toEqual(withUnknownField);
  });

  it("accepts data missing a module's field", () => {
    const partial = { accounts: [] };
    expect(parseDistantState(walletsync, partial)).toEqual(partial);
  });

  it("returns null when the data fails schema validation", () => {
    expect(parseDistantState(walletsync, { accountNames: { foo: 42 } })).toBe(null);
    expect(parseDistantState(walletsync, "not an object")).toBe(null);
  });

  it("keeps unknown fields through a parse then re-upload round trip", () => {
    const latest = parseDistantState(walletsync, {
      ...withUnknownField,
      accountNames: { foo: "bar" },
    });
    const localData = { ...emptyLocalState, accountNames: new Map([["foo", "baz"]]) };
    const diff = walletsync.diffLocalToDistant(localData, latest);
    expect(diff.hasChanges).toBe(true);
    expect(diff.nextState).toMatchObject({
      accountNames: { foo: "baz" },
      fooBAR: { nested: [1, 2, 3] },
    });
  });
});

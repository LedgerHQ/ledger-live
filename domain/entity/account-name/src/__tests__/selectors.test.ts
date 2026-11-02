import { configureStore } from "@reduxjs/toolkit";
import {
  accountsSlice,
  legacyAccountsSynced,
  LegacyAccountEntrySchema,
} from "@domain/entity-account";
import { mockAccountEntry } from "@domain/entity-account/schema.mock";
import { accountNamesSlice, setAccountName } from "../slice";
import { accountNameWithDefaultSelector, selectAccountNameByUUID } from "../selectors";

function makeStore() {
  return configureStore({ reducer: { accountNames: accountNamesSlice.reducer } });
}

describe("accountNameWithDefaultSelector", () => {
  const account = {
    id: "a1",
    type: "Account",
    currency: { name: "Bitcoin" },
    index: 0,
  };

  it("returns the custom name when set", () => {
    const store = makeStore();
    store.dispatch(setAccountName({ accountId: "a1", name: "Savings" }));
    expect(accountNameWithDefaultSelector(store.getState().accountNames, account)).toBe("Savings");
  });

  it("returns the default name when no custom name exists", () => {
    const store = makeStore();
    expect(accountNameWithDefaultSelector(store.getState().accountNames, account)).toBe(
      "Bitcoin 1",
    );
  });
});

describe("selectAccountNameByUUID", () => {
  const entry = LegacyAccountEntrySchema.parse(mockAccountEntry());

  function makeStores() {
    const store = configureStore({
      reducer: {
        accountNames: accountNamesSlice.reducer,
        accountEntries: accountsSlice.reducer,
      },
    });
    store.dispatch(legacyAccountsSynced([entry]));
    return store;
  }

  it("reads the name stored under the account's legacy id", () => {
    const store = makeStores();
    store.dispatch(setAccountName({ accountId: entry.legacyId, name: "Savings" }));
    const { accountNames, accountEntries } = store.getState();
    expect(selectAccountNameByUUID(accountNames, accountEntries, entry.accountUUID)).toBe(
      "Savings",
    );
  });

  it("is undefined for an account without a custom name", () => {
    const { accountNames, accountEntries } = makeStores().getState();
    expect(
      selectAccountNameByUUID(accountNames, accountEntries, entry.accountUUID),
    ).toBeUndefined();
  });

  it("is undefined for an account without a legacy id", () => {
    const store = makeStores();
    store.dispatch(setAccountName({ accountId: entry.legacyId, name: "Savings" }));
    const { accountNames } = store.getState();
    const remoteOnly = mockAccountEntry({ legacyId: undefined });
    const accountEntries = {
      ids: [remoteOnly.accountUUID],
      entities: { [remoteOnly.accountUUID]: remoteOnly },
      byLegacyId: {},
    };
    expect(
      selectAccountNameByUUID(accountNames, accountEntries, remoteOnly.accountUUID),
    ).toBeUndefined();
  });
});

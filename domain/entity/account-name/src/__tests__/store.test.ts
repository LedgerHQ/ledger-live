import { configureStore } from "@reduxjs/toolkit";
import {
  accountNamesSlice,
  bulkSetAccountNames,
  initFromUserData,
  setAccountName,
  setNamesForAccounts,
} from "../slice";
import { accountNameSelector } from "../selectors";

function makeStore() {
  return configureStore({ reducer: { accountNames: accountNamesSlice.reducer } });
}

describe("accountNamesSlice", () => {
  it("starts empty", () => {
    const store = makeStore();
    expect(accountNameSelector(store.getState().accountNames, { accountId: "x" })).toBeUndefined();
  });

  it("setAccountName sets a name", () => {
    const store = makeStore();
    store.dispatch(setAccountName({ accountId: "a1", name: "My Wallet" }));
    expect(accountNameSelector(store.getState().accountNames, { accountId: "a1" })).toBe(
      "My Wallet",
    );
  });

  it("setAccountName with empty name removes entry", () => {
    const store = makeStore();
    store.dispatch(setAccountName({ accountId: "a1", name: "My Wallet" }));
    store.dispatch(setAccountName({ accountId: "a1", name: "" }));
    expect(accountNameSelector(store.getState().accountNames, { accountId: "a1" })).toBeUndefined();
  });

  it("bulkSetAccountNames merges names", () => {
    const store = makeStore();
    store.dispatch(bulkSetAccountNames(new Map([["a1", "First"]])));
    store.dispatch(bulkSetAccountNames(new Map([["a2", "Second"]])));
    expect(accountNameSelector(store.getState().accountNames, { accountId: "a1" })).toBe("First");
    expect(accountNameSelector(store.getState().accountNames, { accountId: "a2" })).toBe("Second");
  });

  it("initFromUserData replaces all names", () => {
    const store = makeStore();
    store.dispatch(setAccountName({ accountId: "old", name: "Old" }));
    store.dispatch(initFromUserData([{ id: "new", name: "New" }]));
    expect(
      accountNameSelector(store.getState().accountNames, { accountId: "old" }),
    ).toBeUndefined();
    expect(accountNameSelector(store.getState().accountNames, { accountId: "new" })).toBe("New");
  });

  it("initFromUserData skips entries with empty name", () => {
    const store = makeStore();
    store.dispatch(initFromUserData([{ id: "a1", name: "" }]));
    expect(accountNameSelector(store.getState().accountNames, { accountId: "a1" })).toBeUndefined();
  });

  it("ADD_ACCOUNTS stores edited names that differ from the default", () => {
    const store = makeStore();
    store.dispatch({
      type: "ADD_ACCOUNTS",
      payload: {
        allAccounts: [
          { id: "a1", type: "Account", currency: { name: "Bitcoin" }, index: 0 },
          { id: "a2", type: "Account", currency: { name: "Bitcoin" }, index: 1 },
        ],
        editedNames: new Map([
          ["a1", "My Renamed BTC"],
          ["a2", "Bitcoin 2"], // equals default, must be ignored
        ]),
      },
    });
    expect(accountNameSelector(store.getState().accountNames, { accountId: "a1" })).toBe(
      "My Renamed BTC",
    );
    expect(accountNameSelector(store.getState().accountNames, { accountId: "a2" })).toBeUndefined();
  });

  it("ADD_ACCOUNTS keeps existing custom names when not re-edited", () => {
    const store = makeStore();
    store.dispatch(setAccountName({ accountId: "a1", name: "Kept Name" }));
    store.dispatch({
      type: "ADD_ACCOUNTS",
      payload: {
        allAccounts: [{ id: "a1", type: "Account", currency: { name: "Bitcoin" }, index: 0 }],
        editedNames: new Map(),
      },
    });
    expect(accountNameSelector(store.getState().accountNames, { accountId: "a1" })).toBe(
      "Kept Name",
    );
  });

  it("setNamesForAccounts stores edited names that differ from the default", () => {
    const store = makeStore();
    store.dispatch(
      setNamesForAccounts({
        accounts: [{ id: "a1", type: "Account", currency: { name: "Bitcoin" }, index: 0 }],
        editedNames: new Map([["a1", "Custom"]]),
      }),
    );
    expect(accountNameSelector(store.getState().accountNames, { accountId: "a1" })).toBe("Custom");
  });

  it("setNamesForAccounts ignores names equal to the default", () => {
    const store = makeStore();
    store.dispatch(
      setNamesForAccounts({
        accounts: [{ id: "a1", type: "Account", currency: { name: "Bitcoin" }, index: 0 }],
        editedNames: new Map([["a1", "Bitcoin 1"]]),
      }),
    );
    expect(accountNameSelector(store.getState().accountNames, { accountId: "a1" })).toBeUndefined();
  });
});

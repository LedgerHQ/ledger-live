import { configureStore } from "@reduxjs/toolkit";
import { accountNamesSlice, setAccountName } from "../slice";
import { accountNameWithDefaultSelector } from "../selectors";

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

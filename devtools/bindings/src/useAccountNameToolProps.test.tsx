import React, { type PropsWithChildren } from "react";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { AccountIdSchema, accountsSlice, legacyAccountsSynced } from "@domain/entity-account";
import { accountNamesSlice, setAccountName } from "@domain/entity-account-name";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { useAccountNameToolProps } from "./useAccountNameToolProps";

function setup() {
  const ethereum = mockAddressAccountDescriptor();
  const accountUUID = computeAccountUUID(ethereum);
  const store = configureStore({
    reducer: {
      accountEntries: accountsSlice.reducer,
      wallet: combineReducers({ accountNames: accountNamesSlice.reducer }),
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false }),
  });
  store.dispatch(
    legacyAccountsSynced([
      { accountUUID, descriptor: ethereum, legacyId: AccountIdSchema.parse("eth") },
    ]),
  );
  store.dispatch(setAccountName({ accountId: "eth", name: "Savings" }));
  store.dispatch(setAccountName({ accountId: "eth+usdc", name: "Stables" }));
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  const legacyAccounts = [
    { id: "eth", type: "Account", currency: { name: "Ethereum" }, index: 0 },
    { id: "btc", type: "Account", currency: { name: "Bitcoin" }, index: 1 },
  ];
  const { result } = renderHook(() => useAccountNameToolProps(legacyAccounts), { wrapper });
  return { result, accountUUID };
}

describe("useAccountNameToolProps", () => {
  it("lists each account with its name or default, then the names of unlisted accounts", () => {
    const { result, accountUUID } = setup();
    expect(result.current.names).toEqual([
      { legacyId: "eth", accountUUID, name: "Savings", isDefault: false },
      { legacyId: "btc", accountUUID: undefined, name: "Bitcoin 2", isDefault: true },
      { legacyId: "eth+usdc", accountUUID: undefined, name: "Stables", isDefault: false },
    ]);
  });

  it("looks a name up by account UUID", () => {
    const { result, accountUUID } = setup();
    expect(result.current.nameOf(accountUUID)).toBe("Savings");
    expect(result.current.nameOf("not-a-uuid")).toBeUndefined();
  });
});

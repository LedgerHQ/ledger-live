import React, { type PropsWithChildren } from "react";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { AccountIdSchema, accountsSlice, legacyAccountsSynced } from "@domain/entity-account";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import {
  mockAddressAccountDescriptor,
  mockUtxoAccountDescriptor,
} from "@domain/entity-account-descriptor/schema.mock";
import { useAccountDescriptorToolProps } from "./useAccountDescriptorToolProps";

describe("useAccountDescriptorToolProps", () => {
  it("lists each account with its descriptor and legacy id", () => {
    const ethereum = mockAddressAccountDescriptor();
    const bitcoin = mockUtxoAccountDescriptor();
    const store = configureStore({ reducer: { accountEntries: accountsSlice.reducer } });
    store.dispatch(
      legacyAccountsSynced([
        {
          accountUUID: computeAccountUUID(ethereum),
          descriptor: ethereum,
          legacyId: AccountIdSchema.parse("eth"),
        },
        {
          accountUUID: computeAccountUUID(bitcoin),
          descriptor: bitcoin,
          legacyId: AccountIdSchema.parse("btc"),
        },
      ]),
    );
    const wrapper = ({ children }: PropsWithChildren) => (
      <Provider store={store}>{children}</Provider>
    );
    const { result } = renderHook(() => useAccountDescriptorToolProps(), { wrapper });
    expect(result.current.accounts).toEqual([
      {
        accountUUID: computeAccountUUID(ethereum),
        legacyId: "eth",
        purpose: "account",
        type: "address",
        network: "ethereum",
        path: ethereum.path,
        key: ethereum.address,
      },
      {
        accountUUID: computeAccountUUID(bitcoin),
        legacyId: "btc",
        purpose: "account",
        type: "utxo",
        network: "bitcoin",
        path: bitcoin.path,
        key: bitcoin.xpub,
      },
    ]);
  });
});

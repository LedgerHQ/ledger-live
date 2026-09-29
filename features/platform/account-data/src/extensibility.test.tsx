import type { ReactNode } from "react";
import { Provider, useSelector } from "react-redux";
import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { renderHook, waitFor } from "@testing-library/react";
import type { AccountId, AccountRef } from "@domain/entity-account";
import type { AccountDataBinding } from "@domain/entity-account-data";
import { createAccountDataRouter, type AccountDataSource } from "@domain/api-account-data-source";
import { mockAccountBalance } from "@domain/entity-account-balance/schema.mock";
import { useAccountData } from "./useAccountData";

// A third datum, declared from this file alone: none of the protocol packages is touched.
declare module "@domain/entity-account-data" {
  interface AccountData {
    toy: { query: { n: number }; result: string[] };
  }
}

type ToyState = {
  values: Record<string, string[]>;
  at: Record<string, number>;
  pending: Record<string, boolean>;
};

const toySlice = createSlice({
  name: "toy",
  initialState: { values: {}, at: {}, pending: {} } as ToyState,
  reducers: {
    requested: (state, { payload }: PayloadAction<AccountId>) => {
      state.pending[payload] = true;
    },
    received: (state, { payload }: PayloadAction<{ accountId: AccountId; data: string[] }>) => {
      state.values[payload.accountId] = payload.data;
      state.at[payload.accountId] = Date.now();
      state.pending[payload.accountId] = false;
    },
    failed: (state, { payload }: PayloadAction<{ accountId: AccountId; error: string }>) => {
      state.pending[payload.accountId] = false;
    },
  },
});

type WithToy = { toy: ToyState };

const toyBinding: AccountDataBinding<"toy", WithToy> = {
  datum: "toy",
  headQuery: { n: 2 },
  requested: toySlice.actions.requested,
  received: ({ accountId, data }) => toySlice.actions.received({ accountId, data }),
  failed: toySlice.actions.failed,
  selectAt: (state, accountId) => state.toy.at[accountId],
  selectPending: (state, accountId) => state.toy.pending[accountId] === true,
};

const ref = {
  accountId: mockAccountBalance().accountId,
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
} as AccountRef;

describe("a third datum", () => {
  it("is read with the generic hook, a source method and the entity's own selectors", async () => {
    const toy = jest.fn(async (_ref: AccountRef, { n }: { n: number }) =>
      Array.from({ length: n }, (_, i) => `item-${i}`),
    );
    const source: AccountDataSource = { id: "fake", supports: () => true, toy };
    const store = configureStore({
      reducer: { toy: toySlice.reducer },
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
          thunk: { extraArgument: { accountData: createAccountDataRouter([source]) } },
        }),
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(
      () => {
        useAccountData(toyBinding, ref);
        return useSelector((state: WithToy) => state.toy.values[ref.accountId]);
      },
      { wrapper },
    );

    await waitFor(() => expect(result.current).toEqual(["item-0", "item-1"]));
    expect(toy).toHaveBeenCalledWith(ref, { n: 2 }, undefined);
  });
});

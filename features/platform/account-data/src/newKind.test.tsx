import type { ReactNode } from "react";
import { Provider, useSelector } from "react-redux";
import { configureStore, createSlice } from "@reduxjs/toolkit";
import { renderHook, waitFor } from "@testing-library/react";
import { accountDataExtra } from "@domain/api-account-data";
import {
  AccountDataSourceIdSchema,
  accountDataSlice,
  isAccountDataReceived,
} from "@domain/entity-account-data";
import type { AccountDescriptor, AccountUUID } from "@domain/entity-account-descriptor";
import { useAccountData } from "./useAccountData";

// Everything a new `@domain/entity-account-*` package adds; no framework file changes for it.

type AccountStaking = { staked: string };

declare module "@domain/entity-account-data" {
  interface AccountDataRegistry {
    staking: { query: undefined; result: AccountStaking };
  }
}

const initialState: Partial<Record<AccountUUID, AccountStaking>> = {};

const stakingSlice = createSlice({
  name: "accountStaking",
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder.addMatcher(isAccountDataReceived("staking"), (state, { payload }) => {
      state[payload.accountUUID] = payload.data;
    });
  },
});

type WithStaking = { accountStaking: typeof initialState };

const selectAccountStaking = (state: WithStaking, accountUUID: AccountUUID | undefined) =>
  accountUUID === undefined ? undefined : state.accountStaking[accountUUID];

describe("a kind added from outside the framework packages", () => {
  it("is routed, read into its slice and driven by the generic hook", async () => {
    const descriptor: AccountDescriptor = {
      purpose: "account",
      version: "2",
      type: "address",
      network: "cosmos",
      address: "cosmos1abc",
      path: "m/44h/118h/0h/0/0",
    };
    const store = configureStore({
      reducer: { accountData: accountDataSlice.reducer, accountStaking: stakingSlice.reducer },
      middleware: getDefault =>
        getDefault({
          thunk: {
            extraArgument: accountDataExtra([
              { id: AccountDataSourceIdSchema.parse("serves-nothing"), supports: () => true },
              {
                id: AccountDataSourceIdSchema.parse("staking-api"),
                supports: (_descriptor, kind) => kind === "staking",
                read: { staking: async () => ({ staked: "42" }) },
              },
            ]),
          },
        }),
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(
      () => {
        const { accountUUID, pending, hasMore } = useAccountData("staking", descriptor);
        const staking = useSelector((state: WithStaking) =>
          selectAccountStaking(state, accountUUID),
        );
        return { pending, hasMore, staking };
      },
      { wrapper },
    );

    await waitFor(() => expect(result.current.staking).toEqual({ staked: "42" }));
    expect(result.current.pending).toBe(false);
    expect(result.current.hasMore).toBe(false);
  });
});

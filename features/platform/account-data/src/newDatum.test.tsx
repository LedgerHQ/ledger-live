import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { renderHook, waitFor } from "@testing-library/react";
import { createAccountDataRouter } from "@domain/api-account-data-source";
import type { AccountId } from "@domain/entity-account";
import { computeAccountId } from "@domain/entity-account-alias";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { AccountDataBinding, AccountDataReceived } from "@domain/entity-account-data";
import { useAccountData } from "./useAccountData";

// Everything a new datum needs, written where a new `@domain/entity-account-*` package would put it.
// Nothing in the protocol packages, this hook or the router changes for it.

type AccountStaking = { staked: string };

declare module "@domain/entity-account-data" {
  interface AccountData {
    staking: { query: undefined; result: AccountStaking };
  }
}

type StakingState = {
  byAccount: Record<AccountId, AccountStaking & { at: string }>;
  status: Record<AccountId, { pending: boolean; error?: string; sourceId?: string }>;
};

const stakingSlice = createSlice({
  name: "accountStaking",
  initialState: { byAccount: {}, status: {} } as StakingState,
  reducers: {
    requested: (state, { payload }: PayloadAction<AccountId>) => {
      state.status[payload] = { pending: true };
    },
    received: (state, { payload }: PayloadAction<AccountDataReceived<"staking">>) => {
      state.byAccount[payload.accountId] = { ...payload.data, at: payload.at };
      state.status[payload.accountId] = { pending: false, sourceId: payload.sourceId };
    },
    failed: (state, { payload }: PayloadAction<{ accountId: AccountId; error: string }>) => {
      state.status[payload.accountId] = { pending: false, error: payload.error };
    },
  },
});

type WithStaking = { accountStaking: StakingState };

const stakingBinding: AccountDataBinding<"staking", WithStaking> = {
  datum: "staking",
  requested: stakingSlice.actions.requested,
  received: stakingSlice.actions.received,
  failed: stakingSlice.actions.failed,
  selectAt: (state, id) => {
    const at = state.accountStaking.byAccount[id]?.at;
    return at === undefined ? undefined : Date.parse(at);
  },
  selectPending: (state, id) => state.accountStaking.status[id]?.pending ?? false,
  selectSourceId: (state, id) => state.accountStaking.status[id]?.sourceId,
};

describe("a datum added from outside the protocol packages", () => {
  it("is routed, read into its slice and driven by the generic hook", async () => {
    const descriptor: AccountDescriptor = {
      purpose: "account",
      version: "1",
      type: "address",
      network: { name: "cosmos", env: "main" },
      address: "cosmos1abc",
      path: "m/44h/118h/0h/0/0",
    };
    const accountId = computeAccountId(descriptor);
    const store = configureStore({
      reducer: { accountStaking: stakingSlice.reducer },
      middleware: getDefault =>
        getDefault({
          thunk: {
            extraArgument: {
              accountData: createAccountDataRouter([
                // A source that serves nothing else, and one that serves everything but this datum.
                { id: "balances-only", supports: () => true },
                {
                  id: "staking-api",
                  supports: (_descriptor, datum) => datum === "staking",
                  staking: async () => ({ staked: "42" }),
                },
              ]),
            },
          },
        }),
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useAccountData(stakingBinding, descriptor), { wrapper });

    await waitFor(() => expect(result.current.pending).toBe(false));
    expect(store.getState().accountStaking.byAccount[accountId]?.staked).toBe("42");
    expect(store.getState().accountStaking.status[accountId]?.sourceId).toBe("staking-api");
    expect(result.current.loadMore).toBeUndefined();
  });
});

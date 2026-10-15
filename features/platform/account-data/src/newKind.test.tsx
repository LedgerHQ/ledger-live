import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { renderHook, waitFor } from "@testing-library/react";
import { accountDataExtra } from "@domain/api-account-data-source";
import type {
  AccountDataBinding,
  AccountDataFailed,
  AccountDataReceived,
} from "@domain/entity-account-data";
import {
  computeAccountUUID,
  type AccountDescriptor,
  type AccountUUID,
} from "@domain/entity-account-descriptor";
import { useAccountData } from "./useAccountData";

// Everything a new `@domain/entity-account-*` package adds; no framework file changes for it.

type AccountStaking = { staked: string };

declare module "@domain/entity-account-data" {
  interface AccountDataRegistry {
    staking: { query: undefined; result: AccountStaking };
  }
}

type StakingState = {
  byAccount: Record<AccountUUID, AccountStaking & { at: string }>;
  status: Record<AccountUUID, { pending: boolean; error?: string; sourceId?: string }>;
};

const stakingSlice = createSlice({
  name: "accountStaking",
  initialState: { byAccount: {}, status: {} } as StakingState,
  reducers: {
    requested: (state, { payload }: PayloadAction<AccountUUID>) => {
      state.status[payload] = { pending: true };
    },
    received: (state, { payload }: PayloadAction<AccountDataReceived<"staking">>) => {
      state.byAccount[payload.accountUUID] = { ...payload.data, at: payload.at };
      state.status[payload.accountUUID] = { pending: false, sourceId: payload.sourceId };
    },
    failed: (state, { payload }: PayloadAction<AccountDataFailed>) => {
      state.status[payload.accountUUID] = { pending: false, error: payload.error };
    },
  },
});

type WithStaking = { accountStaking: StakingState };

const stakingBinding: AccountDataBinding<"staking", WithStaking> = {
  kind: "staking",
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

describe("a kind added from outside the framework packages", () => {
  it("is routed, read into its slice and driven by the generic hook", async () => {
    const descriptor: AccountDescriptor = {
      purpose: "account",
      version: "1",
      type: "address",
      network: { name: "cosmos", env: "main" },
      address: "cosmos1abc",
      path: "m/44h/118h/0h/0/0",
    };
    const store = configureStore({
      reducer: { accountStaking: stakingSlice.reducer },
      middleware: getDefault =>
        getDefault({
          thunk: {
            extraArgument: accountDataExtra([
              { id: "serves-nothing", supports: () => true },
              {
                id: "staking-api",
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

    const { result } = renderHook(() => useAccountData(stakingBinding, descriptor), { wrapper });

    await waitFor(() => expect(result.current.pending).toBe(false));
    const accountUUID = computeAccountUUID(descriptor);
    expect(store.getState().accountStaking.byAccount[accountUUID]?.staked).toBe("42");
    expect(store.getState().accountStaking.status[accountUUID]?.sourceId).toBe("staking-api");
    expect(result.current.loadMore).toBeUndefined();
  });
});

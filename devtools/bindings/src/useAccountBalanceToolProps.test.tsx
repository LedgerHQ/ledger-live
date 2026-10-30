import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { accountDataExtra } from "@domain/api-account-data";
import { AccountIdSchema, accountsSlice, legacyAccountsSynced } from "@domain/entity-account";
import { accountBalancesSlice, type AccountAssetBalance } from "@domain/entity-account-balance";
import { mockAccountAssetBalance } from "@domain/entity-account-balance/schema.mock";
import { AccountDataSourceIdSchema, accountDataSlice } from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import {
  mockAddressAccountDescriptor,
  mockUtxoAccountDescriptor,
} from "@domain/entity-account-descriptor/schema.mock";
import { useAccountBalanceToolProps } from "./useAccountBalanceToolProps";

const ethereum = mockAddressAccountDescriptor();
const bitcoin = mockUtxoAccountDescriptor();
const ethereumUUID = computeAccountUUID(ethereum);
const bitcoinUUID = computeAccountUUID(bitcoin);

function deferred() {
  const handle: { resolve?: (rows: AccountAssetBalance[]) => void; reject?: (e: Error) => void } =
    {};
  const promise = new Promise<AccountAssetBalance[]>((resolve, reject) => {
    handle.resolve = resolve;
    handle.reject = reject;
  });
  return {
    promise,
    resolve: (rows: AccountAssetBalance[]) => handle.resolve?.(rows),
    reject: (error: Error) => handle.reject?.(error),
  };
}

function setup() {
  const reads: { accountUUID: string; call: ReturnType<typeof deferred> }[] = [];
  const store = configureStore({
    reducer: {
      accountEntries: accountsSlice.reducer,
      accountBalances: accountBalancesSlice.reducer,
      accountData: accountDataSlice.reducer,
    },
    middleware: getDefault =>
      getDefault({
        thunk: {
          extraArgument: accountDataExtra([
            {
              id: AccountDataSourceIdSchema.parse("controlled"),
              supports: () => true,
              read: {
                balance: async ({ accountUUID }) => {
                  const call = deferred();
                  reads.push({ accountUUID, call });
                  return call.promise;
                },
              },
            },
          ]),
        },
      }),
  });
  store.dispatch(
    legacyAccountsSynced([
      { accountUUID: ethereumUUID, descriptor: ethereum, legacyId: AccountIdSchema.parse("eth") },
      { accountUUID: bitcoinUUID, descriptor: bitcoin, legacyId: AccountIdSchema.parse("btc") },
    ]),
  );
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  const { result } = renderHook(() => useAccountBalanceToolProps(), { wrapper });
  return { result, reads };
}

describe("useAccountBalanceToolProps", () => {
  it("lists every account, unread", () => {
    const { result } = setup();
    expect(result.current.accounts).toEqual([
      expect.objectContaining({
        accountUUID: ethereumUUID,
        reading: false,
        rows: undefined,
        readAt: undefined,
      }),
      expect.objectContaining({
        accountUUID: bitcoinUUID,
        reading: false,
      }),
    ]);
  });

  it("reads one account, pending then answered with its rows and source", async () => {
    const { result, reads } = setup();
    act(() => result.current.onRead(ethereumUUID));
    await waitFor(() => expect(result.current.accounts[0].reading).toBe(true));
    expect(reads.map(r => r.accountUUID)).toEqual([ethereumUUID]);

    await act(async () =>
      reads[0].call.resolve([
        mockAccountAssetBalance({
          balance: "1500000000000000000",
          spendableBalance: "1000000000000000000",
        }),
        mockAccountAssetBalance({
          assetId: "bitcoin",
          balance: "123456789",
          spendableBalance: "123456789",
        }),
      ]),
    );
    await waitFor(() => expect(result.current.accounts[0].reading).toBe(false));
    expect(result.current.accounts[0]).toEqual(
      expect.objectContaining({
        rows: [
          {
            assetId: "ethereum",
            balance: "1.5\u00a0ETH",
            spendableBalance: "1\u00a0ETH",
            empty: false,
          },
          {
            assetId: "bitcoin",
            balance: "1.23456789\u00a0BTC",
            spendableBalance: undefined,
            empty: false,
          },
        ],
        sourceId: "controlled",
        error: undefined,
      }),
    );
    expect(result.current.accounts[0].readAt).toEqual(expect.any(Number));
  });

  it("shows the error of a failed read", async () => {
    const { result, reads } = setup();
    act(() => result.current.onRead(ethereumUUID));
    await waitFor(() => expect(reads).toHaveLength(1));
    await act(async () => reads[0].call.reject(new Error("down")));
    await waitFor(() => expect(result.current.accounts[0].error).toBe("Error: down"));
  });

  it("reads again a fresh account", async () => {
    const { result, reads } = setup();
    act(() => result.current.onRead(ethereumUUID));
    await waitFor(() => expect(reads).toHaveLength(1));
    await act(async () => reads[0].call.resolve([mockAccountAssetBalance()]));
    await waitFor(() => expect(result.current.accounts[0].reading).toBe(false));

    act(() => result.current.onRead(ethereumUUID));
    await waitFor(() => expect(reads).toHaveLength(2));
  });

  it("reads every account on read all", async () => {
    const { result, reads } = setup();
    act(() => result.current.onReadAll());
    await waitFor(() => expect(reads).toHaveLength(2));
    expect(reads.map(r => r.accountUUID).sort()).toEqual([ethereumUUID, bitcoinUUID].sort());
  });
});

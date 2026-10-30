import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { accountDataExtra } from "@domain/api-account-data";
import { AccountIdSchema, accountsSlice, legacyAccountsSynced } from "@domain/entity-account";
import { AccountDataSourceIdSchema, accountDataSlice } from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import {
  mockAddressAccountDescriptor,
  mockUtxoAccountDescriptor,
} from "@domain/entity-account-descriptor/schema.mock";
import {
  accountOperationsSlice,
  type AccountOperationsPage,
} from "@domain/entity-account-operation";
import { mockAccountOperation } from "@domain/entity-account-operation/schema.mock";
import { useAccountOperationToolProps } from "./useAccountOperationToolProps";

const ethereum = mockAddressAccountDescriptor();
const bitcoin = mockUtxoAccountDescriptor();
const ethereumUUID = computeAccountUUID(ethereum);
const bitcoinUUID = computeAccountUUID(bitcoin);

function deferred() {
  const handle: {
    resolve?: (page: AccountOperationsPage) => void;
    reject?: (e: Error) => void;
  } = {};
  const promise = new Promise<AccountOperationsPage>((resolve, reject) => {
    handle.resolve = resolve;
    handle.reject = reject;
  });
  return {
    promise,
    resolve: (page: AccountOperationsPage) => handle.resolve?.(page),
    reject: (error: Error) => handle.reject?.(error),
  };
}

function setup() {
  const reads: { accountUUID: string; cursor?: string; call: ReturnType<typeof deferred> }[] = [];
  const store = configureStore({
    reducer: {
      accountEntries: accountsSlice.reducer,
      accountOperations: accountOperationsSlice.reducer,
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
                operations: async ({ accountUUID, cursor }) => {
                  const call = deferred();
                  reads.push({ accountUUID, cursor, call });
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
  const { result } = renderHook(() => useAccountOperationToolProps(), { wrapper });
  return { result, reads };
}

describe("useAccountOperationToolProps", () => {
  it("lists every account, unread", () => {
    const { result } = setup();
    expect(result.current.accounts).toEqual([
      expect.objectContaining({ accountUUID: ethereumUUID, reading: false, hasMore: false }),
      expect.objectContaining({ accountUUID: bitcoinUUID, rows: undefined, readAt: undefined }),
    ]);
  });

  it("reads one account, pending then answered with its rows and source", async () => {
    const { result, reads } = setup();
    act(() => result.current.onRead(ethereumUUID));
    await waitFor(() => expect(result.current.accounts[0].reading).toBe(true));
    expect(reads.map(r => r.accountUUID)).toEqual([ethereumUUID]);

    await act(async () =>
      reads[0].call.resolve({
        operations: [
          mockAccountOperation({ id: "pending", blockHeight: null, value: "1500000000000000000" }),
          mockAccountOperation({ id: "child", parentId: "pending", hasFailed: true }),
        ],
      }),
    );
    await waitFor(() => expect(result.current.accounts[0].reading).toBe(false));
    expect(result.current.accounts[0]).toEqual(
      expect.objectContaining({
        sourceId: "controlled",
        hasMore: false,
        error: undefined,
        rows: [
          expect.objectContaining({
            id: "pending",
            value: "1.5 ETH",
            pending: true,
            failed: false,
            child: false,
          }),
          expect.objectContaining({ id: "child", pending: false, failed: true, child: true }),
        ],
      }),
    );
  });

  it("reads the next page with the cursor of the last one, appending its rows", async () => {
    const { result, reads } = setup();
    act(() => result.current.onRead(ethereumUUID));
    await waitFor(() => expect(reads).toHaveLength(1));
    await act(async () =>
      reads[0].call.resolve({ operations: [mockAccountOperation()], nextCursor: "page-2" }),
    );
    await waitFor(() => expect(result.current.accounts[0].hasMore).toBe(true));

    act(() => result.current.onReadMore(ethereumUUID));
    await waitFor(() => expect(reads).toHaveLength(2));
    expect(reads[1].cursor).toBe("page-2");
    await act(async () =>
      reads[1].call.resolve({ operations: [mockAccountOperation({ id: "op-2" })] }),
    );
    await waitFor(() => expect(result.current.accounts[0].hasMore).toBe(false));
    expect(result.current.accounts[0].rows?.map(row => row.id)).toEqual(["op-1", "op-2"]);
  });

  it("shows the error of a failed read", async () => {
    const { result, reads } = setup();
    act(() => result.current.onRead(ethereumUUID));
    await waitFor(() => expect(reads).toHaveLength(1));
    await act(async () => reads[0].call.reject(new Error("down")));
    await waitFor(() => expect(result.current.accounts[0].error).toBe("Error: down"));
  });

  it("reads every account on read all", async () => {
    const { result, reads } = setup();
    act(() => result.current.onReadAll());
    await waitFor(() => expect(reads).toHaveLength(2));
    expect(reads.map(r => r.accountUUID).sort()).toEqual([ethereumUUID, bitcoinUUID].sort());
  });
});

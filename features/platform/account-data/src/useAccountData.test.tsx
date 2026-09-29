import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createAccountDataRouter, type AccountDataSource } from "@domain/api-account-data-source";
import { AccountRefSchema, type AccountRef } from "@domain/entity-account";
import {
  accountBalanceBinding,
  accountBalancesSlice,
  selectAccountBalance,
} from "@domain/entity-account-balance";
import { mockAccountBalance } from "@domain/entity-account-balance/schema.mock";
import {
  accountOperationsBinding,
  accountOperationsSlice,
  selectAccountOperations,
  type AccountOperationsPage,
} from "@domain/entity-account-operations";
import { mockAccountOperation } from "@domain/entity-account-operations/schema.mock";
import { DateTimeIsoSchema } from "@shared/schema-primitives";
import { useAccountData } from "./useAccountData";

const ref: AccountRef = AccountRefSchema.parse({
  accountId: "js:2:ethereum:0xabc:",
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
});

const now = () => DateTimeIsoSchema.parse(new Date().toISOString());

const page = (ids: string[], nextCursor?: string): AccountOperationsPage => ({
  operations: ids.map((id, i) =>
    mockAccountOperation({
      id,
      date: DateTimeIsoSchema.parse(new Date(Date.UTC(2026, 0, 31 - i)).toISOString()),
    }),
  ),
  complete: nextCursor === undefined,
  ...(nextCursor === undefined ? {} : { nextCursor }),
});

function setup(sources: AccountDataSource[]) {
  const store = configureStore({
    reducer: {
      accountBalances: accountBalancesSlice.reducer,
      accountOperations: accountOperationsSlice.reducer,
    },
    middleware: getDefault =>
      getDefault({
        thunk: { extraArgument: { accountData: createAccountDataRouter(sources) } },
      }),
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return { store, wrapper };
}

describe("useAccountData", () => {
  it("reads the datum on mount and exposes the pending state", async () => {
    const balance = jest.fn(async () => [mockAccountBalance({ at: now() })]);
    const { store, wrapper } = setup([{ id: "s", supports: () => true, balance }]);
    const { result } = renderHook(() => useAccountData(accountBalanceBinding, ref), { wrapper });
    expect(result.current.pending).toBe(true);
    await waitFor(() => expect(result.current.pending).toBe(false));
    expect(selectAccountBalance(store.getState(), ref.accountId)).toBeDefined();
    expect(balance).toHaveBeenCalledTimes(1);
  });

  it("does nothing without a ref", () => {
    const balance = jest.fn(async () => [mockAccountBalance({ at: now() })]);
    const { wrapper } = setup([{ id: "s", supports: () => true, balance }]);
    const { result } = renderHook(() => useAccountData(accountBalanceBinding, undefined), {
      wrapper,
    });
    expect(result.current.pending).toBe(false);
    expect(balance).not.toHaveBeenCalled();
  });

  it("does not re-read on a re-render with an equal inline query", async () => {
    const operations = jest.fn(async () => page(["op-1"]));
    const { wrapper } = setup([{ id: "s", supports: () => true, operations }]);
    const { result, rerender } = renderHook(
      () => useAccountData(accountOperationsBinding, ref, { query: { limit: 10 }, maxAge: 0 }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.pending).toBe(false));
    rerender();
    expect(operations).toHaveBeenCalledTimes(1);
  });

  it("reads again when the ref changes, subject to freshness", async () => {
    const balance = jest.fn(async () => [mockAccountBalance({ at: now() })]);
    const { wrapper } = setup([{ id: "s", supports: () => true, balance }]);
    const { result, rerender } = renderHook(
      ({ current }: { current: AccountRef }) =>
        useAccountData(accountBalanceBinding, current, { maxAge: 0 }),
      { wrapper, initialProps: { current: ref } },
    );
    await waitFor(() => expect(result.current.pending).toBe(false));
    rerender({ current: { ...ref, address: "0xrotated" } });
    await waitFor(() => expect(balance).toHaveBeenCalledTimes(2));
  });

  it("refreshes whatever the freshness", async () => {
    const balance = jest.fn(async () => [mockAccountBalance({ at: now() })]);
    const { wrapper } = setup([{ id: "s", supports: () => true, balance }]);
    const { result } = renderHook(() => useAccountData(accountBalanceBinding, ref), { wrapper });
    await waitFor(() => expect(result.current.pending).toBe(false));
    await act(() => result.current.refresh());
    expect(balance).toHaveBeenCalledTimes(2);
  });

  it("offers loadMore only on a paginated datum", async () => {
    const { wrapper } = setup([
      {
        id: "s",
        supports: () => true,
        balance: async () => [mockAccountBalance({ at: now() })],
        operations: async () => page(["op-1"]),
      },
    ]);
    const balance = renderHook(() => useAccountData(accountBalanceBinding, ref), { wrapper });
    const operations = renderHook(() => useAccountData(accountOperationsBinding, ref), {
      wrapper,
    });
    expect(balance.result.current.loadMore).toBeUndefined();
    expect(operations.result.current.loadMore).toBeInstanceOf(Function);
    await waitFor(() => expect(operations.result.current.pending).toBe(false));
  });

  it("loads the next page into the slice", async () => {
    const operations = jest.fn(async (_ref: AccountRef, query?: { cursor?: string }) =>
      query?.cursor === "c1" ? page(["op-2"]) : page(["op-1"], "c1"),
    );
    const { store, wrapper } = setup([{ id: "s", supports: () => true, operations }]);
    const { result } = renderHook(() => useAccountData(accountOperationsBinding, ref), {
      wrapper,
    });
    await waitFor(() => expect(result.current.pending).toBe(false));
    await act(() => result.current.loadMore!());
    expect(selectAccountOperations(store.getState(), ref.accountId).map(o => o.id)).toEqual([
      "op-1",
      "op-2",
    ]);
  });
});

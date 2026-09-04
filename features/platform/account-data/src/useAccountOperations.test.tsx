import React, { type ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook, waitFor } from "@testing-library/react";
import { AccountIdSchema, DateTimeIsoSchema } from "@shared/schema-primitives";
import { accountOperationsSlice } from "@domain/entity-account-operations";
import { mockAccountOperation } from "@domain/entity-account-operations/schema.mock";
import { registerAccountOperationsSources } from "./register";
import { useAccountOperations } from "./useAccountOperations";
import type { AccountOperationsPage, AccountOperationsSource } from "./operations";
import type { AccountRef } from "./source";

const accountId = AccountIdSchema.parse("js:2:ethereum:0xabc:");
const ref: AccountRef = {
  accountId,
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
};

const op = (id: string, date: string) =>
  mockAccountOperation({ id, date: DateTimeIsoSchema.parse(date) });

const head = [op("op-3", "2026-01-31T12:00:00.000Z"), op("op-2", "2026-01-30T12:00:00.000Z")];
const older = [op("op-1", "2026-01-29T12:00:00.000Z")];

const makeStore = () =>
  configureStore({ reducer: { accountOperations: accountOperationsSlice.reducer } });

const wrapperFor = (store: ReturnType<typeof makeStore>) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };

const scripted = (pages: AccountOperationsPage[]) => {
  let call = 0;
  const source: AccountOperationsSource = {
    id: "granular",
    priority: 10,
    paginated: true,
    supports: () => true,
    getOperations: async () => pages[Math.min(call++, pages.length - 1)],
  };
  return { source, calls: () => call };
};

const PAGED: AccountOperationsPage[] = [
  { operations: head, nextCursor: "c1", complete: false },
  { operations: older, complete: true },
];

describe("useAccountOperations", () => {
  afterEach(() => registerAccountOperationsSources([]));

  it("reads the head on mount", async () => {
    registerAccountOperationsSources([scripted(PAGED).source]);
    const store = makeStore();
    const { result } = renderHook(() => useAccountOperations(ref), { wrapper: wrapperFor(store) });

    await waitFor(() => expect(result.current.operations).toHaveLength(2));
    expect(result.current.operations.map(o => o.id)).toEqual(["op-3", "op-2"]);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.status).toEqual({ pending: false, sourceId: "granular" });
  });

  it("reads once for many components on the same account", async () => {
    const { source, calls } = scripted(PAGED);
    registerAccountOperationsSources([source]);
    const store = makeStore();
    const wrapper = wrapperFor(store);

    renderHook(() => useAccountOperations(ref), { wrapper });
    const { result } = renderHook(() => useAccountOperations(ref), { wrapper });

    await waitFor(() => expect(result.current.operations).toHaveLength(2));
    expect(calls()).toBe(1);
  });

  it("appends the next page on loadMore, and stops when the history is exhausted", async () => {
    const { source, calls } = scripted(PAGED);
    registerAccountOperationsSources([source]);
    const store = makeStore();
    const { result } = renderHook(() => useAccountOperations(ref), { wrapper: wrapperFor(store) });

    await waitFor(() => expect(result.current.hasMore).toBe(true));
    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.operations.map(o => o.id)).toEqual(["op-3", "op-2", "op-1"]);
    expect(result.current.hasMore).toBe(false);

    // Nothing left to resume from: another press must not produce a request.
    await act(async () => {
      await result.current.loadMore();
    });
    expect(calls()).toBe(2);
  });

  it("reports no total while the window is partial, and the loaded count once complete", async () => {
    const { source } = scripted(PAGED);
    registerAccountOperationsSources([source]);
    const store = makeStore();
    const { result } = renderHook(() => useAccountOperations(ref), { wrapper: wrapperFor(store) });

    await waitFor(() => expect(result.current.hasMore).toBe(true));
    expect(result.current.total).toBeUndefined();

    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.total).toBe(3);
  });

  it("reports the total a source could actually produce", async () => {
    registerAccountOperationsSources([
      scripted([{ operations: head, nextCursor: "c1", complete: false, total: 812 }]).source,
    ]);
    const store = makeStore();
    const { result } = renderHook(() => useAccountOperations(ref), { wrapper: wrapperFor(store) });

    await waitFor(() => expect(result.current.total).toBe(812));
  });

  it("forces a head read on refresh", async () => {
    const { source, calls } = scripted(PAGED);
    registerAccountOperationsSources([source]);
    const store = makeStore();
    const { result } = renderHook(() => useAccountOperations(ref), { wrapper: wrapperFor(store) });

    await waitFor(() => expect(calls()).toBe(1));
    await act(async () => {
      await result.current.refresh();
    });
    expect(calls()).toBe(2);
  });

  it("surfaces a read failure on the status", async () => {
    registerAccountOperationsSources([
      {
        id: "granular",
        priority: 10,
        paginated: true,
        supports: () => true,
        getOperations: async () => {
          throw new Error("explorer down");
        },
      },
    ]);
    const store = makeStore();
    const { result } = renderHook(() => useAccountOperations(ref), { wrapper: wrapperFor(store) });

    await waitFor(() => expect(result.current.status.error).toBe("explorer down"));
    expect(result.current.operations).toEqual([]);
  });

  it("does nothing without a ref", () => {
    const { source, calls } = scripted(PAGED);
    registerAccountOperationsSources([source]);
    const store = makeStore();
    const { result } = renderHook(() => useAccountOperations(undefined), {
      wrapper: wrapperFor(store),
    });

    expect(result.current.operations).toEqual([]);
    expect(result.current.total).toBeUndefined();
    expect(calls()).toBe(0);
  });
});

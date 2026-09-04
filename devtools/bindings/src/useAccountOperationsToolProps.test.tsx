import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { AccountIdSchema, DateTimeIsoSchema } from "@shared/schema-primitives";
import { accountOperationsSlice } from "@domain/entity-account-operations";
import { mockAccountOperation } from "@domain/entity-account-operations/schema.mock";
import {
  registerAccountOperationsSources,
  type AccountOperationsPage,
  type AccountOperationsSource,
  type AccountRef,
} from "@features/platform-account-data";
import {
  useAccountOperationsToolProps,
  type AccountOperationsInput,
} from "./useAccountOperationsToolProps";

const accountId = AccountIdSchema.parse("js:2:ethereum:0xabc:");
const tokenAccountId = AccountIdSchema.parse("js:2:ethereum:0xabc:+ethereum%2Ferc20%2Fusd__coin");

const ref: AccountRef = {
  accountId,
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
};

const input: AccountOperationsInput = {
  ref,
  name: "My Ethereum",
  granular: false,
  units: {
    ethereum: { code: "ETH", magnitude: 18 },
    "ethereum/erc20/usd__coin": { code: "USDC", magnitude: 6 },
  },
};

const op = (id: string, date: string, over = {}) =>
  mockAccountOperation({ id, date: DateTimeIsoSchema.parse(date), ...over });

const head = [op("op-2", "2026-01-31T12:00:00.000Z"), op("op-1", "2026-01-30T12:00:00.000Z")];
const older = [op("op-0", "2026-01-29T12:00:00.000Z")];

const buildStore = () =>
  configureStore({ reducer: { accountOperations: accountOperationsSlice.reducer } });

const withStore = (store: ReturnType<typeof buildStore>) =>
  function Wrapper({ children }: PropsWithChildren) {
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

describe("useAccountOperationsToolProps", () => {
  afterEach(() => registerAccountOperationsSources([]));

  it("reports an account the layer has never read", () => {
    const store = buildStore();
    const { result } = renderHook(() => useAccountOperationsToolProps([input]), {
      wrapper: withStore(store),
    });

    const [row] = result.current.accounts;
    expect(row).toMatchObject({ accountId, name: "My Ethereum", currencyId: "ethereum" });
    expect(row.operations).toEqual([]);
    expect(row.total).toBeUndefined();
    expect(row.hasMore).toBe(false);
    expect(row.status).toEqual({ pending: false });
  });

  it("is not ready until the host has registered a history source", () => {
    const store = buildStore();
    const { result, rerender } = renderHook(() => useAccountOperationsToolProps([input]), {
      wrapper: withStore(store),
    });
    expect(result.current.ready).toBe(false);

    registerAccountOperationsSources([scripted(PAGED).source]);
    rerender();
    expect(result.current.ready).toBe(true);
  });

  it("projects the loaded window with the host's display units", () => {
    const store = buildStore();
    store.dispatch(
      accountOperationsSlice.actions.accountOperationsReceived({
        accountId,
        operations: head,
        nextCursor: "c1",
        complete: false,
        sourceId: "granular",
        at: "2026-01-31T13:00:00.000Z",
      }),
    );

    const { result } = renderHook(() => useAccountOperationsToolProps([input]), {
      wrapper: withStore(store),
    });

    const [row] = result.current.accounts;
    expect(row.operations.map(o => o.id)).toEqual(["op-2", "op-1"]);
    expect(row.operations[0].unit).toEqual({ code: "ETH", magnitude: 18 });
    expect(row.hasMore).toBe(true);
    expect(row.status).toEqual({ pending: false, sourceId: "granular" });
  });

  it("leaves total undefined while the window is partial — the tool must not invent one", () => {
    const store = buildStore();
    store.dispatch(
      accountOperationsSlice.actions.accountOperationsReceived({
        accountId,
        operations: head,
        nextCursor: "c1",
        complete: false,
        sourceId: "granular",
        at: "2026-01-31T13:00:00.000Z",
      }),
    );

    const { result } = renderHook(() => useAccountOperationsToolProps([input]), {
      wrapper: withStore(store),
    });
    expect(result.current.accounts[0].total).toBeUndefined();
    expect(result.current.accounts[0].complete).toBe(false);
  });

  it("flags a nested row and one that landed on a token account", () => {
    const store = buildStore();
    store.dispatch(
      accountOperationsSlice.actions.accountOperationsReceived({
        accountId,
        operations: [
          op("op-1", "2026-01-31T12:00:00.000Z"),
          op("sub-1", "2026-01-31T12:00:00.000Z", {
            accountId: tokenAccountId,
            parentOperationId: "op-1",
          }),
        ],
        complete: true,
        sourceId: "full-sync",
        at: "2026-01-31T13:00:00.000Z",
      }),
    );

    const { result } = renderHook(() => useAccountOperationsToolProps([input]), {
      wrapper: withStore(store),
    });

    const rows = result.current.accounts[0].operations;
    expect(rows.find(o => o.id === "op-1")).toMatchObject({ nested: false, onTokenAccount: false });
    expect(rows.find(o => o.id === "sub-1")).toMatchObject({ nested: true, onTokenAccount: true });
  });

  it("forces a head read on refresh", async () => {
    const { source, calls } = scripted(PAGED);
    registerAccountOperationsSources([source]);
    const store = buildStore();
    const { result } = renderHook(() => useAccountOperationsToolProps([input]), {
      wrapper: withStore(store),
    });

    await act(async () => {
      result.current.onRefresh(accountId);
    });
    await waitFor(() => expect(calls()).toBe(1));

    // `maxAge: 0` — a second press must hit the network even though the head is seconds old.
    await act(async () => {
      result.current.onRefresh(accountId);
    });
    await waitFor(() => expect(calls()).toBe(2));
  });

  it("resumes from the cursor on load more, then stops", async () => {
    const { source, calls } = scripted(PAGED);
    registerAccountOperationsSources([source]);
    const store = buildStore();
    const { result } = renderHook(() => useAccountOperationsToolProps([input]), {
      wrapper: withStore(store),
    });

    await act(async () => {
      result.current.onRefresh(accountId);
    });
    await waitFor(() => expect(result.current.accounts[0].hasMore).toBe(true));

    await act(async () => {
      result.current.onLoadMore(accountId);
    });
    await waitFor(() => expect(result.current.accounts[0].operations).toHaveLength(3));
    expect(result.current.accounts[0].hasMore).toBe(false);
    expect(result.current.accounts[0].total).toBe(3);

    // Nothing left to resume from.
    await act(async () => {
      result.current.onLoadMore(accountId);
    });
    expect(calls()).toBe(2);
  });

  it("ignores an account it was not given", async () => {
    const { source, calls } = scripted(PAGED);
    registerAccountOperationsSources([source]);
    const store = buildStore();
    const { result } = renderHook(() => useAccountOperationsToolProps([input]), {
      wrapper: withStore(store),
    });

    await act(async () => {
      result.current.onRefresh("js:2:ethereum:0xnope:");
      result.current.onLoadMore("js:2:ethereum:0xnope:");
    });
    expect(calls()).toBe(0);
  });
});

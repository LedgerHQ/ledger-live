import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { AccountDataSource } from "@domain/api-account-data-source";
import {
  counterBinding,
  feedBinding,
  accountId,
  descriptor,
  makeStore,
  type FeedPage,
} from "@domain/api-account-data-source/testing";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { useAccountData } from "./useAccountData";

const page = (items: string[], nextCursor?: string): FeedPage => ({
  items,
  ...(nextCursor === undefined ? {} : { nextCursor }),
});

function setup(sources: AccountDataSource[]) {
  const store = makeStore(sources);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return { store, wrapper };
}

describe("useAccountData", () => {
  it("reads the datum on mount and exposes the pending state", async () => {
    const counter = jest.fn(async () => 1);
    const { store, wrapper } = setup([{ id: "s", supports: () => true, counter }]);
    const { result } = renderHook(() => useAccountData(counterBinding, descriptor), { wrapper });
    expect(result.current.pending).toBe(true);
    await waitFor(() => expect(result.current.pending).toBe(false));
    expect(store.getState().counter.byAccount[accountId]?.value).toBe(1);
    expect(counter).toHaveBeenCalledTimes(1);
  });

  it("does nothing without a descriptor", () => {
    const counter = jest.fn(async () => 1);
    const { wrapper } = setup([{ id: "s", supports: () => true, counter }]);
    const { result } = renderHook(() => useAccountData(counterBinding, undefined), { wrapper });
    expect(result.current.pending).toBe(false);
    expect(counter).not.toHaveBeenCalled();
  });

  it("does not re-read on a re-render with an equal inline query", async () => {
    const feed = jest.fn(async () => page(["a"]));
    const { wrapper } = setup([{ id: "s", supports: () => true, feed }]);
    const { result, rerender } = renderHook(
      () => useAccountData(feedBinding, descriptor, { query: { limit: 10 }, maxAge: 0 }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.pending).toBe(false));
    rerender();
    expect(feed).toHaveBeenCalledTimes(1);
  });

  it("reads again when the descriptor changes, subject to freshness", async () => {
    const counter = jest.fn(async () => 1);
    const { wrapper } = setup([{ id: "s", supports: () => true, counter }]);
    const { result, rerender } = renderHook(
      ({ current }: { current: AccountDescriptor }) =>
        useAccountData(counterBinding, current, { maxAge: 0 }),
      { wrapper, initialProps: { current: descriptor } },
    );
    await waitFor(() => expect(result.current.pending).toBe(false));
    rerender({ current: { ...descriptor, path: "m/44h/60h/1h/0/0" } });
    await waitFor(() => expect(counter).toHaveBeenCalledTimes(2));
  });

  it("refreshes whatever the freshness", async () => {
    const counter = jest.fn(async () => 1);
    const { wrapper } = setup([{ id: "s", supports: () => true, counter }]);
    const { result } = renderHook(() => useAccountData(counterBinding, descriptor), { wrapper });
    await waitFor(() => expect(result.current.pending).toBe(false));
    await act(() => result.current.refresh());
    expect(counter).toHaveBeenCalledTimes(2);
  });

  it("exposes the id the account is keyed by", () => {
    const { wrapper } = setup([{ id: "s", supports: () => true, counter: async () => 1 }]);
    const { result } = renderHook(() => useAccountData(counterBinding, descriptor), { wrapper });
    expect(result.current.accountId).toBe(accountId);
  });

  it("offers loadMore only on a paginated datum", async () => {
    const { wrapper } = setup([
      {
        id: "s",
        supports: () => true,
        counter: async () => 1,
        feed: async () => page(["a"]),
      },
    ]);
    const counter = renderHook(() => useAccountData(counterBinding, descriptor), { wrapper });
    const feed = renderHook(() => useAccountData(feedBinding, descriptor), { wrapper });
    expect(counter.result.current.loadMore).toBeUndefined();
    expect(feed.result.current.loadMore).toBeInstanceOf(Function);
    await waitFor(() => expect(feed.result.current.pending).toBe(false));
  });

  it("loads the next page into the slice", async () => {
    const feed = jest.fn(async (_target: unknown, query?: { cursor?: string }) =>
      query?.cursor === "c1" ? page(["b"]) : page(["a"], "c1"),
    );
    const { store, wrapper } = setup([{ id: "s", supports: () => true, feed }]);
    const { result } = renderHook(() => useAccountData(feedBinding, descriptor), { wrapper });
    await waitFor(() => expect(result.current.pending).toBe(false));
    await act(() => result.current.loadMore!());
    expect(store.getState().feed.byAccount[accountId]?.value.items).toEqual(["a", "b"]);
  });
});

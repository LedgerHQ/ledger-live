/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { useMarketData } from "../useMarketData";
import { marketApi } from "../../state-manager/marketApi";
import { server } from "@tests/server";
import { createTestStore, createWrapper } from "@tests/test-helpers/testUtils";
import { createMockMarketItemResponse } from "../../utils/fixtures";

const REFRESH_RATE = 200;

function marketPage(count: number, idPrefix: string) {
  return Array.from({ length: count }, (_, index) =>
    createMockMarketItemResponse({ id: `${idPrefix}-${index}`, name: `${idPrefix} ${index}` }),
  );
}

describe("useMarketData", () => {
  let store: ReturnType<typeof createTestStore>;
  let requests: URL[];
  let requestListener: (args: { request: Request }) => void;

  beforeAll(() => server.listen());

  afterEach(() => {
    server.events.removeListener("request:start", requestListener);
    server.resetHandlers();
    store.dispatch(marketApi.util.resetApiState());
  });

  afterAll(() => server.close());

  beforeEach(() => {
    store = createTestStore([marketApi], { disableSerializableCheck: true });
    requests = [];
    requestListener = ({ request }: { request: Request }) => {
      if (request.url.includes("/v3/markets")) requests.push(new URL(request.url));
    };
    server.events.on("request:start", requestListener);
    server.use(
      http.get("*/v3/markets", ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page") ?? 0);
        const pageSize = Number(url.searchParams.get("pageSize") ?? 0);
        if (page === 0) return HttpResponse.json(marketPage(pageSize, "page-0"));
        if (page === 1) return HttpResponse.json(marketPage(1, "page-1"));
        return HttpResponse.json([]);
      }),
    );
  });

  function pageRequests(page: string) {
    return requests.filter(url => url.searchParams.get("page") === page).length;
  }

  it("requests the first page at page 0 with a legal page size", async () => {
    const { result, unmount } = renderHook(
      () => useMarketData({ counterCurrency: "usd", limit: 5 }),
      { wrapper: createWrapper(store) },
    );

    await waitFor(() => expect(result.current.data).toHaveLength(5));

    const url = requests[0];
    expect(url.searchParams.get("page")).toBe("0");
    expect(url.searchParams.get("pageSize")).toBe("5");
    expect(url.searchParams.get("to")).toBe("usd");
    unmount();
  });

  it("drops the previous rows when the query changes", async () => {
    const { result, rerender, unmount } = renderHook(
      ({ search }: { search: string }) =>
        useMarketData({ counterCurrency: "usd", limit: 5, search }),
      { wrapper: createWrapper(store), initialProps: { search: "bt" } },
    );

    await waitFor(() => expect(result.current.data).toHaveLength(5));

    rerender({ search: "eth" });

    expect(result.current.data).toEqual([]);
    await waitFor(() => expect(result.current.data).toHaveLength(5));
    unmount();
  });

  it("loads the next page and stops when the page is shorter than the page size", async () => {
    const { result, unmount } = renderHook(
      () => useMarketData({ counterCurrency: "usd", limit: 5 }),
      { wrapper: createWrapper(store) },
    );

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));
    act(() => result.current.fetchNextPage());
    await waitFor(() => expect(result.current.data.map(item => item.id)).toContain("page-1-0"));

    expect(pageRequests("1")).toBe(1);
    expect(result.current.hasNextPage).toBe(false);
    unmount();
  });

  it("does not request the list when disabled", async () => {
    const { result, unmount } = renderHook(
      () => useMarketData({ counterCurrency: "usd", limit: 5 }, { enabled: false }),
      { wrapper: createWrapper(store) },
    );

    expect(result.current.isPending).toBe(true);
    await new Promise(resolve => setTimeout(resolve, REFRESH_RATE));
    expect(requests).toHaveLength(0);
    unmount();
  });

  it("does not refetch before the refresh rate elapses", async () => {
    const { unmount } = renderHook(
      () => useMarketData({ counterCurrency: "usd", limit: 5 }, { refreshRate: REFRESH_RATE }),
      { wrapper: createWrapper(store) },
    );

    await waitFor(() => expect(pageRequests("0")).toBe(1));
    await new Promise(resolve => setTimeout(resolve, REFRESH_RATE / 2));

    expect(pageRequests("0")).toBe(1);
    unmount();
  });

  it("refetches every loaded page each time the refresh rate elapses", async () => {
    const { result, unmount } = renderHook(
      () => useMarketData({ counterCurrency: "usd", limit: 5 }, { refreshRate: REFRESH_RATE }),
      { wrapper: createWrapper(store) },
    );

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));
    act(() => result.current.fetchNextPage());
    await waitFor(() => expect(pageRequests("1")).toBe(1));

    await waitFor(() => expect(pageRequests("0")).toBe(2), { timeout: 2000 });
    await waitFor(() => expect(pageRequests("1")).toBe(2), { timeout: 2000 });

    unmount();
  });

  it("does not refetch when no refresh rate is set", async () => {
    const { unmount } = renderHook(() => useMarketData({ counterCurrency: "usd", limit: 5 }), {
      wrapper: createWrapper(store),
    });

    await waitFor(() => expect(pageRequests("0")).toBe(1));
    await new Promise(resolve => setTimeout(resolve, REFRESH_RATE * 2));

    expect(pageRequests("0")).toBe(1);
    unmount();
  });

  it("drops the loaded pages after the first one", async () => {
    const { result, unmount } = renderHook(
      () => useMarketData({ counterCurrency: "usd", limit: 5 }),
      { wrapper: createWrapper(store) },
    );

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));
    act(() => result.current.fetchNextPage());
    await waitFor(() => expect(result.current.data).toHaveLength(6));

    act(() => result.current.resetToFirstPage());

    await waitFor(() => expect(result.current.data).toHaveLength(5));
    unmount();
  });
});

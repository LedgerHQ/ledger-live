/**
 * @jest-environment jsdom
 *
 */

import { renderHook, waitFor } from "@testing-library/react";
import { useCurrencyData } from "../useMarketDataProvider";
import { countervaluesApi } from "../../state-manager/countervaluesApi";
import { server } from "@tests/server";
import { createTestStore, createWrapper } from "@tests/test-helpers/testUtils";

jest.mock("../../utils/timers", () => ({
  ...jest.requireActual("../../utils/timers"),
  REFETCH_TIME_ONE_MINUTE: 50,
  BASIC_REFETCH: 2,
}));

describe("useCurrencyData", () => {
  let store: ReturnType<typeof createTestStore>;
  let requestCount: number;
  let lastRequestUrl: string | null;
  let requestListener: (args: { request: Request }) => void;

  beforeAll(() => server.listen());

  afterEach(() => {
    server.events.removeListener("request:start", requestListener);
    server.resetHandlers();
    store.dispatch(countervaluesApi.util.resetApiState());
  });

  afterAll(() => server.close());

  beforeEach(() => {
    store = createTestStore([countervaluesApi], { disableSerializableCheck: true });
    requestCount = 0;
    lastRequestUrl = null;
    requestListener = ({ request }: { request: Request }) => {
      if (request.url.includes("/v3/markets")) {
        requestCount += 1;
        lastRequestUrl = request.url;
      }
    };
    server.events.on("request:start", requestListener);
  });

  it("should call API with correct params and polling interval config", async () => {
    const wrapper = createWrapper(store);
    const { unmount } = renderHook(
      () => useCurrencyData({ id: "bitcoin", counterCurrency: "usd" }),
      { wrapper },
    );

    await waitFor(() => expect(requestCount).toBe(1));

    const url = new URL(lastRequestUrl ?? "");
    expect(url.searchParams.get("ids")).toBe("bitcoin");
    expect(url.searchParams.get("to")).toBe("usd");

    unmount();
  });

  it("should use 180000ms (3 minutes) as polling interval in production", () => {
    const { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH } = jest.requireActual("../../utils/timers");
    expect(REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH).toBe(180000);
  });

  it("should pass id and counterCurrency to the query", async () => {
    const wrapper = createWrapper(store);
    const { unmount } = renderHook(
      () => useCurrencyData({ id: "solana", counterCurrency: "gbp" }),
      { wrapper },
    );

    await waitFor(() => expect(requestCount).toBe(1));

    const url = new URL(lastRequestUrl ?? "");
    expect(url.searchParams.get("ids")).toBe("solana");
    expect(url.searchParams.get("to")).toBe("gbp");

    unmount();
  });

  it("should refetch data automatically based on pollingInterval", async () => {
    const wrapper = createWrapper(store);
    const { result, unmount } = renderHook(
      () => useCurrencyData({ id: "bitcoin", counterCurrency: "usd" }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(requestCount).toBe(1);

    await waitFor(() => expect(requestCount).toBe(2), { timeout: 2000 });
    await waitFor(() => expect(result.current.isFetching).toBe(false));

    unmount();
  });
});

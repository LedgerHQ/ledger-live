/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@tests/server";
import { createTestStore, createWrapper } from "@tests/test-helpers/testUtils";
import { cgApi } from "../../state-manager/api";
import { useMarketDataProvider } from "../useCoingeckoDataProvider";

describe("useMarketDataProvider", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeAll(() => server.listen());

  beforeEach(() => {
    store = createTestStore([cgApi], { disableSerializableCheck: true });
    server.use(
      http.get("*/simple/supported_vs_currencies", () => HttpResponse.json(["usd", "eur"])),
    );
  });

  afterEach(() => {
    server.resetHandlers();
    store.dispatch(cgApi.util.resetApiState());
  });

  afterAll(() => server.close());

  it("exposes the supported counter currencies", async () => {
    const { result, unmount } = renderHook(() => useMarketDataProvider(), {
      wrapper: createWrapper(store),
    });

    await waitFor(() => expect(result.current.supportedCounterCurrencies).toEqual(["usd", "eur"]));

    unmount();
  });
});

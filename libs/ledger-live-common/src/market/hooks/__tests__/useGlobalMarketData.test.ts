/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { cvsApiExtra } from "@shared/api-services";
import { marketIndexGlobalApi } from "@domain/api-market-index-global";
import { mockGlobalMarketDataResponse } from "@domain/api-market-index-global/mock";
import { server } from "@tests/server";
import { createTestStore, createWrapper } from "@tests/test-helpers/testUtils";
import { useGlobalMarketData } from "../useGlobalMarketData";

const CVS_URL = "https://cvs.test";

describe("useGlobalMarketData", () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("loads the global market index in the requested counter currency", async () => {
    const requested: URL[] = [];
    server.use(
      http.get(`${CVS_URL}/v3/markets/global`, ({ request }) => {
        requested.push(new URL(request.url));
        return HttpResponse.json(mockGlobalMarketDataResponse);
      }),
    );
    const store = createTestStore([marketIndexGlobalApi], {
      extra: cvsApiExtra({ getCountervaluesServiceUrl: () => CVS_URL }),
    });

    const { result } = renderHook(() => useGlobalMarketData({ counterCurrency: "usd" }), {
      wrapper: createWrapper(store),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(requested).toHaveLength(1);
    expect(requested[0].searchParams.get("to")).toBe("usd");
    expect(result.current.data).toEqual({
      marketCap: 2_450_000_000_000,
      changePercentage24h: expect.any(Number),
    });
  });
});

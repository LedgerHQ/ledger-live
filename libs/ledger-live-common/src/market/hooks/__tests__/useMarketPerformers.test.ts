/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { cvsApiExtra } from "@shared/api-services";
import { marketPerformersApi } from "@domain/api-market-performers";
import { mockMarketItemResponse } from "@domain/api-market-currency/mock";
import { server } from "@tests/server";
import { createTestStore, createWrapper } from "@tests/test-helpers/testUtils";
import { useMarketPerformers } from "../useMarketPerformers";

const CVS_URL = "https://cvs.test";

describe("useMarketPerformers", () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("loads the performers of the window, with the sort and limit", async () => {
    const requested: URL[] = [];
    server.use(
      http.get(`${CVS_URL}/v3/markets`, ({ request }) => {
        requested.push(new URL(request.url));
        return HttpResponse.json([mockMarketItemResponse({ id: "bitcoin" })]);
      }),
    );
    const store = createTestStore([marketPerformersApi], {
      extra: cvsApiExtra({ getCountervaluesServiceUrl: () => CVS_URL }),
    });

    const { result } = renderHook(
      () =>
        useMarketPerformers({
          counterCurrency: "usd",
          range: "day",
          sort: "desc",
          limit: 5,
          top: 50,
          supported: true,
          refreshRate: 0,
        }),
      { wrapper: createWrapper(store) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(requested).toHaveLength(1);
    expect(requested[0].searchParams.get("sort")).toBe("negative-price-change-1d");
    expect(result.current.data?.map(performer => performer.id)).toEqual(["bitcoin"]);
  });
});

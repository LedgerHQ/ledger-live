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
import { useTrendingPerformers } from "../useTrendingPerformers";

const CVS_URL = "https://cvs.test";

describe("useTrendingPerformers", () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("keeps only the supported trending currencies, in the trending order", async () => {
    server.use(
      http.get(`${CVS_URL}/v3/currencies/trending`, () =>
        HttpResponse.json([
          { id: "ethereum", supported: true },
          { id: "unknown-coin", supported: false },
          { id: "bitcoin", supported: true },
        ]),
      ),
      http.get(`${CVS_URL}/v3/markets`, () =>
        HttpResponse.json([
          mockMarketItemResponse({ id: "bitcoin" }),
          mockMarketItemResponse({ id: "ethereum" }),
        ]),
      ),
    );
    const store = createTestStore([marketPerformersApi], {
      extra: cvsApiExtra({ getCountervaluesServiceUrl: () => CVS_URL }),
    });

    const { result } = renderHook(
      () => useTrendingPerformers({ counterCurrency: "usd", refreshRate: 0 }),
      { wrapper: createWrapper(store) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map(performer => performer.id)).toEqual(["ethereum", "bitcoin"]);
  });
});

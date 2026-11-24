import { configureStore } from "@reduxjs/toolkit";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { countervaluesApi, cvsApiExtra } from "@shared/api-services";
import { trendingCategoriesApi, useGetTrendingCategoriesQuery } from "./api";
import { mockTrendingCategoriesResponse } from "./trendingCategories.mock";

const CVS_URL = "https://cvs.test";
const CATEGORIES_URL = `${CVS_URL}/v3/categories/trending`;

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Wired the way the apps wire it: the store registers the service api, and the endpoint only
// exists because importing this package injected it.
const makeStore = () =>
  configureStore({
    reducer: { [countervaluesApi.reducerPath]: countervaluesApi.reducer },
    middleware: gdm =>
      gdm({
        serializableCheck: false,
        thunk: { extraArgument: cvsApiExtra({ getCountervaluesServiceUrl: () => CVS_URL }) },
      }).concat(countervaluesApi.middleware),
  });

describe("trendingCategoriesApi configuration", () => {
  it("is the countervalues service api, mutated in place by injectEndpoints", () => {
    expect(trendingCategoriesApi).toBe(countervaluesApi);
    expect(trendingCategoriesApi.reducerPath).toBe("countervaluesApi");
  });

  it("exposes the getTrendingCategories endpoint and its hook", () => {
    expect(trendingCategoriesApi.endpoints.getTrendingCategories).toBeDefined();
    expect(useGetTrendingCategoriesQuery).toBeDefined();
  });
});

describe("getTrendingCategories", () => {
  it("requests the trending categories path", async () => {
    const seen: URL[] = [];
    server.use(
      http.get(CATEGORIES_URL, ({ request }) => {
        seen.push(new URL(request.url));
        return HttpResponse.json(mockTrendingCategoriesResponse);
      }),
    );

    await makeStore().dispatch(trendingCategoriesApi.endpoints.getTrendingCategories.initiate());

    expect(seen).toHaveLength(1);
    expect(seen[0].pathname).toBe("/v3/categories/trending");
  });

  it("returns the first five categories", async () => {
    server.use(http.get(CATEGORIES_URL, () => HttpResponse.json(mockTrendingCategoriesResponse)));

    const result = await makeStore().dispatch(
      trendingCategoriesApi.endpoints.getTrendingCategories.initiate(),
    );

    expect(result.data).toHaveLength(5);
    expect(result.data?.[0]).toEqual({ id: "infrastructure", name: "Infrastructure" });
  });

  it("surfaces an error when the response is not a list of categories", async () => {
    server.use(http.get(CATEGORIES_URL, () => HttpResponse.json({ id: "defi" })));

    const result = await makeStore().dispatch(
      trendingCategoriesApi.endpoints.getTrendingCategories.initiate(),
    );

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  it("does not retry a failed request", async () => {
    let hits = 0;
    server.use(
      http.get(CATEGORIES_URL, () => {
        hits += 1;
        return HttpResponse.json({}, { status: 500 });
      }),
    );

    const result = await makeStore().dispatch(
      trendingCategoriesApi.endpoints.getTrendingCategories.initiate(),
    );

    expect(result.error).toBeDefined();
    expect(hits).toBe(1);
  });
});

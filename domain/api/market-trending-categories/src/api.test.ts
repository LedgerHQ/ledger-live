import { configureStore } from "@reduxjs/toolkit";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { countervaluesApi, cvsApiExtra } from "@shared/api-services";
import { marketTrendingCategoriesApi } from "./api";

const TRENDING_URL = "https://cvs.test/v3/categories/trending";

const makeCategories = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `category-${index}`,
    name: `Category ${index}`,
  }));

// Wired the way the apps wire it: the store registers the service api, and the endpoint only
// exists because importing this package injected it.
const makeStore = () =>
  configureStore({
    reducer: { [countervaluesApi.reducerPath]: countervaluesApi.reducer },
    middleware: gdm =>
      gdm({
        thunk: {
          extraArgument: cvsApiExtra({
            getCountervaluesServiceUrl: () => "https://cvs.test",
          }),
        },
      }).concat(countervaluesApi.middleware),
  });

const fetchTrendingCategories = () =>
  makeStore().dispatch(marketTrendingCategoriesApi.endpoints.getTrendingCategories.initiate());

describe("marketTrendingCategoriesApi configuration", () => {
  it("is the Countervalues service api, mutated in place by injectEndpoints", () => {
    expect(marketTrendingCategoriesApi).toBe(countervaluesApi);
  });
});

describe("getTrendingCategories", () => {
  const server = setupServer();

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => {
    server.close();
  });

  it("requests the trending categories URL", async () => {
    let seenUrl: string | undefined;
    server.use(
      http.get(TRENDING_URL, ({ request }) => {
        seenUrl = request.url;
        return HttpResponse.json(makeCategories(2));
      }),
    );

    await fetchTrendingCategories();

    expect(seenUrl).toBe(TRENDING_URL);
  });

  it("returns the validated categories", async () => {
    server.use(http.get(TRENDING_URL, () => HttpResponse.json(makeCategories(3))));

    const result = await fetchTrendingCategories();

    expect(result.data).toEqual(makeCategories(3));
  });

  it("keeps only the first 5 categories", async () => {
    server.use(http.get(TRENDING_URL, () => HttpResponse.json(makeCategories(8))));

    const result = await fetchTrendingCategories();

    expect(result.data).toEqual(makeCategories(5));
  });

  it("fails with a described error when the payload does not match the schema", async () => {
    server.use(http.get(TRENDING_URL, () => HttpResponse.json([{ id: "x" }])));

    const result = await fetchTrendingCategories();

    expect(result.data).toBeUndefined();
    expect(result.error).toEqual({
      status: "CUSTOM_ERROR",
      error: expect.stringContaining("0.name"),
    });
  });

  it("surfaces an HTTP failure as a query error without retrying", async () => {
    let calls = 0;
    server.use(
      http.get(TRENDING_URL, () => {
        calls += 1;
        return HttpResponse.json({ error: "no" }, { status: 500 });
      }),
    );

    const result = await fetchTrendingCategories();

    expect(result.data).toBeUndefined();
    expect(result.error).toMatchObject({ status: 500 });
    expect(calls).toBe(1);
  });

  it("surfaces a network failure as a query error without retrying", async () => {
    let calls = 0;
    server.use(
      http.get(TRENDING_URL, () => {
        calls += 1;
        return HttpResponse.error();
      }),
    );

    const result = await fetchTrendingCategories();

    expect(result.data).toBeUndefined();
    expect(result.error).toMatchObject({ status: "FETCH_ERROR" });
    expect(calls).toBe(1);
  });
});

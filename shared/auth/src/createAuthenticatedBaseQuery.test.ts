import { configureStore } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query";
import { HttpResponse, http } from "msw";
import { setupServer, type SetupServerApi } from "msw/node";
import { createAuthenticatedBaseQuery } from "./createAuthenticatedBaseQuery";
import type { AuthProvider } from "./types";

const API_BASE_URL = "https://api.ledger.test";

describe("createAuthenticatedBaseQuery", () => {
  const withToken = jest.fn();
  const retryPredicateError = new Error("Retry predicate failed");
  const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

  // Setup RTK API
  const api = createApi({
    reducerPath: "authenticatedBaseQueryTestApi",

    baseQuery: createAuthenticatedBaseQuery({ baseUrl: API_BASE_URL }),

    endpoints: build => ({
      publicQuery: build.query<{ ok: boolean }, void>({
        query: () => "/public",
        extraOptions: {
          authenticated: false,
        },
      }),
      gatedQuery: build.query<{ ok: boolean }, void>({
        query: () => "/private",
      }),
      gatedQueryWithHeader: build.query<{ ok: boolean }, void>({
        query: () => ({
          url: "/private",
          headers: { "x-custom-header": "request-value" },
        }),
      }),
      gatedQueryWithValidatedStatus: build.query<{ ok: boolean }, void>({
        query: () => ({
          url: "/private",
          validateStatus: () => true,
        }),
      }),
      gatedQueryWithValidatedStatusAndCustomRetry: build.query<{ ok: boolean }, void>({
        query: () => ({
          url: "/private",
          validateStatus: () => true,
        }),
        extraOptions: {
          refreshAndRetryWhen: result => result.meta?.response?.status === 401,
        },
      }),
      gatedQueryWithThrowingRetry: build.query<{ ok: boolean }, void>({
        query: () => "/private",
        extraOptions: {
          refreshAndRetryWhen() {
            throw retryPredicateError;
          },
        },
      }),
    }),
  });

  // Setup Redux store
  const authProvider: AuthProvider = { withToken };
  const store = configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: { authProvider },
        },
      }).concat(api.middleware),
  });

  // Setup mock server
  const endpoints = {
    public: jest.fn().mockReturnValue(HttpResponse.json({ ok: true })),
    private: jest.fn().mockReturnValue(HttpResponse.json({ ok: true })),
  };
  const server: SetupServerApi = setupServer(
    // API endpoints:
    http.all(`${API_BASE_URL}/public`, endpoints.public),
    http.all(`${API_BASE_URL}/private`, endpoints.private),
  );

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    withToken.mockReset().mockImplementation(async ({ queryFn, refreshAndRetryWhen }) => {
      const result = await queryFn({ tokenType: "Bearer", accessToken: "access-token" });
      return refreshAndRetryWhen?.(result)
        ? queryFn({ tokenType: "Bearer", accessToken: "refreshed-token" })
        : result;
    });

    store.dispatch(api.util.resetApiState());

    endpoints.public.mockReturnValue(HttpResponse.json({ ok: true }));
    endpoints.private.mockReturnValue(HttpResponse.json({ ok: true }));
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    server.close();
  });

  it("does not authenticate endpoints that explicitly opt out", async () => {
    const { status, data, error } = await store.dispatch(api.endpoints.publicQuery.initiate());

    expect(status).toBe("fulfilled");
    expect(data).toEqual({ ok: true });
    expect(error).toBe(undefined);

    expect(endpoints.public).toHaveBeenCalledTimes(1);
    const request = endpoints.public.mock.calls[0][0].request;
    expect(request.headers.get("authorization")).toBeNull();
    expect(request.headers.get("x-custom-header")).toBeNull();
    expect(authProvider.withToken).not.toHaveBeenCalled();
  });

  it("preserves request headers while appending authorization by default", async () => {
    const { status, data, error } = await store.dispatch(
      api.endpoints.gatedQueryWithHeader.initiate(),
    );

    expect(status).toBe("fulfilled");
    expect(data).toEqual({ ok: true });
    expect(error).toBe(undefined);

    expect(endpoints.private).toHaveBeenCalledTimes(1);
    const request = endpoints.private.mock.calls[0][0].request;
    expect(request.headers.get("authorization")).toBe("Bearer access-token");
    expect(request.headers.get("x-custom-header")).toBe("request-value");
    expect(authProvider.withToken).toHaveBeenCalledTimes(1);
  });

  it("refreshes the token and retries once on 401", async () => {
    endpoints.private
      .mockReturnValueOnce(HttpResponse.json({ ok: false }, { status: 401 }))
      .mockReturnValueOnce(HttpResponse.json({ ok: true }));

    const { status, data, error } = await store.dispatch(api.endpoints.gatedQuery.initiate());

    expect(status).toBe("fulfilled");
    expect(data).toEqual({ ok: true });
    expect(error).toBe(undefined);

    expect(endpoints.private).toHaveBeenCalledTimes(2);
    const firstRequest = endpoints.private.mock.calls[0][0].request;
    expect(firstRequest.headers.get("authorization")).toBe("Bearer access-token");
    const secondRequest = endpoints.private.mock.calls[1][0].request;
    expect(secondRequest.headers.get("authorization")).toBe("Bearer refreshed-token");
    expect(authProvider.withToken).toHaveBeenCalledTimes(1);
  });

  it("does not refresh or retry non-401 failures", async () => {
    endpoints.private.mockReturnValueOnce(HttpResponse.json({ ok: true }, { status: 500 }));

    const { status, data, error } = await store.dispatch(api.endpoints.gatedQuery.initiate());

    expect(status).toBe("rejected");
    expect(data).toBe(undefined);
    expect(error).toHaveProperty("status", 500);

    expect(endpoints.private).toHaveBeenCalledTimes(1);
    expect(authProvider.withToken).toHaveBeenCalledTimes(1);
  });

  it("does not retry a 401 accepted by validateStatus by default", async () => {
    endpoints.private.mockReturnValueOnce(HttpResponse.json({ ok: false }, { status: 401 }));

    const { status, data, error } = await store.dispatch(
      api.endpoints.gatedQueryWithValidatedStatus.initiate(),
    );

    expect(status).toBe("fulfilled");
    expect(data).toEqual({ ok: false });
    expect(error).toBe(undefined);
    expect(endpoints.private).toHaveBeenCalledTimes(1);
    expect(endpoints.private.mock.calls[0][0].request.headers.get("authorization")).toBe(
      "Bearer access-token",
    );
    expect(authProvider.withToken).toHaveBeenCalledTimes(1);
  });

  it("uses a custom predicate to retry a 401 accepted by validateStatus", async () => {
    endpoints.private
      .mockReturnValueOnce(HttpResponse.json({ ok: false }, { status: 401 }))
      .mockReturnValueOnce(HttpResponse.json({ ok: true }));

    const { status, data, error } = await store.dispatch(
      api.endpoints.gatedQueryWithValidatedStatusAndCustomRetry.initiate(),
    );

    expect(status).toBe("fulfilled");
    expect(data).toEqual({ ok: true });
    expect(error).toBe(undefined);
    expect(endpoints.private).toHaveBeenCalledTimes(2);
    expect(endpoints.private.mock.calls[0][0].request.headers.get("authorization")).toBe(
      "Bearer access-token",
    );
    expect(endpoints.private.mock.calls[1][0].request.headers.get("authorization")).toBe(
      "Bearer refreshed-token",
    );
    expect(authProvider.withToken).toHaveBeenCalledTimes(1);
  });

  it("returns the original authenticated response when a custom predicate throws", async () => {
    endpoints.private.mockReturnValueOnce(HttpResponse.json({ ok: false }, { status: 401 }));

    const { status, data, error } = await store.dispatch(
      api.endpoints.gatedQueryWithThrowingRetry.initiate(),
    );

    expect(status).toBe("rejected");
    expect(data).toBe(undefined);
    expect(error).toHaveProperty("status", 401);
    expect(endpoints.private).toHaveBeenCalledTimes(1);
    expect(endpoints.private.mock.calls[0][0].request.headers.get("authorization")).toBe(
      "Bearer access-token",
    );
    expect(authProvider.withToken).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "AuthenticatedBaseQuery retry predicate failed:",
      retryPredicateError,
    );
  });

  it("performs one unauthenticated request when the provider does not supply a token", async () => {
    withToken.mockImplementation(({ queryFn }) => queryFn());

    const { status, data, error } = await store.dispatch(api.endpoints.gatedQuery.initiate());

    expect(status).toBe("fulfilled");
    expect(data).toEqual({ ok: true });
    expect(error).toBe(undefined);
    expect(endpoints.private).toHaveBeenCalledTimes(1);
    expect(endpoints.private.mock.calls[0][0].request.headers.get("authorization")).toBeNull();
    expect(authProvider.withToken).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it("falls back to an unauthenticated request when authentication fails", async () => {
    const authenticationError = new Error("Authentication failed");
    withToken.mockImplementation(() => Promise.reject(authenticationError));

    const { status, data, error } = await store.dispatch(api.endpoints.gatedQuery.initiate());

    expect(status).toBe("fulfilled");
    expect(data).toEqual({ ok: true });
    expect(error).toBe(undefined);

    expect(endpoints.private).toHaveBeenCalledTimes(1);
    const request = endpoints.private.mock.calls[0][0].request;
    expect(request.headers.get("authorization")).toBeNull();
    expect(authProvider.withToken).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "AuthenticatedBaseQuery failed to authenticate:",
      authenticationError,
    );
  });

  it("falls back to an unauthenticated request when the auth provider is missing", async () => {
    const storeWithoutAuthProvider = configureStore({
      reducer: {
        [api.reducerPath]: api.reducer,
      },
      middleware: getDefaultMiddleware => getDefaultMiddleware().concat(api.middleware),
    });

    const { status, data, error } = await storeWithoutAuthProvider.dispatch(
      api.endpoints.gatedQuery.initiate(),
    );

    expect(status).toBe("fulfilled");
    expect(data).toEqual({ ok: true });
    expect(error).toBe(undefined);
    expect(authProvider.withToken).not.toHaveBeenCalled();
    expect(endpoints.private).toHaveBeenCalledTimes(1);
    const request = endpoints.private.mock.calls[0][0].request;
    expect(request.headers.get("authorization")).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "AuthenticatedBaseQuery failed to authenticate:",
      expect.objectContaining({
        name: "AuthProviderMissingError",
        message: "Authenticated base query requires api.extra.authProvider",
      }),
    );
  });
});

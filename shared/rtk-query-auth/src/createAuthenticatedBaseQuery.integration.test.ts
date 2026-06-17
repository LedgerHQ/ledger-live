import type { BaseQueryApi } from "@reduxjs/toolkit/query";
import { HttpResponse, http } from "msw";
import { setupServer, type SetupServerApi } from "msw/node";
import { createAuthenticatedBaseQuery } from "./createAuthenticatedBaseQuery";
import { AuthenticatedBaseQueryMissingAuthSDKError } from "./errors";
import type { AuthSDK, KeycloakToken } from "./types";

const API_BASE_URL = "https://api.ledger.test";
const AUTHENTICATED_ENDPOINT = "authenticatedEndpoint";
const PUBLIC_ENDPOINT = "publicEndpoint";

type ObservedRequest = {
  url: string;
  authorization: string | null;
  customHeader: string | null;
  requestHeader: string | null;
};

describe("createAuthenticatedBaseQuery (integration, MSW)", () => {
  let server: SetupServerApi;

  beforeAll(() => {
    server = setupServer();
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
  });

  afterAll(() => {
    server.close();
  });

  it("does not authenticate endpoints that explicitly opt out", async () => {
    const observedRequests: ObservedRequest[] = [];
    server.use(createHandler("/public", [200], observedRequests));
    const authSDK = createAuthSDK();
    const baseQuery = createAuthenticatedBaseQuery({
      baseUrl: API_BASE_URL,
    });

    await baseQuery("/public", createBaseQueryApi({ authSDK }, PUBLIC_ENDPOINT), {
      authenticated: false,
    });

    expect(observedRequests).toEqual([
      {
        url: `${API_BASE_URL}/public`,
        authorization: null,
        customHeader: null,
        requestHeader: null,
      },
    ]);
    expect(authSDK.authenticate).not.toHaveBeenCalled();
  });

  it("preserves base query headers and appends the authorization header by default", async () => {
    const observedRequests: ObservedRequest[] = [];
    server.use(createHandler("/resource", [200], observedRequests));
    const authSDK = createAuthSDK();
    const baseQuery = createAuthenticatedBaseQuery({
      baseUrl: API_BASE_URL,
      prepareHeaders: headers => {
        headers.set("x-custom-header", "custom-value");
      },
    });

    await baseQuery(
      {
        url: "/resource",
        headers: {
          "x-request-header": "request-value",
        },
      },
      createBaseQueryApi({ authSDK }, AUTHENTICATED_ENDPOINT),
      {},
    );

    expect(observedRequests).toEqual([
      {
        url: `${API_BASE_URL}/resource`,
        authorization: "Bearer access-token",
        customHeader: "custom-value",
        requestHeader: "request-value",
      },
    ]);
    expect(authSDK.authenticate).toHaveBeenCalledTimes(1);
    expect(authSDK.authenticate).toHaveBeenCalledWith();
  });

  it("uses headers returned by the original prepareHeaders callback", async () => {
    const observedRequests: ObservedRequest[] = [];
    server.use(createHandler("/resource", [200], observedRequests));
    const authSDK = createAuthSDK();
    const baseQuery = createAuthenticatedBaseQuery({
      baseUrl: API_BASE_URL,
      prepareHeaders: headers => {
        const nextHeaders = new Headers(headers);
        nextHeaders.set("x-custom-header", "returned-value");
        return nextHeaders;
      },
    });

    await baseQuery("/resource", createBaseQueryApi({ authSDK }, AUTHENTICATED_ENDPOINT), {});

    expect(observedRequests).toEqual([
      {
        url: `${API_BASE_URL}/resource`,
        authorization: "Bearer access-token",
        customHeader: "returned-value",
        requestHeader: null,
      },
    ]);
  });

  it.each([undefined, {}, { authSDK: { authenticate: "not-a-function" } }])(
    "fails before the request when extra is %p by default",
    async extra => {
      const baseQuery = createAuthenticatedBaseQuery({
        baseUrl: API_BASE_URL,
      });

      await expect(
        baseQuery("/resource", createBaseQueryApi(extra, AUTHENTICATED_ENDPOINT), {}),
      ).rejects.toBeInstanceOf(AuthenticatedBaseQueryMissingAuthSDKError);
    },
  );

  it("refreshes the token and retries once on 401", async () => {
    const observedRequests: ObservedRequest[] = [];
    server.use(createHandler("/resource", [401, 200], observedRequests));
    const authSDK = createAuthSDK([createToken("stale-token"), createToken("fresh-token")]);
    const baseQuery = createAuthenticatedBaseQuery({
      baseUrl: API_BASE_URL,
    });

    const result = await baseQuery(
      "/resource",
      createBaseQueryApi({ authSDK }, AUTHENTICATED_ENDPOINT),
      {},
    );

    expect(result.error).toBeUndefined();
    expect(observedRequests.map(request => request.authorization)).toEqual([
      "Bearer stale-token",
      "Bearer fresh-token",
    ]);
    expect(authSDK.authenticate).toHaveBeenNthCalledWith(1);
    expect(authSDK.authenticate).toHaveBeenNthCalledWith(2, true);
  });

  it("does not refresh or retry non-401 failures", async () => {
    const observedRequests: ObservedRequest[] = [];
    server.use(createHandler("/resource", [500], observedRequests));
    const authSDK = createAuthSDK();
    const baseQuery = createAuthenticatedBaseQuery({
      baseUrl: API_BASE_URL,
    });

    const result = await baseQuery(
      "/resource",
      createBaseQueryApi({ authSDK }, AUTHENTICATED_ENDPOINT),
      {},
    );

    expect(result.error?.status).toBe(500);
    expect(observedRequests).toHaveLength(1);
    expect(authSDK.authenticate).toHaveBeenCalledTimes(1);
    expect(authSDK.authenticate).toHaveBeenCalledWith();
  });
});

function createHandler(path: string, statuses: number[], observedRequests: ObservedRequest[]) {
  const remainingStatuses = [...statuses];

  return http.all(`${API_BASE_URL}${path}`, ({ request }) => {
    observedRequests.push({
      url: request.url,
      authorization: request.headers.get("authorization"),
      customHeader: request.headers.get("x-custom-header"),
      requestHeader: request.headers.get("x-request-header"),
    });

    return HttpResponse.json(
      { ok: true },
      {
        status: remainingStatuses.shift() ?? 200,
      },
    );
  });
}

function createAuthSDK(tokens = [createToken("access-token")]): jest.Mocked<AuthSDK> {
  const remainingTokens = [...tokens];

  return {
    authenticate: jest.fn(async () => remainingTokens.shift() ?? tokens[tokens.length - 1]),
  };
}

function createToken(accessToken: string): KeycloakToken {
  return {
    tokenType: "Bearer",
    accessToken,
  };
}

function createBaseQueryApi(extra: unknown, endpoint: string): BaseQueryApi {
  return {
    signal: new AbortController().signal,
    abort: jest.fn(),
    dispatch: jest.fn(),
    getState: jest.fn(),
    extra,
    endpoint,
    type: "query",
    forced: false,
  } as unknown as BaseQueryApi;
}

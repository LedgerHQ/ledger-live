import { configureStore, type Middleware } from "@reduxjs/toolkit";
import { createAuthMiddleware, type AuthProvider } from "@shared/auth";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { AGENT_INTENT_AUTH_PROVIDER_KEY, agentIntentApi, agentIntentApiExtra } from "./api";

const BFF_URL = "https://bff.agent-intent.test";
const PROBE_URL = `${BFF_URL}/v1/probe`;
const valid = { getAgentIntentBffUrl: () => BFF_URL };

const OWN_ENDPOINT_NAMES = Object.keys(agentIntentApi.endpoints);

const probeApi = agentIntentApi.injectEndpoints({
  endpoints: build => ({ probe: build.query<unknown, void>({ query: () => "v1/probe" }) }),
  overrideExisting: true,
});

function tokenProvider(accessToken: string): AuthProvider {
  return {
    withToken: options => options.queryFn({ accessToken, tokenType: "Bearer" }),
  };
}

function authMiddleware(key: string | undefined, accessToken: string): Middleware {
  return createAuthMiddleware({
    key,
    createAuthProvider: () => tokenProvider(accessToken),
    isFeatureEnabled: () => true,
  });
}

function makeStore(extra: unknown, middlewares: Middleware[] = []) {
  return configureStore({
    reducer: { [agentIntentApi.reducerPath]: agentIntentApi.reducer },
    middleware: gdm =>
      gdm({ thunk: { extraArgument: extra } })
        .concat(...middlewares)
        .concat(agentIntentApi.middleware),
  });
}

describe("agentIntentApi", () => {
  it("should have the agentIntentApi reducer path", () => {
    expect(agentIntentApi.reducerPath).toBe("agentIntentApi");
  });

  it("should declare no endpoints of its own", () => {
    expect(OWN_ENDPOINT_NAMES).toHaveLength(0);
  });
});

describe("agentIntentApiExtra", () => {
  it("should return the validated config", () => {
    expect(agentIntentApiExtra(valid)).toEqual(valid);
  });

  it("should throw when the url getter is not a function", () => {
    // @ts-expect-error the url must be a getter
    expect(() => agentIntentApiExtra({ getAgentIntentBffUrl: BFF_URL })).toThrow(
      "getAgentIntentBffUrl must be a function",
    );
  });
});

describe("agentIntentBaseQuery", () => {
  const server = setupServer();
  const probe = jest.fn<Response, [{ request: Request }]>();
  let warnSpy: jest.SpyInstance;

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  beforeEach(() => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    probe.mockReset().mockImplementation(() => HttpResponse.json({ ok: true }));
    server.use(http.get(PROBE_URL, probe));
  });
  afterEach(() => {
    server.resetHandlers();
    warnSpy.mockRestore();
  });
  afterAll(() => server.close());

  function sentAuthorization(): string | null {
    return probe.mock.calls[0][0].request.headers.get("authorization");
  }

  it("should send the request to the BFF url", async () => {
    const store = makeStore(agentIntentApiExtra(valid));

    const result = await store.dispatch(probeApi.endpoints.probe.initiate());

    expect(result.data).toEqual({ ok: true });
    expect(probe).toHaveBeenCalledTimes(1);
  });

  it("should authenticate with the agent-intent provider, not the default one", async () => {
    const store = makeStore(agentIntentApiExtra(valid), [
      authMiddleware(undefined, "wallet-token"),
      authMiddleware(AGENT_INTENT_AUTH_PROVIDER_KEY, "agent-intent-token"),
    ]);

    await store.dispatch(probeApi.endpoints.probe.initiate());

    expect(sentAuthorization()).toBe("Bearer agent-intent-token");
  });

  it("should send no token when the store has only the default provider", async () => {
    const store = makeStore(agentIntentApiExtra(valid), [
      authMiddleware(undefined, "wallet-token"),
    ]);

    await store.dispatch(probeApi.endpoints.probe.initiate());

    expect(sentAuthorization()).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      "AuthenticatedBaseQuery failed to authenticate:",
      expect.objectContaining({ name: "AuthProviderMissingError" }),
    );
  });

  it("should fail without a request when the extraArgument is not configured", async () => {
    const store = makeStore(undefined);

    const result = await store.dispatch(probeApi.endpoints.probe.initiate());

    expect(result.error).toEqual({
      status: "CUSTOM_ERROR",
      error: "agentIntentApiExtra not configured in store extraArgument",
    });
    expect(probe).not.toHaveBeenCalled();
  });

  it("should fail without a request when the BFF url is empty", async () => {
    const store = makeStore(agentIntentApiExtra({ getAgentIntentBffUrl: () => "" }));

    const result = await store.dispatch(probeApi.endpoints.probe.initiate());

    expect(result.error).toEqual({
      status: "CUSTOM_ERROR",
      error: "getAgentIntentBffUrl() resolved to an empty value",
    });
    expect(probe).not.toHaveBeenCalled();
  });
});

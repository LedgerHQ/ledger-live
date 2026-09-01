import { configureStore, type Middleware, type UnknownAction } from "@reduxjs/toolkit";
import { cardApi, cardApiExtra } from "@shared/api-services";
import { exchangeAuthorizationCode, refreshSession } from "./grants";

const sessionResponse = {
  access_token: "at_token",
  expires_in: 21600,
  refresh_token: "rt_token",
};

const session = {
  accessToken: "at_token",
  expiresIn: 21600,
  refreshToken: "rt_token",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** A store wired the way the apps wire one, recording every action a logger would see. */
function makeStore() {
  const actions: UnknownAction[] = [];
  const record: Middleware = () => next => action => {
    actions.push(action as UnknownAction);
    return next(action);
  };
  const store = configureStore({
    reducer: { [cardApi.reducerPath]: cardApi.reducer },
    middleware: gdm =>
      gdm({
        thunk: {
          extraArgument: cardApiExtra({
            getCardApiBaseUrl: () => "https://card.test",
            getCardBaanxClientKey: () => "client-key",
            readCardSession: async () => ({
              token: "session-token",
              sessionId: 1,
            }),
            isCardSessionCurrent: () => true,
            refreshCardSession: async () => ({ kind: "session-replaced" }),
          }),
        },
      })
        .concat(cardApi.middleware)
        .concat(record),
  });
  return { store, actions };
}

function sentRequest(spy: jest.SpyInstance): {
  url: string;
  init: RequestInit;
} {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const [url, init] = spy.mock.calls[0] as [string, RequestInit];
  return { url, init };
}

let fetchSpy: jest.SpyInstance | undefined;

afterEach(() => {
  fetchSpy?.mockRestore();
  fetchSpy = undefined;
});

describe("exchangeAuthorizationCode", () => {
  it("posts the code and the verifier, and answers with the session", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(sessionResponse));
    const { store } = makeStore();

    await expect(
      store.dispatch(
        exchangeAuthorizationCode({
          code: "auth-code",
          codeVerifier: "verifier",
        }),
      ),
    ).resolves.toEqual(session);

    const { url, init } = sentRequest(fetchSpy);
    expect(url).toBe("https://card.test/v1/auth/oauth2/token");
    expect(JSON.parse(String(init.body))).toEqual({
      grant_type: "authorization_code",
      code: "auth-code",
      code_verifier: "verifier",
    });
  });
});

describe("refreshSession", () => {
  it("posts the refresh token to the same endpoint, and answers with the session", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(sessionResponse));
    const { store } = makeStore();

    await expect(store.dispatch(refreshSession("rt_stored"))).resolves.toEqual(session);

    const { url, init } = sentRequest(fetchSpy);
    expect(url).toBe("https://card.test/v1/auth/oauth2/token");
    expect(JSON.parse(String(init.body))).toEqual({
      grant_type: "refresh_token",
      refresh_token: "rt_stored",
    });
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const headers = init.headers as Headers;
    // A grant carries its own proof, and a renewal that renewed would loop on its own 401.
    expect(headers.get("authorization")).toBeNull();
    expect(headers.get("x-client-key")).toBe("client-key");
  });

  it("rejects, and quotes no token, when the answer is not a session", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        access_token: "sensitive-access-token",
        refresh_token: "sensitive-refresh-token",
        // `expires_in` is missing, so the wire schema rejects the body.
      }),
    );
    const { store } = makeStore();

    const failure = await store
      .dispatch(refreshSession("rt_stored"))
      .catch((error: Error) => error);

    expect(failure).toMatchObject({ name: "CardRequestError" });
    expect(String(failure)).not.toContain("sensitive-access-token");
    expect(String(failure)).not.toContain("sensitive-refresh-token");
  });

  it("rejects with the status when the provider refuses the grant", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ error: "invalid_grant" }, 400));
    const { store } = makeStore();

    const failure = await store
      .dispatch(refreshSession("rt_stored"))
      .catch((error: Error) => error);

    expect(failure).toMatchObject({ name: "CardRequestError" });
    expect(String(failure)).toContain("400");
  });
});

describe("both grants", () => {
  it("dispatch no action, so no credential can reach a log or the DevTools relay", async () => {
    // A fresh Response per call: a body can only be read once.
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => jsonResponse(sessionResponse));
    const { store, actions } = makeStore();

    await store.dispatch(
      exchangeAuthorizationCode({
        code: "auth-code",
        codeVerifier: "sensitive-verifier",
      }),
    );
    await store.dispatch(refreshSession("sensitive-refresh-token"));

    // A plain thunk is not an action. An endpoint or a `createAsyncThunk` would have dispatched a
    // pending action carrying the argument and a fulfilled one carrying the session.
    expect(actions).toEqual([]);
  });
});

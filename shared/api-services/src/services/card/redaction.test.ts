import { CARD_REDUCER_PATH, REDACTED } from "./constants";
import { isCardApiAction, redactCardApiAction, redactCardApiState } from "./redaction";

const ACCESS_TOKEN = "sentinel-access-token";
const REFRESH_TOKEN = "sentinel-refresh-token";
const CODE_VERIFIER = "sentinel-code-verifier";

function fulfilledSessionAction() {
  return {
    type: `${CARD_REDUCER_PATH}/executeMutation/fulfilled`,
    payload: { accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN, expiresIn: 3600 },
    meta: {
      arg: {
        type: "mutation",
        endpointName: "exchangeAuthorizationCode",
        originalArgs: { code: "a-code", codeVerifier: CODE_VERIFIER },
        track: false,
      },
      requestId: "request-1",
      baseQueryMeta: {
        request: { headers: { authorization: `Bearer ${ACCESS_TOKEN}` } },
        requestUrl: "https://card.test/v1/auth/oauth2/token",
        responseStatus: 200,
      },
    },
  };
}

/** A store state that holds a tracked grant, which is what the sanitizer exists to catch. */
function stateWithGrant() {
  return {
    settings: { theme: "dark" },
    [CARD_REDUCER_PATH]: {
      queries: {
        "getUser(undefined)": {
          endpointName: "getUser",
          status: "fulfilled",
          data: { id: "an-id", verificationState: "VERIFIED" },
        },
      },
      mutations: {
        "request-1": {
          endpointName: "refreshSession",
          status: "fulfilled",
          originalArgs: { refreshToken: REFRESH_TOKEN },
          data: { accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN, expiresIn: 3600 },
        },
      },
    },
  };
}

describe("isCardApiAction", () => {
  it("recognises a Card api action", () => {
    expect(isCardApiAction({ type: `${CARD_REDUCER_PATH}/executeQuery/pending` })).toBe(true);
  });

  it("rejects every other action", () => {
    expect(isCardApiAction({ type: "swapApi/executeQuery/pending" })).toBe(false);
    expect(isCardApiAction({ type: "settings/setTheme" })).toBe(false);
    // A prefix without the separator is a different api.
    expect(isCardApiAction({ type: "cardApiOther/executeQuery/pending" })).toBe(false);
  });
});

describe("redactCardApiAction", () => {
  it("returns a non-Card action by reference", () => {
    const action = { type: "settings/setTheme", payload: "dark" };
    expect(redactCardApiAction(action)).toBe(action);
  });

  it("drops every credential and keeps the diagnostics", () => {
    const redacted = redactCardApiAction(fulfilledSessionAction());
    const serialized = JSON.stringify(redacted);

    expect(serialized).not.toContain(ACCESS_TOKEN);
    expect(serialized).not.toContain(REFRESH_TOKEN);
    expect(serialized).not.toContain(CODE_VERIFIER);

    expect(redacted.type).toBe(`${CARD_REDUCER_PATH}/executeMutation/fulfilled`);
    expect(redacted.meta.arg.endpointName).toBe("exchangeAuthorizationCode");
    expect(redacted.meta.requestId).toBe("request-1");
    expect(redacted.meta.arg.originalArgs).toBe(REDACTED);
    expect(redacted.meta.baseQueryMeta).toEqual({
      request: REDACTED,
      requestUrl: "https://card.test/v1/auth/oauth2/token",
      responseStatus: 200,
    });
    expect(redacted.payload).toBe(REDACTED);
  });

  it("keeps an error status so a 401 stays readable", () => {
    const redacted = redactCardApiAction({
      type: `${CARD_REDUCER_PATH}/executeQuery/rejected`,
      payload: { status: 401, data: { token: ACCESS_TOKEN } },
      error: { message: `failed with ${ACCESS_TOKEN}` },
      meta: { arg: { endpointName: "getUser", originalArgs: undefined } },
    });

    expect(redacted.payload).toEqual({ status: 401, data: REDACTED });
    expect(redacted.error).toBe(REDACTED);
    expect(JSON.stringify(redacted)).not.toContain(ACCESS_TOKEN);
  });

  it("does not add fields that the action did not carry", () => {
    const redacted = redactCardApiAction({
      type: `${CARD_REDUCER_PATH}/config/middlewareRegistered`,
    });

    expect(redacted).toEqual({ type: `${CARD_REDUCER_PATH}/config/middlewareRegistered` });
  });

  it("leaves the original action untouched", () => {
    const action = fulfilledSessionAction();
    redactCardApiAction(action);

    expect(action.meta.arg.originalArgs).toEqual({ code: "a-code", codeVerifier: CODE_VERIFIER });
  });
});

describe("redactCardApiState", () => {
  it("drops the argument and the answer of a grant that was tracked", () => {
    const state = stateWithGrant();
    const redacted = redactCardApiState(state);
    const grant = redacted[CARD_REDUCER_PATH].mutations["request-1"];

    expect(JSON.stringify(redacted)).not.toContain(ACCESS_TOKEN);
    expect(JSON.stringify(redacted)).not.toContain(REFRESH_TOKEN);
    expect(grant.data).toBe(REDACTED);
    expect(grant.originalArgs).toBe(REDACTED);
    // The entry stays readable: a developer still sees which grant ran, and how it ended.
    expect(grant.endpointName).toBe("refreshSession");
    expect(grant.status).toBe("fulfilled");
  });

  it("keeps every other Card entry, because only a grant carries a credential", () => {
    const redacted = redactCardApiState(stateWithGrant());

    expect(redacted[CARD_REDUCER_PATH].queries["getUser(undefined)"].data).toEqual({
      id: "an-id",
      verificationState: "VERIFIED",
    });
  });

  it("leaves the original state untouched", () => {
    const state = stateWithGrant();
    redactCardApiState(state);

    expect(state[CARD_REDUCER_PATH].mutations["request-1"].data).toEqual({
      accessToken: ACCESS_TOKEN,
      refreshToken: REFRESH_TOKEN,
      expiresIn: 3600,
    });
  });

  it("returns the state by reference when no grant was tracked", () => {
    // Both grants run with `track: false`, so this is the normal case.
    const state = {
      settings: { theme: "dark" },
      [CARD_REDUCER_PATH]: { queries: {}, mutations: {} },
    };

    expect(redactCardApiState(state)).toBe(state);
  });

  it("returns a state without the Card api by reference", () => {
    const state = { settings: { theme: "dark" } };

    expect(redactCardApiState(state)).toBe(state);
  });
});

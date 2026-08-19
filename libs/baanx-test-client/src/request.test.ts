import { createFetchMock, RFC6238_SECRET } from "./__mocks__/fetchMock";
import { ENV_VARS } from "./config";
import type { EnvSource } from "./config";
import {
  BaanxHttpError,
  BaanxInvalidClientKeyError,
  BaanxInvalidCredentialsError,
  BaanxRateLimitError,
} from "./errors";
import { baanxRequest } from "./request";
import { clearBaanxAuthCache } from "./auth/session";

/**
 * `baanxRequest` is the seam data-setup and data-validation calls go through,
 * so these tests pin the headers it sends and the errors it raises.
 */

const ENV: EnvSource = {
  [ENV_VARS.clientKey]: "env-client-key",
  [ENV_VARS.email]: "tester@ledger.test",
  [ENV_VARS.password]: "env-password",
  [ENV_VARS.totpSecret]: RFC6238_SECRET,
};

/** First response logs us in; the rest answer the request under test. */
const LOGIN_OK = { body: { accessToken: "token-1", userId: "user-1" } };

function callWith(specs: Parameters<typeof createFetchMock>[0]) {
  const mock = createFetchMock(specs);
  return { mock, auth: { env: ENV, deps: { fetchImpl: mock.fetchImpl } } };
}

beforeEach(() => {
  clearBaanxAuthCache();
});

describe("baanxRequest", () => {
  it("GETs with the bearer token and client key", async () => {
    const { mock, auth } = callWith([LOGIN_OK, { body: { id: "user-1" } }]);

    const result = await baanxRequest({ path: "/v1/user", auth, fetchImpl: mock.fetchImpl });

    expect(result).toEqual({ status: 200, data: { id: "user-1" } });

    const request = mock.requests[1];
    expect(request.path).toBe("/v1/user");
    expect(request.headers.authorization).toBe("Bearer token-1");
    expect(request.headers["x-client-key"]).toBe("env-client-key");
    // No payload, so no Content-Type.
    expect(request.headers["Content-Type"]).toBeUndefined();
  });

  it("sends a JSON body and Content-Type when given one", async () => {
    const { mock, auth } = callWith([LOGIN_OK, { status: 201, body: { created: true } }]);

    const result = await baanxRequest({
      path: "/v1/thing",
      method: "POST",
      body: { name: "fixture" },
      auth,
      fetchImpl: mock.fetchImpl,
    });

    expect(result.status).toBe(201);
    expect(mock.requests[1].body).toEqual({ name: "fixture" });
    expect(mock.requests[1].headers["Content-Type"]).toBe("application/json");
  });

  it("adds x-us-env for US-region users", async () => {
    const { mock, auth } = callWith([LOGIN_OK, { body: {} }]);

    await baanxRequest({
      path: "/v1/user",
      auth: { ...auth, region: "us" },
      fetchImpl: mock.fetchImpl,
    });

    expect(mock.requests[1].headers["x-us-env"]).toBe("true");
  });

  it("lets explicit headers override the defaults", async () => {
    const { mock, auth } = callWith([LOGIN_OK, { body: {} }]);

    await baanxRequest({
      path: "/v1/user",
      headers: { "x-trace-id": "abc" },
      auth,
      fetchImpl: mock.fetchImpl,
    });

    expect(mock.requests[1].headers["x-trace-id"]).toBe("abc");
    expect(mock.requests[1].headers["x-client-key"]).toBe("env-client-key");
  });

  describe("query strings", () => {
    it.each([
      [{ page: 2, active: true }, "/v1/things?page=2&active=true"],
      [{ page: 1, skip: undefined }, "/v1/things?page=1"],
      [{ skip: undefined }, "/v1/things"],
      [undefined, "/v1/things"],
    ])("builds %j", async (query, expected) => {
      const { mock, auth } = callWith([LOGIN_OK, { body: {} }]);

      await baanxRequest({ path: "/v1/things", query, auth, fetchImpl: mock.fetchImpl });

      expect(mock.requests[1].url).toBe(`https://dev.api.baanx.com${expected}`);
    });
  });

  it("reuses one login across many calls", async () => {
    const { mock, auth } = callWith([LOGIN_OK, { body: {} }, { body: {} }, { body: {} }]);

    await baanxRequest({ path: "/v1/a", auth, fetchImpl: mock.fetchImpl });
    await baanxRequest({ path: "/v1/b", auth, fetchImpl: mock.fetchImpl });
    await baanxRequest({ path: "/v1/c", auth, fetchImpl: mock.fetchImpl });

    // 1 login + 3 requests, not 3 logins.
    expect(mock.requests).toHaveLength(4);
    expect(mock.requests.filter(r => r.path === "/v1/auth/login")).toHaveLength(1);
  });

  describe("errors", () => {
    it.each([
      [429, BaanxRateLimitError],
      [498, BaanxInvalidClientKeyError],
      [404, BaanxHttpError],
      [500, BaanxHttpError],
    ] as const)("maps %i the same way the login flow does", async (status, expected) => {
      const { mock, auth } = callWith([LOGIN_OK, { status, body: { message: "nope" } }]);

      await expect(
        baanxRequest({ path: "/v1/user", auth, fetchImpl: mock.fetchImpl }),
      ).rejects.toBeInstanceOf(expected);
    });

    it("keeps the status on a generic HTTP error", async () => {
      const { mock, auth } = callWith([LOGIN_OK, { status: 404, body: { message: "not found" } }]);

      const error = await baanxRequest({
        path: "/v1/nope",
        auth,
        fetchImpl: mock.fetchImpl,
      }).catch((e: unknown) => e as BaanxHttpError);

      expect(error).toBeInstanceOf(BaanxHttpError);
      expect((error as BaanxHttpError).status).toBe(404);
      expect((error as BaanxHttpError).message).toBe("not found");
    });
  });

  describe("401 handling", () => {
    it("retries once with a fresh token", async () => {
      const { mock, auth } = callWith([
        LOGIN_OK,
        { status: 401, body: { message: "expired" } },
        // The forced re-login.
        { body: { accessToken: "token-2", userId: "user-1" } },
        { body: { ok: true } },
      ]);

      const result = await baanxRequest({ path: "/v1/user", auth, fetchImpl: mock.fetchImpl });

      expect(result.data).toEqual({ ok: true });
      // The retry used the new token, not the stale one.
      expect(mock.requests[1].headers.authorization).toBe("Bearer token-1");
      expect(mock.requests[3].headers.authorization).toBe("Bearer token-2");
    });

    it("gives up after one retry rather than looping", async () => {
      const { mock, auth } = callWith([
        LOGIN_OK,
        { status: 401, body: { message: "expired" } },
        { body: { accessToken: "token-2" } },
        { status: 401, body: { message: "Invalid credentials" } },
      ]);

      await expect(
        baanxRequest({ path: "/v1/user", auth, fetchImpl: mock.fetchImpl }),
      ).rejects.toBeInstanceOf(BaanxInvalidCredentialsError);

      expect(mock.requests).toHaveLength(4);
    });
  });
});

import { createFetchMock, RFC6238_SECRET } from "../__mocks__/fetchMock";
import { ENV_VARS } from "../config";
import type { EnvSource } from "../config";
import { BaanxConfigError } from "../errors";
import { clearBaanxAuthCache, getBaanxAuthToken } from "./session";
import { ASSUMED_TOKEN_LIFETIME_MS, TOKEN_REFRESH_MARGIN_MS } from "../types";

/**
 * The cache is what keeps a parallel suite from logging in per worker and
 * earning a 429, so these tests assert call *counts* as much as return values.
 */

const ENV: EnvSource = {
  [ENV_VARS.clientKey]: "env-client-key",
  [ENV_VARS.email]: "tester@ledger.test",
  [ENV_VARS.password]: "env-password",
  [ENV_VARS.totpSecret]: RFC6238_SECRET,
};

beforeEach(() => {
  clearBaanxAuthCache();
});

describe("getBaanxAuthToken", () => {
  it("logs in and returns the session", async () => {
    const { fetchImpl, requests } = createFetchMock([
      { body: { accessToken: "token-1", userId: "user-1" } },
    ]);

    const session = await getBaanxAuthToken({ env: ENV, deps: { fetchImpl } });

    expect(session.accessToken).toBe("token-1");
    expect(requests).toHaveLength(1);
  });

  it("reuses the cached token instead of logging in again", async () => {
    const { fetchImpl, requests } = createFetchMock([{ body: { accessToken: "token-1" } }]);

    const first = await getBaanxAuthToken({ env: ENV, deps: { fetchImpl } });
    const second = await getBaanxAuthToken({ env: ENV, deps: { fetchImpl } });

    expect(second).toBe(first);
    expect(requests).toHaveLength(1);
  });

  it("shares one login between concurrent callers", async () => {
    // A single response: a second login attempt would make the mock throw.
    const { fetchImpl, requests } = createFetchMock([{ body: { accessToken: "token-1" } }]);

    const [a, b, c] = await Promise.all([
      getBaanxAuthToken({ env: ENV, deps: { fetchImpl } }),
      getBaanxAuthToken({ env: ENV, deps: { fetchImpl } }),
      getBaanxAuthToken({ env: ENV, deps: { fetchImpl } }),
    ]);

    expect(requests).toHaveLength(1);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it("re-authenticates once the token is near expiry", async () => {
    const { fetchImpl, requests } = createFetchMock([
      { body: { accessToken: "token-1" } },
      { body: { accessToken: "token-2" } },
    ]);
    const issuedAt = 1_000_000_000_000;

    const first = await getBaanxAuthToken({
      env: ENV,
      deps: { fetchImpl },
      now: () => issuedAt,
    });

    // Inside the refresh margin: the token is still valid but not for long.
    const nearExpiry = Date.parse(first.expiresAt) - TOKEN_REFRESH_MARGIN_MS + 1;
    const second = await getBaanxAuthToken({
      env: ENV,
      deps: { fetchImpl },
      now: () => nearExpiry,
    });

    expect(second.accessToken).toBe("token-2");
    expect(requests).toHaveLength(2);
  });

  it("keeps the token while it is comfortably fresh", async () => {
    const { fetchImpl, requests } = createFetchMock([{ body: { accessToken: "token-1" } }]);
    const issuedAt = 1_000_000_000_000;

    await getBaanxAuthToken({ env: ENV, deps: { fetchImpl }, now: () => issuedAt });
    // Half the 6h lifetime in.
    await getBaanxAuthToken({
      env: ENV,
      deps: { fetchImpl },
      now: () => issuedAt + ASSUMED_TOKEN_LIFETIME_MS / 2,
    });

    expect(requests).toHaveLength(1);
  });

  it("logs in again when forceRefresh is set", async () => {
    const { fetchImpl, requests } = createFetchMock([
      { body: { accessToken: "token-1" } },
      { body: { accessToken: "token-2" } },
    ]);

    await getBaanxAuthToken({ env: ENV, deps: { fetchImpl } });
    const second = await getBaanxAuthToken({ env: ENV, deps: { fetchImpl }, forceRefresh: true });

    expect(second.accessToken).toBe("token-2");
    expect(requests).toHaveLength(2);
  });

  it("joins a running login instead of stampeding when forceRefresh races", async () => {
    // Concurrent 401 handlers all calling forceRefresh must produce ONE login;
    // a second response would mean the mock was called twice.
    const { fetchImpl, requests } = createFetchMock([{ body: { accessToken: "token-1" } }]);

    const results = await Promise.all([
      getBaanxAuthToken({ env: ENV, deps: { fetchImpl }, forceRefresh: true }),
      getBaanxAuthToken({ env: ENV, deps: { fetchImpl }, forceRefresh: true }),
      getBaanxAuthToken({ env: ENV, deps: { fetchImpl }, forceRefresh: true }),
    ]);

    expect(requests).toHaveLength(1);
    expect(new Set(results.map(r => r.accessToken))).toEqual(new Set(["token-1"]));
  });

  it("still bypasses a cached token when forceRefresh is set", async () => {
    const { fetchImpl, requests } = createFetchMock([
      { body: { accessToken: "token-1" } },
      { body: { accessToken: "token-2" } },
    ]);

    await getBaanxAuthToken({ env: ENV, deps: { fetchImpl } });
    const second = await getBaanxAuthToken({ env: ENV, deps: { fetchImpl }, forceRefresh: true });

    expect(second.accessToken).toBe("token-2");
    expect(requests).toHaveLength(2);
  });

  it("does not reuse a token across different client keys", async () => {
    // The client key selects the Baanx tenant, so a token minted under one
    // must never be sent with another.
    const { fetchImpl, requests } = createFetchMock([
      { body: { accessToken: "token-key-a" } },
      { body: { accessToken: "token-key-b" } },
    ]);

    const a = await getBaanxAuthToken({ env: ENV, deps: { fetchImpl }, clientKey: "key-a" });
    const b = await getBaanxAuthToken({ env: ENV, deps: { fetchImpl }, clientKey: "key-b" });

    expect(a.accessToken).not.toBe(b.accessToken);
    expect(requests).toHaveLength(2);
  });

  it("caches per user, host and region", async () => {
    const { fetchImpl, requests } = createFetchMock([
      { body: { accessToken: "token-intl" } },
      { body: { accessToken: "token-us" } },
      { body: { accessToken: "token-other-user" } },
      { body: { accessToken: "token-other-host" } },
    ]);

    await getBaanxAuthToken({ env: ENV, deps: { fetchImpl } });
    await getBaanxAuthToken({ env: ENV, deps: { fetchImpl }, region: "us" });
    await getBaanxAuthToken({ env: ENV, deps: { fetchImpl }, email: "other@ledger.test" });
    await getBaanxAuthToken({ env: ENV, deps: { fetchImpl }, baseUrl: "https://other.test" });

    expect(requests).toHaveLength(4);
  });

  it("does not cache a failure", async () => {
    const { fetchImpl, requests } = createFetchMock([
      { status: 503, body: { message: "upstream unavailable" } },
      { body: { accessToken: "token-1" } },
    ]);

    await expect(getBaanxAuthToken({ env: ENV, deps: { fetchImpl } })).rejects.toThrow(
      "upstream unavailable",
    );
    // The next caller gets a real attempt, not the rejected promise.
    const session = await getBaanxAuthToken({ env: ENV, deps: { fetchImpl } });

    expect(session.accessToken).toBe("token-1");
    expect(requests).toHaveLength(2);
  });

  it("rejects every concurrent caller when the shared login fails", async () => {
    const { fetchImpl } = createFetchMock([{ status: 401, body: { message: "nope" } }]);

    const results = await Promise.allSettled([
      getBaanxAuthToken({ env: ENV, deps: { fetchImpl } }),
      getBaanxAuthToken({ env: ENV, deps: { fetchImpl } }),
    ]);

    expect(results.map(result => result.status)).toEqual(["rejected", "rejected"]);
  });

  it("clearBaanxAuthCache forces the next call to log in", async () => {
    const { fetchImpl, requests } = createFetchMock([
      { body: { accessToken: "token-1" } },
      { body: { accessToken: "token-2" } },
    ]);

    await getBaanxAuthToken({ env: ENV, deps: { fetchImpl } });
    clearBaanxAuthCache();
    await getBaanxAuthToken({ env: ENV, deps: { fetchImpl } });

    expect(requests).toHaveLength(2);
  });

  it("surfaces a configuration error before attempting any request", async () => {
    const { fetchImpl, requests } = createFetchMock([]);

    await expect(getBaanxAuthToken({ env: {}, deps: { fetchImpl } })).rejects.toBeInstanceOf(
      BaanxConfigError,
    );
    expect(requests).toHaveLength(0);
  });
});

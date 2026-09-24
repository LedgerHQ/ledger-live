import { createFetchMock, RFC6238_SECRET } from "./__mocks__/fetchMock";
import { ENV_VARS } from "./config";
import type { EnvSource } from "./config";
import { BaanxConfigError } from "./errors";
import {
  CARD_SESSION_BOOTSTRAP_ENV,
  REFRESH_TOKEN_PLACEHOLDER,
  toPayCardSessionJson,
} from "./payCardSession";
import { resolveCardSessionBootstrap } from "./resolveCardSessionBootstrap";
import { clearBaanxAuthCache } from "./auth/session";

const ENV: EnvSource = {
  [ENV_VARS.clientKey]: "env-client-key",
  [ENV_VARS.email]: "tester@ledger.test",
  [ENV_VARS.password]: "env-password",
  [ENV_VARS.totpSecret]: RFC6238_SECRET,
};

const OVERRIDE_JSON = JSON.stringify({
  accessToken: "exported-token",
  refreshToken: REFRESH_TOKEN_PLACEHOLDER,
  expiresIn: 3600,
});

beforeEach(() => {
  clearBaanxAuthCache();
});

describe("toPayCardSessionJson", () => {
  it("should print a PayCardSession with a placeholder refresh token", () => {
    expect(
      JSON.parse(
        toPayCardSessionJson({
          accessToken: "token-1",
          userId: "user-1",
          issuedAt: "2026-01-01T00:00:00.000Z",
          expiresAt: "2026-01-01T01:00:00.000Z",
          expirySource: "assumed",
          otpUsed: false,
          verificationState: null,
          isLinked: null,
          baseUrl: "https://dev.api.baanx.test",
          region: "international",
          email: "tester@ledger.test",
        }),
      ),
    ).toEqual({
      accessToken: "token-1",
      refreshToken: REFRESH_TOKEN_PLACEHOLDER,
      expiresIn: 3600,
    });
  });
});

describe("resolveCardSessionBootstrap", () => {
  it("should mint a PayCardSession JSON when CARD_SESSION_BOOTSTRAP is unset", async () => {
    const { fetchImpl, requests } = createFetchMock([{ body: { accessToken: "token-1" } }]);

    const json = await resolveCardSessionBootstrap({
      env: ENV,
      deps: { fetchImpl },
    });

    expect(JSON.parse(json)).toMatchObject({
      accessToken: "token-1",
      refreshToken: REFRESH_TOKEN_PLACEHOLDER,
    });
    expect(requests).toHaveLength(1);
  });

  it("should use CARD_SESSION_BOOTSTRAP when it is set, without logging in", async () => {
    const { fetchImpl, requests } = createFetchMock([{ body: { accessToken: "minted-token" } }]);

    const json = await resolveCardSessionBootstrap({
      env: { ...ENV, [CARD_SESSION_BOOTSTRAP_ENV]: OVERRIDE_JSON },
      deps: { fetchImpl },
    });

    expect(json).toBe(OVERRIDE_JSON);
    expect(requests).toHaveLength(0);
  });

  it("should reuse one login for overlapping callers", async () => {
    const { fetchImpl, requests } = createFetchMock([{ body: { accessToken: "token-1" } }]);

    const [first, second] = await Promise.all([
      resolveCardSessionBootstrap({ env: ENV, deps: { fetchImpl } }),
      resolveCardSessionBootstrap({ env: ENV, deps: { fetchImpl } }),
    ]);

    expect(first).toBe(second);
    expect(requests).toHaveLength(1);
  });

  it("should throw BaanxConfigError when neither CARD_SESSION_BOOTSTRAP nor creds are set", async () => {
    await expect(resolveCardSessionBootstrap({ env: {} })).rejects.toBeInstanceOf(BaanxConfigError);
  });
});

import { WalletAuthInvalidChallengeError, WalletAuthInvalidTokenError } from "../errors";
import { AuthSDK } from "../authSDK";
import type { AuthConfig, IdentityProvider, KeycloakService } from "../types";

function makeJwt(payload: Record<string, unknown>): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.signature`;
}

describe("AuthSDK", () => {
  const config: AuthConfig = {
    clientId: "ledger-keycloak",
    keycloakBaseUrl: "https://keycloak.test",
    keycloakRealm: "ledger-bc-customers",
  };

  const keycloakService: jest.Mocked<KeycloakService> = {
    baseUrl: config.keycloakBaseUrl,
    realmBaseUrl: `${config.keycloakBaseUrl}/realms/${config.keycloakRealm}`,
    getChallenge: jest.fn(),
  };

  const identityProvider: jest.Mocked<IdentityProvider> = {
    brokerId: "lkrp",
    authenticate: jest.fn(),
  };

  const queryFn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    queryFn.mockReset();
    queryFn.mockReturnValue(Promise.resolve());

    keycloakService.getChallenge.mockResolvedValue("challenge");
    identityProvider.authenticate.mockResolvedValue({
      tokenType: "Bearer",
      accessToken: "keycloak-jwt",
    });
  });

  it("retrieves a Keycloak JWT with PKCE by default", async () => {
    await new AuthSDK(config, {
      provider: identityProvider,
      keycloakService,
    }).withToken({ queryFn });

    expect(queryFn).toHaveBeenCalledWith({
      accessToken: "keycloak-jwt",
      tokenType: "Bearer",
    });

    expect(keycloakService.getChallenge).toHaveBeenLastCalledWith({
      responseType: "code",
      clientId: "ledger-keycloak",
      scope: "openid",
      redirectUri: "https://keycloak.test/realms/ledger-bc-customers/broker/lkrp/endpoint",
      codeChallenge: expect.stringMatching(/^[A-Za-z0-9_-]+$/),
      codeChallengeMethod: "S256",
    });

    expect(identityProvider.authenticate).toHaveBeenCalledWith({
      challenge: "challenge",
      clientId: "ledger-keycloak",
      redirectUri: "https://keycloak.test/realms/ledger-bc-customers/broker/lkrp/endpoint",
      codeVerifier: expect.stringMatching(/^[A-Za-z0-9_-]+$/),
    });
  });

  it("should use the injected PKCE pair factory", async () => {
    const pkcePair = {
      codeVerifier: "injected-code-verifier",
      codeChallenge: "injected-code-challenge",
      codeChallengeMethod: "S256" as const,
    };
    const createPkcePair = jest.fn(() => pkcePair);

    await new AuthSDK(config, {
      provider: identityProvider,
      createPkcePair,
      keycloakService,
    }).withToken({ queryFn });

    expect(createPkcePair).toHaveBeenCalledTimes(1);
    expect(keycloakService.getChallenge).toHaveBeenLastCalledWith({
      responseType: "code",
      clientId: "ledger-keycloak",
      scope: "openid",
      redirectUri: "https://keycloak.test/realms/ledger-bc-customers/broker/lkrp/endpoint",
      codeChallenge: pkcePair.codeChallenge,
      codeChallengeMethod: pkcePair.codeChallengeMethod,
    });
    expect(identityProvider.authenticate).toHaveBeenCalledWith({
      challenge: "challenge",
      clientId: "ledger-keycloak",
      redirectUri: "https://keycloak.test/realms/ledger-bc-customers/broker/lkrp/endpoint",
      codeVerifier: pkcePair.codeVerifier,
    });
  });

  it("disable PKCE values when configured", async () => {
    await new AuthSDK(
      { ...config, disablePkce: true },
      { provider: identityProvider, keycloakService },
    ).withToken({ queryFn });

    expect(keycloakService.getChallenge).toHaveBeenLastCalledWith(
      expect.objectContaining({
        codeChallenge: undefined,
        codeChallengeMethod: undefined,
      }),
    );

    expect(identityProvider.authenticate).toHaveBeenCalledWith(
      expect.objectContaining({
        codeVerifier: undefined,
      }),
    );
  });

  it("returns the cached token on subsequent calls without re-authenticating", async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const token = {
      accessToken: makeJwt({ exp: futureExp }),
      tokenType: "Bearer",
    };
    identityProvider.authenticate.mockResolvedValue(token);

    const sdk = new AuthSDK(config, {
      provider: identityProvider,
      keycloakService,
    });

    await sdk.withToken({ queryFn });
    await sdk.withToken({ queryFn });

    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(queryFn).toHaveBeenNthCalledWith(1, token);
    expect(queryFn).toHaveBeenNthCalledWith(2, token);
    expect(keycloakService.getChallenge).toHaveBeenCalledTimes(1);
    expect(identityProvider.authenticate).toHaveBeenCalledTimes(1);
  });

  it("shares the in-flight token request across concurrent calls", async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const token = {
      accessToken: makeJwt({ exp: futureExp }),
      tokenType: "Bearer" as const,
    };
    const deferredToken = createDeferred<typeof token>();
    identityProvider.authenticate.mockReturnValue(deferredToken.promise);

    const sdk = new AuthSDK(config, {
      provider: identityProvider,
      keycloakService,
    });

    const first = sdk.withToken({ queryFn });
    const second = sdk.withToken({ queryFn });

    await waitForMicrotasks();
    expect(keycloakService.getChallenge).toHaveBeenCalledTimes(1);
    expect(identityProvider.authenticate).toHaveBeenCalledTimes(1);

    deferredToken.resolve(token);
    await Promise.all([first, second]);

    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(queryFn).toHaveBeenNthCalledWith(1, token);
    expect(queryFn).toHaveBeenNthCalledWith(2, token);
  });

  it("should retry with a fresh token when queryFn returns a retryable result", async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const firstToken = {
      accessToken: makeJwt({ exp: futureExp, sub: "first" }),
      tokenType: "Bearer" as const,
    };
    const secondToken = {
      accessToken: makeJwt({ exp: futureExp, sub: "second" }),
      tokenType: "Bearer" as const,
    };
    identityProvider.authenticate
      .mockResolvedValueOnce(firstToken)
      .mockResolvedValueOnce(secondToken);
    const retryableResult = { status: 401 };
    const finalResult = { status: 200 };
    queryFn.mockResolvedValueOnce(retryableResult).mockResolvedValueOnce(finalResult);
    const refreshAndRetryWhen = jest.fn(result => result === retryableResult);

    await expect(
      new AuthSDK(config, {
        provider: identityProvider,
        keycloakService,
      }).withToken({ queryFn, refreshAndRetryWhen }),
    ).resolves.toBe(finalResult);

    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(queryFn).toHaveBeenNthCalledWith(1, firstToken);
    expect(queryFn).toHaveBeenNthCalledWith(2, secondToken);
    expect(refreshAndRetryWhen).toHaveBeenCalledTimes(1);
    expect(refreshAndRetryWhen).toHaveBeenCalledWith(retryableResult);
    expect(keycloakService.getChallenge).toHaveBeenCalledTimes(2);
    expect(identityProvider.authenticate).toHaveBeenCalledTimes(2);
  });

  it("should propagate queryFn errors without checking retry", async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const token = {
      accessToken: makeJwt({ exp: futureExp }),
      tokenType: "Bearer",
    };
    identityProvider.authenticate.mockResolvedValue(token);
    const queryFnError = new Error("Unavailable");
    queryFn.mockRejectedValue(queryFnError);
    const refreshAndRetryWhen = jest.fn().mockReturnValue(false);

    await expect(
      new AuthSDK(config, {
        provider: identityProvider,
        keycloakService,
      }).withToken({ queryFn, refreshAndRetryWhen }),
    ).rejects.toBe(queryFnError);

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(queryFn).toHaveBeenCalledWith(token);
    expect(refreshAndRetryWhen).not.toHaveBeenCalled();
    expect(keycloakService.getChallenge).toHaveBeenCalledTimes(1);
    expect(identityProvider.authenticate).toHaveBeenCalledTimes(1);
  });

  it("re-authenticates when the cached token has expired", async () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600;
    identityProvider.authenticate.mockResolvedValue({
      accessToken: makeJwt({ exp: pastExp }),
      tokenType: "Bearer",
    });

    const sdk = new AuthSDK(config, {
      provider: identityProvider,
      keycloakService,
    });

    await sdk.withToken({ queryFn });
    await sdk.withToken({ queryFn });

    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(keycloakService.getChallenge).toHaveBeenCalledTimes(2);
    expect(identityProvider.authenticate).toHaveBeenCalledTimes(2);
  });

  it("stops when the challenge response is invalid", async () => {
    keycloakService.getChallenge.mockResolvedValueOnce(undefined);

    await expect(
      new AuthSDK(config, {
        provider: identityProvider,
        keycloakService,
      }).withToken({ queryFn }),
    ).rejects.toBeInstanceOf(WalletAuthInvalidChallengeError);

    expect(queryFn).not.toHaveBeenCalled();
    expect(identityProvider.authenticate).not.toHaveBeenCalled();
  });

  it("stops when the identity provider token response is invalid", async () => {
    identityProvider.authenticate.mockResolvedValueOnce({
      accessToken: "",
      tokenType: "Bearer",
    });

    await expect(
      new AuthSDK(config, {
        provider: identityProvider,
        keycloakService,
      }).withToken({ queryFn }),
    ).rejects.toBeInstanceOf(WalletAuthInvalidTokenError);

    expect(queryFn).not.toHaveBeenCalled();
  });
});

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });

  return { promise, resolve };
}

function waitForMicrotasks(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}

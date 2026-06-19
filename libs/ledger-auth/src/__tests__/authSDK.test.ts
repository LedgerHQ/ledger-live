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

  beforeEach(() => {
    identityProvider.brokerId = "lkrp";

    keycloakService.getChallenge.mockResolvedValue("challenge");
    identityProvider.authenticate.mockResolvedValue({
      tokenType: "Bearer",
      accessToken: "keycloak-jwt",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("retrieves a Keycloak JWT with PKCE by default", async () => {
    const token = await new AuthSDK(config, {
      provider: identityProvider,
      keycloakService,
    }).authenticate();

    expect(token).toEqual({ accessToken: "keycloak-jwt", tokenType: "Bearer" });

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

  it("disable PKCE values when configured", async () => {
    await new AuthSDK(
      { ...config, disablePkce: true },
      { provider: identityProvider, keycloakService },
    ).authenticate();

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
    identityProvider.authenticate.mockResolvedValue({
      accessToken: makeJwt({ exp: futureExp }),
      tokenType: "Bearer",
    });

    const sdk = new AuthSDK(config, { provider: identityProvider, keycloakService });

    const first = await sdk.authenticate();
    const second = await sdk.authenticate();

    expect(second).toBe(first);
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

    const sdk = new AuthSDK(config, { provider: identityProvider, keycloakService });

    const first = sdk.authenticate();
    const second = sdk.authenticate();

    await waitForMicrotasks();
    expect(keycloakService.getChallenge).toHaveBeenCalledTimes(1);
    expect(identityProvider.authenticate).toHaveBeenCalledTimes(1);

    deferredToken.resolve(token);
    await expect(Promise.all([first, second])).resolves.toEqual([token, token]);
  });

  it("re-authenticates when the cached token has expired", async () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600;
    identityProvider.authenticate.mockResolvedValue({
      accessToken: makeJwt({ exp: pastExp }),
      tokenType: "Bearer",
    });

    const sdk = new AuthSDK(config, { provider: identityProvider, keycloakService });

    await sdk.authenticate();
    await sdk.authenticate();

    expect(keycloakService.getChallenge).toHaveBeenCalledTimes(2);
    expect(identityProvider.authenticate).toHaveBeenCalledTimes(2);
  });

  it("stops when the challenge response is invalid", async () => {
    keycloakService.getChallenge.mockResolvedValueOnce(undefined);

    await expect(
      new AuthSDK(config, { provider: identityProvider, keycloakService }).authenticate(),
    ).rejects.toBeInstanceOf(WalletAuthInvalidChallengeError);

    expect(identityProvider.authenticate).not.toHaveBeenCalled();
  });

  it("stops when the identity provider token response is invalid", async () => {
    identityProvider.authenticate.mockResolvedValueOnce({ accessToken: "", tokenType: "Bearer" });

    await expect(
      new AuthSDK(config, { provider: identityProvider, keycloakService }).authenticate(),
    ).rejects.toBeInstanceOf(WalletAuthInvalidTokenError);
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

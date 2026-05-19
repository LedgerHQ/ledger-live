import {
  WalletAuthInvalidAuthorizationError,
  WalletAuthInvalidChallengeError,
  WalletAuthInvalidTokenError,
} from "../errors";
import { authenticate } from "../authenticate";
import type { AuthService, Signer } from "../types";

describe("authenticate", () => {
  const signer: jest.Mocked<Signer> = { sign: jest.fn() };

  const authService: jest.Mocked<AuthService> = {
    getChallenge: jest.fn(),
    authorize: jest.fn(),
    getToken: jest.fn(),
  };

  beforeEach(() => {
    signer.sign.mockResolvedValue({
      alg: "ES256",
      jwk: {
        kty: "EC",
        crv: "P-256",
        x: "x",
        y: "y",
      },
      signature: Uint8Array.from([1, 2, 3]).buffer,
    });

    authService.getChallenge.mockResolvedValue({
      challenge: "challenge",
      challengeId: "challenge-id",
      expiresAt: "2026-05-13T15:00:00.000Z",
    });
    authService.authorize.mockResolvedValue({
      authorizationCode: "authorization-code",
    });
    authService.getToken.mockImplementation(async request => ({
      jwt: `jwt:${request.authorizationCode}:${request.codeVerifier}`,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("retrieves a JWT through challenge, authorization code, and PKCE token exchange", async () => {
    const jwt = await authenticate({
      config: { clientId: "ledger-keycloak" },
      authService,
      signer,
    });

    expect(jwt).toMatch(/^jwt:authorization-code:/);
    expect(authService.getChallenge).toHaveBeenCalledWith(
      expect.objectContaining({
        audience: "Keycloak",
        clientId: "ledger-keycloak",
        codeChallengeMethod: "S256",
        scope: ["openid"],
      }),
    );

    const challengeRequest = jest.mocked(authService.getChallenge).mock.calls[0][0];
    expect(authService.authorize).toHaveBeenCalledWith(
      expect.objectContaining({
        codeChallenge: challengeRequest.codeChallenge,
        challenge: "challenge",
        signature: "AQID",
      }),
    );

    expect(authService.getToken).toHaveBeenCalledWith(
      expect.objectContaining({
        codeVerifier: expect.stringMatching(/^[A-Za-z0-9_-]+$/),
      }),
    );

    expect(signer.sign).toHaveBeenCalledTimes(1);
    const signedPayload = JSON.parse(new TextDecoder().decode(signer.sign.mock.calls[0][1]));
    expect(signedPayload).toMatchObject({
      audience: "Keycloak",
      challenge: "challenge",
      challengeId: "challenge-id",
      clientId: "ledger-keycloak",
      codeChallenge: challengeRequest.codeChallenge,
      scope: ["openid"],
    });
  });

  it("stops when the challenge response is invalid", async () => {
    authService.getChallenge.mockResolvedValueOnce({ challenge: "" });

    await expect(
      authenticate({
        config: { clientId: "ledger-keycloak" },
        authService,
        signer,
      }),
    ).rejects.toBeInstanceOf(WalletAuthInvalidChallengeError);

    expect(signer.sign).not.toHaveBeenCalled();
    expect(authService.authorize).not.toHaveBeenCalled();
    expect(authService.getToken).not.toHaveBeenCalled();
  });

  it("stops when the authorization response is invalid", async () => {
    authService.authorize.mockResolvedValueOnce({ authorizationCode: "" });

    await expect(
      authenticate({
        config: { clientId: "ledger-keycloak" },
        authService,
        signer,
      }),
    ).rejects.toBeInstanceOf(WalletAuthInvalidAuthorizationError);

    expect(authService.getToken).not.toHaveBeenCalled();
  });

  it("fails when the token response does not contain a JWT", async () => {
    authService.getToken.mockResolvedValueOnce({ jwt: "" });

    await expect(
      authenticate({
        config: { clientId: "ledger-keycloak" },
        authService,
        signer,
      }),
    ).rejects.toBeInstanceOf(WalletAuthInvalidTokenError);
  });
});

import { WalletAuthInvalidChallengeError, WalletAuthInvalidTokenError } from "./errors";
import { HttpKeycloakService } from "./keycloakService";
import { createPkcePair } from "./pkce";
import type { AuthConfig, IdentityProvider, KeycloakService, KeycloakToken } from "./types";
import { getTokenState } from "./utils";

export class AuthSDK {
  private token?: KeycloakToken;
  private readonly idP: IdentityProvider;
  private readonly keycloakService: KeycloakService;

  constructor(
    private readonly config: AuthConfig,
    {
      provider,
      fetch = globalThis.fetch,
      keycloakService = new HttpKeycloakService(
        config.keycloakBaseUrl,
        config.keycloakRealm,
        fetch,
      ),
    }: {
      provider: IdentityProvider;
      fetch?: typeof globalThis.fetch;
      keycloakService?: KeycloakService;
    },
  ) {
    this.idP = provider;
    this.keycloakService = keycloakService;
  }

  async authenticate(): Promise<KeycloakToken> {
    if (this.token && getTokenState(this.token.accessToken) === "valid") {
      return this.token;
    }

    const pkce = this.config.disablePkce ? undefined : await createPkcePair();
    const redirectUri = `${this.keycloakService.realmBaseUrl}/broker/${this.idP.brokerId}/endpoint`;

    const challenge = await this.keycloakService.getChallenge({
      responseType: "code",
      clientId: this.config.clientId,
      scope: "openid",
      redirectUri,
      codeChallenge: pkce?.codeChallenge,
      codeChallengeMethod: pkce?.codeChallengeMethod,
    });
    if (!challenge) {
      throw new WalletAuthInvalidChallengeError();
    }

    const identityProviderTokenResponse = await this.idP.authenticate({
      challenge,
      clientId: this.config.clientId,
      redirectUri,
      codeVerifier: pkce?.codeVerifier,
    });
    if (!identityProviderTokenResponse.accessToken) {
      throw new WalletAuthInvalidTokenError();
    }

    this.token = identityProviderTokenResponse;

    return this.token;
  }
}

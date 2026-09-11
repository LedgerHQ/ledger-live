import { WalletAuthInvalidChallengeError, WalletAuthInvalidTokenError } from "./errors";
import { HttpKeycloakService } from "./keycloakService";
import { createPkcePairWithWebCrypto, type CreatePkcePair } from "./pkce";
import type {
  AuthConfig,
  FetchFn,
  IdentityProvider,
  KeycloakService,
  KeycloakToken,
} from "./types";
import { getTokenState } from "./utils";

export class AuthSDK {
  private token?: Promise<KeycloakToken>;
  private readonly idP: IdentityProvider;
  private readonly createPkcePair: CreatePkcePair;
  private readonly keycloakService: KeycloakService;

  constructor(
    private readonly config: AuthConfig,
    {
      provider,
      createPkcePair = createPkcePairWithWebCrypto,
      fetch = globalThis.fetch,
      keycloakService = new HttpKeycloakService(
        config.keycloakBaseUrl,
        config.keycloakRealm,
        fetch,
      ),
    }: {
      provider: IdentityProvider;
      createPkcePair?: CreatePkcePair;
      fetch?: FetchFn;
      keycloakService?: KeycloakService;
    },
  ) {
    this.idP = provider;
    this.createPkcePair = createPkcePair;
    this.keycloakService = keycloakService;
  }

  async withToken<T>({
    queryFn,
    refreshAndRetryWhen,
  }: {
    queryFn: (token: KeycloakToken) => Promise<T>;
    refreshAndRetryWhen?: (result: T) => boolean;
  }): Promise<T> {
    const token = await this.getToken();
    return queryFn(token).then(async (result: T) => {
      if (!refreshAndRetryWhen?.(result)) return result;
      const refreshedToken = await this.getToken(true);
      return queryFn(refreshedToken);
    });
  }

  private async getToken(forceRefresh = false): Promise<KeycloakToken> {
    if (forceRefresh) {
      this.token = undefined;
    }

    if (this.token) {
      const cachedToken = this.token;
      const token = await cachedToken;
      if (getTokenState(token.accessToken) === "valid") {
        return token;
      }

      if (this.token === cachedToken) {
        this.token = this.createTokenPromise();
      }
      return this.token;
    }

    this.token = this.createTokenPromise();
    return this.token;
  }

  private createTokenPromise(): Promise<KeycloakToken> {
    const tokenPromise = this.fetchToken().catch(error => {
      if (this.token === tokenPromise) {
        this.token = undefined;
      }
      throw error;
    });
    return tokenPromise;
  }

  private async fetchToken(): Promise<KeycloakToken> {
    const pkce = this.config.disablePkce ? undefined : await this.createPkcePair();
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

    return identityProviderTokenResponse;
  }
}

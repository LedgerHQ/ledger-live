import { WalletAuthMissingBaseUrlError } from "./errors";
import { parseJsonResponse } from "./http";
import type { AuthConfig, ChallengeRequest, FetchFn, KeycloakService } from "./types";

export class HttpKeycloakService implements KeycloakService {
  private readonly getBaseUrl: () => string | null;
  readonly #fetch: FetchFn;

  constructor(
    getBaseUrl: AuthConfig["keycloakBaseUrl"],
    private readonly realm: string,
    fetch: FetchFn = globalThis.fetch,
  ) {
    this.getBaseUrl = typeof getBaseUrl === "string" ? () => getBaseUrl : getBaseUrl;
    this.#fetch = fetch;
  }

  get baseUrl(): string {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) throw new WalletAuthMissingBaseUrlError();
    return trimTrailingSlash(baseUrl);
  }
  get realmBaseUrl(): string {
    return `${this.baseUrl}/realms/${this.realm}`;
  }
  get openIdBaseUrl(): string {
    return `${this.realmBaseUrl}/protocol/openid-connect`;
  }

  async getChallenge(request: ChallengeRequest): Promise<unknown> {
    const url = new URL(`${this.openIdBaseUrl}/auth`);
    url.searchParams.set("response_type", request.responseType);
    url.searchParams.set("client_id", request.clientId);
    url.searchParams.set("scope", request.scope);
    url.searchParams.set("redirect_uri", request.redirectUri);
    if (request.codeChallenge && request.codeChallengeMethod) {
      url.searchParams.set("code_challenge", request.codeChallenge);
      url.searchParams.set("code_challenge_method", request.codeChallengeMethod);
    }

    const response = await this.#fetch(url, {
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return parseJsonResponse(response);
  }
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

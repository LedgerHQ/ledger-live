import { parseJsonResponse } from "./http";
import type { ChallengeRequest, KeycloakService } from "./types";

export class HttpKeycloakService implements KeycloakService {
  readonly baseUrl: string;
  readonly realmBaseUrl: string;
  private readonly openIdBaseUrl: string;

  readonly #fetch: typeof globalThis.fetch;

  constructor(baseUrl: string, realm: string, fetch: typeof globalThis.fetch = globalThis.fetch) {
    this.baseUrl = trimTrailingSlash(baseUrl);
    this.realmBaseUrl = `${this.baseUrl}/realms/${realm}`;
    this.openIdBaseUrl = `${this.realmBaseUrl}/protocol/openid-connect`;
    this.#fetch = fetch;
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

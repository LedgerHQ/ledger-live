import { payCardApi } from "@shared/api-services";
import {
  PayCardAuthorizeInitiateResponseSchema,
  PayCardLogoutResponseSchema,
  PayCardSessionResponseSchema,
  PayCardSessionSchema,
  PayCardUserResponseSchema,
} from "./schema";
import type {
  PayCardAuthorizeInitiate,
  PayCardLogoutResult,
  PayCardSession,
  PayCardSessionResponse,
  PayCardUser,
} from "./types";

export type PayCardAuthorizeInitiateRequest = {
  readonly clientId: string;
  readonly redirectUri: string;
  /** CSRF token echoed back on the redirect. The backend requires at least 8 characters. */
  readonly state: string;
  /** `BASE64URL(SHA256(codeVerifier))`; the verifier itself is sent later to the token endpoint. */
  readonly codeChallenge: string;
};

export type PayCardAuthorizationCodeRequest = {
  readonly code: string;
  /** Must match the `redirectUri` sent to the authorize initiation exactly. */
  readonly redirectUri: string;
  readonly codeVerifier: string;
};

export type PayCardRefreshSessionRequest = {
  readonly refreshToken: string;
};

/**
 * TODO(LIVE-34769): placeholders. The backend rejects any request without `x-client-key` (499) and an
 * authenticated one without a bearer token (401), but neither value has a source yet — the client key
 * is not in `shared/env`, and the access token only exists once the OAuth flow writes it to secure
 * storage. Both belong in the base query's `prepareHeaders`
 */
const PLACEHOLDER_CLIENT_KEY = "";
const PLACEHOLDER_ACCESS_TOKEN = "";

const clientKeyHeaders = { "x-client-key": PLACEHOLDER_CLIENT_KEY };

const authenticatedHeaders = {
  ...clientKeyHeaders,
  Authorization: `Bearer ${PLACEHOLDER_ACCESS_TOKEN}`,
};

function toPayCardSession(response: PayCardSessionResponse): PayCardSession {
  return {
    accessToken: response.access_token,
    expiresIn: response.expires_in,
    refreshToken: response.refresh_token,
    refreshTokenExpiresIn: response.refresh_token_expires_in,
  };
}

/**
 * Pay Card authentication endpoints, injected into the shared Card API service.
 *
 * `injectEndpoints` mutates and returns the same api object, so this reference shares its reducer,
 * middleware and cache with the service the apps register, while only this one is typed with the
 * endpoints below. Reaching the backend (base URL, headers) stays in `@shared/api-services`.
 */
export const payCardAuthApi = payCardApi.injectEndpoints({
  endpoints: build => ({
    /**
     * A mutation rather than a query: each attempt carries a fresh `state` and PKCE challenge, so no
     * response is ever reusable, and starting a login must be an explicit act rather than something
     * a mounted component triggers.
     */
    initiateAuthorize: build.mutation<PayCardAuthorizeInitiate, PayCardAuthorizeInitiateRequest>({
      query: ({ clientId, redirectUri, state, codeChallenge }) => ({
        url: "/v1/auth/oauth/authorize/initiate",
        method: "GET",
        headers: clientKeyHeaders,
        params: {
          client_id: clientId,
          response_type: "code",
          redirect_uri: redirectUri,
          state,
          code_challenge: codeChallenge,
          code_challenge_method: "S256",
          mode: "api",
        },
      }),
      responseSchema: PayCardAuthorizeInitiateResponseSchema,
    }),

    /** Single-use: the base query deliberately does not retry, so a failed exchange is not replayed. */
    exchangeAuthorizationCode: build.mutation<PayCardSession, PayCardAuthorizationCodeRequest>({
      query: ({ code, redirectUri, codeVerifier }) => ({
        url: "/v1/auth/oauth/token",
        method: "POST",
        headers: clientKeyHeaders,
        body: {
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        },
      }),
      rawResponseSchema: PayCardSessionResponseSchema,
      transformResponse: toPayCardSession,
      responseSchema: PayCardSessionSchema,
    }),

    /** Same endpoint as the code exchange, separated by `grant_type`. */
    refreshSession: build.mutation<PayCardSession, PayCardRefreshSessionRequest>({
      query: ({ refreshToken }) => ({
        url: "/v1/auth/oauth/token",
        method: "POST",
        headers: clientKeyHeaders,
        body: {
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        },
      }),
      rawResponseSchema: PayCardSessionResponseSchema,
      transformResponse: toPayCardSession,
      responseSchema: PayCardSessionSchema,
    }),

    logout: build.mutation<PayCardLogoutResult, void>({
      query: () => ({
        url: "/v1/auth/logout",
        method: "POST",
        headers: authenticatedHeaders,
      }),
      responseSchema: PayCardLogoutResponseSchema,
    }),

    getUser: build.query<PayCardUser, void>({
      query: () => ({
        url: "/v1/user",
        method: "GET",
        headers: authenticatedHeaders,
      }),
      responseSchema: PayCardUserResponseSchema,
    }),
  }),
});

export const {
  useInitiateAuthorizeMutation,
  useExchangeAuthorizationCodeMutation,
  useRefreshSessionMutation,
  useLogoutMutation,
  useGetUserQuery,
} = payCardAuthApi;

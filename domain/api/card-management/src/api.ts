import { cardApi } from "@shared/api-services";
import { CARD_MANAGEMENT_TAGS } from "./constants";
import {
  PayCardAuthorizeInitiateResponseSchema,
  PayCardLogoutResponseSchema,
  PayCardSessionResponseSchema,
  PayCardSessionSchema,
  PayCardUserResponseSchema,
} from "./schema";
import type {
  PayCardAuthorizationCodeRequest,
  PayCardAuthorizeInitiate,
  PayCardAuthorizeInitiateRequest,
  PayCardLogoutResult,
  PayCardRefreshSessionRequest,
  PayCardSession,
  PayCardSessionResponse,
  PayCardUser,
} from "./types";

function toPayCardSession(response: PayCardSessionResponse): PayCardSession {
  return {
    accessToken: response.access_token,
    expiresIn: response.expires_in,
    refreshToken: response.refresh_token,
    refreshTokenExpiresIn: response.refresh_token_expires_in,
  };
}

/**
 * Card Management endpoints, injected into the shared Card API service.
 *
 * `injectEndpoints` mutates and returns the same api object, so this reference shares its reducer,
 * middleware and cache with the service the apps register, while only this one is typed with the
 * endpoints below. Reaching the backend — base URL, `x-client-key`, the session bearer token and the
 * 401 refresh — stays in `@shared/api-services`.
 */
export const cardManagementApi = cardApi
  .enhanceEndpoints({ addTagTypes: CARD_MANAGEMENT_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      /**
       * A mutation rather than a query: each attempt carries a fresh `state` and PKCE challenge, so
       * no response is ever reusable, and starting a login must be an explicit act rather than
       * something a mounted component triggers.
       */
      initiateAuthorize: build.mutation<PayCardAuthorizeInitiate, PayCardAuthorizeInitiateRequest>({
        query: ({ clientId, redirectUri, state, codeChallenge }) => ({
          url: "/v1/auth/oauth/authorize/initiate",
          method: "GET",
          params: {
            client_id: clientId,
            response_type: "code",
            redirect_uri: redirectUri,
            state,
            code_challenge: codeChallenge,
            code_challenge_method: "S256",
          },
        }),
        responseSchema: PayCardAuthorizeInitiateResponseSchema,
      }),

      /**
       * Single-use: an authorization code cannot be presented twice.
       *
       * TODO(LIVE-34769): the Card base query retries once on 401 after `refreshCardSession()`. That
       * refresh returns `null` today, so nothing is replayed — but once it returns a real token, a
       * 401 here would re-POST the same spent code. Exclude this path from the refresh retry when
       * the session gets an owner.
       */
      exchangeAuthorizationCode: build.mutation<PayCardSession, PayCardAuthorizationCodeRequest>({
        query: ({ code, redirectUri, codeVerifier }) => ({
          url: "/v1/auth/oauth/token",
          method: "POST",
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

      /** Same endpoint as the code exchange, separated by `grant_type`. Same replay caveat. */
      refreshSession: build.mutation<PayCardSession, PayCardRefreshSessionRequest>({
        query: ({ refreshToken }) => ({
          url: "/v1/auth/oauth/token",
          method: "POST",
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
        }),
        responseSchema: PayCardLogoutResponseSchema,
      }),

      getUser: build.query<PayCardUser, void>({
        query: () => ({
          url: "/v1/user",
          method: "GET",
        }),
        responseSchema: PayCardUserResponseSchema,
      }),
    }),
  });

export type CardManagementApi = typeof cardManagementApi;

export const {
  useInitiateAuthorizeMutation,
  useExchangeAuthorizationCodeMutation,
  useRefreshSessionMutation,
  useLogoutMutation,
  useGetUserQuery,
} = cardManagementApi;

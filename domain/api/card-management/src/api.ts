import { cardApi, getCardExtra } from "@shared/api-services";
import { CARD_MANAGEMENT_TAGS } from "./constants";
import {
  PayCardAuthorizeInitiateSchema,
  PayCardLogoutResponseSchema,
  PayCardSessionResponseSchema,
  PayCardSessionSchema,
  PayCardUserResponseSchema,
} from "./schema";
import { transformPayCardSessionResponse } from "./transforms";
import type {
  PayCardAuthorizationCodeRequest,
  PayCardAuthorizeInitiate,
  PayCardAuthorizeInitiateRequest,
  PayCardAuthorizeInitiateResponse,
  PayCardLogoutResult,
  PayCardRefreshSessionRequest,
  PayCardSession,
  PayCardSessionResponse,
  PayCardUser,
} from "./types";

export const cardManagementApi = cardApi
  .enhanceEndpoints({ addTagTypes: CARD_MANAGEMENT_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      /** A mutation, not a query: every attempt carries a fresh `state` and PKCE challenge. */
      initiateAuthorize: build.mutation<PayCardAuthorizeInitiate, PayCardAuthorizeInitiateRequest>({
        queryFn: async ({ state, codeChallenge }, queryApi, _extraOptions, baseQuery) => {
          const { cardBaanxClientKey, cardOauthRedirectUri } = getCardExtra(queryApi);
          const response = await baseQuery({
            url: "/v1/auth/oauth/authorize/initiate",
            method: "GET",
            params: {
              client_id: cardBaanxClientKey,
              response_type: "code",
              redirect_uri: cardOauthRedirectUri,
              state,
              code_challenge: codeChallenge,
              code_challenge_method: "S256",
              // Without this the endpoint answers 302 to the hosted UI; `api` returns it as JSON.
              mode: "api",
            },
          });

          if (response.error) {
            return { error: response.error };
          }

          const initiate = response.data as PayCardAuthorizeInitiateResponse;
          return { data: { ...initiate, redirectUri: cardOauthRedirectUri } };
        },
        responseSchema: PayCardAuthorizeInitiateSchema,
      }),

      exchangeAuthorizationCode: build.mutation<PayCardSession, PayCardAuthorizationCodeRequest>({
        queryFn: async ({ code, codeVerifier }, queryApi, _extraOptions, baseQuery) => {
          const { cardOauthRedirectUri } = getCardExtra(queryApi);
          const response = await baseQuery({
            url: "/v1/auth/oauth/token",
            method: "POST",
            body: {
              grant_type: "authorization_code",
              code,
              redirect_uri: cardOauthRedirectUri,
              code_verifier: codeVerifier,
            },
          });

          if (response.error) {
            return { error: response.error };
          }

          const session = response.data as PayCardSessionResponse;
          return { data: transformPayCardSessionResponse(session) };
        },
        responseSchema: PayCardSessionSchema,
      }),

      /** Same endpoint as the code exchange, separated by `grant_type`. */
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
        transformResponse: transformPayCardSessionResponse,
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

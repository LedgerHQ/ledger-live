import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { cardApi, getCardExtra } from "@shared/api-services";
import type { ZodType } from "zod";
import { CARD_MANAGEMENT_TAGS } from "./constants";
import {
  PayCardAuthorizeInitiateSchema,
  PayCardAuthorizeInitiateResponseSchema,
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
  PayCardLogoutResult,
  PayCardRefreshSessionRequest,
  PayCardSession,
  PayCardUser,
} from "./types";

function parseResponse<T>(
  schema: ZodType<T>,
  data: unknown,
): { data: T } | { error: FetchBaseQueryError } {
  const parsed = schema.safeParse(data);
  if (parsed.success) {
    return { data: parsed.data };
  }

  return {
    error: {
      status: "PARSING_ERROR",
      originalStatus: 200,
      data: "",
      error: "Response did not match the Card API schema",
    },
  };
}

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

          const parsedResponse = parseResponse(
            PayCardAuthorizeInitiateResponseSchema,
            response.data,
          );
          if ("error" in parsedResponse) {
            return parsedResponse;
          }

          return parseResponse(PayCardAuthorizeInitiateSchema, {
            ...parsedResponse.data,
            redirectUri: cardOauthRedirectUri,
          });
        },
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

          const parsedResponse = parseResponse(PayCardSessionResponseSchema, response.data);
          if ("error" in parsedResponse) {
            return parsedResponse;
          }

          return parseResponse(
            PayCardSessionSchema,
            transformPayCardSessionResponse(parsedResponse.data),
          );
        },
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

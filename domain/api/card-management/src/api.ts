import { cardApi } from "@shared/api-services";
import { CARD_MANAGEMENT_TAGS } from "./constants";
import {
  PayCardLogoutResponseSchema,
  PayCardOrderResponseSchema,
  PayCardSessionResponseSchema,
  PayCardSessionSchema,
  PayCardUserResponseSchema,
} from "./schema";
import { transformPayCardSessionResponse } from "./transforms";
import type {
  PayCardAuthorizationCodeRequest,
  PayCardLogoutResult,
  PayCardOrderResult,
  PayCardRefreshSessionRequest,
  PayCardSession,
  PayCardUser,
} from "./types";

export const cardManagementApi = cardApi
  .enhanceEndpoints({ addTagTypes: CARD_MANAGEMENT_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      exchangeAuthorizationCode: build.mutation<PayCardSession, PayCardAuthorizationCodeRequest>({
        query: ({ code, redirectUri, codeVerifier }) => ({
          url: "/v1/auth/oauth2/token",
          method: "POST",
          body: {
            grant_type: "authorization_code",
            code,
            // The provider compares it with the one the authorization carried.
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
          },
        }),
        rawResponseSchema: PayCardSessionResponseSchema,
        transformResponse: transformPayCardSessionResponse,
        responseSchema: PayCardSessionSchema,
      }),

      /** Same endpoint as the code exchange, separated by `grant_type`. */
      refreshSession: build.mutation<PayCardSession, PayCardRefreshSessionRequest>({
        query: ({ refreshToken }) => ({
          url: "/v1/auth/oauth2/token",
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

      /**
       * Takes no argument from the caller: the body is fixed to `{ type: "VIRTUAL" }`, because
       * virtual is the only type the provider issues today.
       */
      orderCard: build.mutation<PayCardOrderResult, void>({
        query: () => ({
          url: "/v1/card/order",
          method: "POST",
          body: { type: "VIRTUAL" },
        }),
        responseSchema: PayCardOrderResponseSchema,
      }),
    }),
  });

export type CardManagementApi = typeof cardManagementApi;

export const {
  useExchangeAuthorizationCodeMutation,
  useRefreshSessionMutation,
  useLogoutMutation,
  useGetUserQuery,
  useOrderCardMutation,
} = cardManagementApi;

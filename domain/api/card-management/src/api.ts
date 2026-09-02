import { cardApi } from "@shared/api-services";
import { CARD_MANAGEMENT_TAGS } from "./constants";
import {
  PayCardFreezeStateResponseSchema,
  PayCardInternalWalletsResponseSchema,
  PayCardLinkedWalletsResponseSchema,
  PayCardLogoutResponseSchema,
  PayCardOrderResponseSchema,
  PayCardSessionResponseSchema,
  PayCardSessionSchema,
  PayCardDetailsTokenResponseSchema,
  PayCardStatusResponseSchema,
  PayCardUserResponseSchema,
} from "./schema";
import { transformPayCardSessionResponse } from "./transforms";
import type {
  PayCardAuthorizationCodeRequest,
  PayCardFreezeStateResult,
  PayCardInternalWallet,
  PayCardLinkedWallet,
  PayCardLogoutResult,
  PayCardOrderResult,
  PayCardRefreshSessionRequest,
  PayCardSession,
  PayCardDetailsCss,
  PayCardDetailsToken,
  PayCardStatus,
  PayCardUser,
} from "./types";

export const cardManagementApi = cardApi
  .enhanceEndpoints({ addTagTypes: CARD_MANAGEMENT_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      exchangeAuthorizationCode: build.mutation<PayCardSession, PayCardAuthorizationCodeRequest>({
        query: ({ code, codeVerifier }) => ({
          url: "/v1/auth/oauth2/token",
          method: "POST",
          body: {
            grant_type: "authorization_code",
            code,
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
        // The order answers `{ success: true }` and nothing else, so the card it created only
        // becomes observable once the status is read again.
        invalidatesTags: ["CardStatus"],
      }),

      getCardStatus: build.query<PayCardStatus, void>({
        query: () => ({
          url: "/v1/card/status",
          method: "GET",
        }),
        responseSchema: PayCardStatusResponseSchema,
        providesTags: ["CardStatus"],
      }),

      /**
       * A mutation, though it reads: the provider spends the token on first use, so the answer must
       * never be served from a cache. Mutations are not cached and are not retained.
       */
      createCardDetailsToken: build.mutation<PayCardDetailsToken, PayCardDetailsCss | void>({
        query: customCss => ({
          url: "/v1/card/details/token",
          method: "POST",
          ...(customCss ? { body: { customCss } } : {}),
        }),
        responseSchema: PayCardDetailsTokenResponseSchema,
      }),

      freezeCard: build.mutation<PayCardFreezeStateResult, void>({
        query: () => ({
          url: "/v1/card/freeze",
          method: "POST",
        }),
        responseSchema: PayCardFreezeStateResponseSchema,
        invalidatesTags: ["CardStatus"],
      }),

      unfreezeCard: build.mutation<PayCardFreezeStateResult, void>({
        query: () => ({
          url: "/v1/card/unfreeze",
          method: "POST",
        }),
        responseSchema: PayCardFreezeStateResponseSchema,
        invalidatesTags: ["CardStatus"],
      }),

      getInternalWallets: build.query<PayCardInternalWallet[], void>({
        query: () => ({
          url: "/v1/wallet/internal",
          method: "GET",
        }),
        responseSchema: PayCardInternalWalletsResponseSchema,
      }),

      getCardLinkedWallets: build.query<PayCardLinkedWallet[], void>({
        query: () => ({
          url: "/v1/wallet/internal/card_linked",
          method: "GET",
        }),
        responseSchema: PayCardLinkedWalletsResponseSchema,
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
  useGetCardStatusQuery,
  useCreateCardDetailsTokenMutation,
  useLazyGetCardStatusQuery,
  useFreezeCardMutation,
  useUnfreezeCardMutation,
  useGetInternalWalletsQuery,
  useGetCardLinkedWalletsQuery,
} = cardManagementApi;

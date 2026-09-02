import { cardApi } from "@shared/api-services";
import { CARD_MANAGEMENT_TAGS, OAUTH2_TOKEN_PATH } from "./constants";
import {
  PayCardFreezeStateResponseSchema,
  PayCardInternalWalletsResponseSchema,
  PayCardLinkedWalletsResponseSchema,
  PayCardLogoutResponseSchema,
  PayCardOnboardingStatusResponseSchema,
  PayCardOrderResponseSchema,
  PayCardSessionResponseSchema,
  PayCardSessionSchema,
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
  PayCardOnboardingStatus,
  PayCardOrderResult,
  PayCardRefreshSessionRequest,
  PayCardSession,
  PayCardStatus,
  PayCardUser,
} from "./types";

const GRANT = { authenticated: false } as const;

export const cardManagementApi = cardApi
  .enhanceEndpoints({ addTagTypes: CARD_MANAGEMENT_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      exchangeAuthorizationCode: build.mutation<PayCardSession, PayCardAuthorizationCodeRequest>({
        query: request => ({
          url: OAUTH2_TOKEN_PATH,
          method: "POST",
          body: {
            grant_type: "authorization_code",
            code: request.code,
            code_verifier: request.codeVerifier,
          },
        }),
        extraOptions: GRANT,
        rawResponseSchema: PayCardSessionResponseSchema,
        transformResponse: transformPayCardSessionResponse,
        responseSchema: PayCardSessionSchema,
      }),

      refreshSession: build.mutation<PayCardSession, PayCardRefreshSessionRequest>({
        query: request => ({
          url: OAUTH2_TOKEN_PATH,
          method: "POST",
          body: { grant_type: "refresh_token", refresh_token: request.refreshToken },
        }),
        extraOptions: GRANT,
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

      getCardOnboardingStatus: build.query<PayCardOnboardingStatus, void>({
        query: () => ({
          url: "/v1/card/onboarding-status",
          method: "GET",
        }),
        responseSchema: PayCardOnboardingStatusResponseSchema,
        providesTags: ["CardOnboardingStatus"],
      }),
    }),
  });

export type CardManagementApi = typeof cardManagementApi;

export const {
  useLogoutMutation,
  useGetUserQuery,
  useOrderCardMutation,
  useGetCardStatusQuery,
  useLazyGetCardStatusQuery,
  useFreezeCardMutation,
  useUnfreezeCardMutation,
  useGetInternalWalletsQuery,
  useGetCardLinkedWalletsQuery,
  useGetCardOnboardingStatusQuery,
} = cardManagementApi;

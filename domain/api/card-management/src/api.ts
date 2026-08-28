import { cardApi, getCardExtra, toSchemaFailureError } from "@shared/api-services";
import { CARD_MANAGEMENT_TAGS, MISSING_REFRESH_TOKEN, OAUTH2_TOKEN_PATH } from "./constants";
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
  PayCardSession,
  PayCardStatus,
  PayCardUser,
} from "./types";

const UNAUTHORIZED_STATUS = 401;

export const cardManagementApi = cardApi
  .enhanceEndpoints({ addTagTypes: CARD_MANAGEMENT_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      exchangeAuthorizationCode: build.mutation<PayCardSession, PayCardAuthorizationCodeRequest>({
        // A token grant carries its own proof. Bypassing also keeps a dead session from looping
        // through `401 -> refreshCardSession -> refreshSession -> 401`.
        extraOptions: { authenticated: false },
        query: ({ code, codeVerifier }) => ({
          url: OAUTH2_TOKEN_PATH,
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

      /**
       * Same endpoint as the code exchange, separated by `grant_type`, and the one endpoint here
       * that is a `queryFn` rather than a `query`.
       *
       * It takes no argument. It reads the refresh token off `api.extra` instead, because the
       * desktop redux logger copies every RTK Query argument into the file users attach to support
       * tickets, in production. No argument, no leak.
       *
       * `rawResponseSchema` and `transformResponse` are unavailable on a `queryFn`, so both happen
       * by hand below. `responseSchema` still runs on what this returns.
       */
      refreshSession: build.mutation<PayCardSession, void>({
        extraOptions: { authenticated: false },
        async queryFn(_arg, api, _extraOptions, baseQuery) {
          let refreshToken: string | null | undefined;
          try {
            refreshToken = await getCardExtra(api).getCardRefreshToken();
          } catch (error) {
            // Nonterminal: a secure-store read that failed says nothing about the session.
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: error instanceof Error ? error.message : String(error),
              },
            };
          }

          if (!refreshToken) {
            return {
              error: { status: UNAUTHORIZED_STATUS, data: { message: MISSING_REFRESH_TOKEN } },
            };
          }

          const response = await baseQuery({
            url: OAUTH2_TOKEN_PATH,
            method: "POST",
            body: { grant_type: "refresh_token", refresh_token: refreshToken },
          });
          if (response.error) {
            return { error: response.error, meta: response.meta };
          }

          const parsed = PayCardSessionResponseSchema.safeParse(response.data);
          if (!parsed.success) {
            // The body is dropped here, exactly as `catchSchemaFailure` drops it elsewhere.
            return {
              error: toSchemaFailureError("rawResponseSchema", parsed.error.issues),
              meta: response.meta,
            };
          }

          return { data: transformPayCardSessionResponse(parsed.data), meta: response.meta };
        },
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

/**
 * No `useRefreshSessionMutation`. A renewal is the base query's decision, and a component that
 * triggered one would rotate the refresh token behind its back.
 */
export const {
  useExchangeAuthorizationCodeMutation,
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

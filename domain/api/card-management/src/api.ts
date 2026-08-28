import {
  cardApi,
  getCardExtra,
  toSchemaFailureError,
  UNAUTHORIZED_STATUS,
  type CardBaseQueryMeta,
} from "@shared/api-services";
import type { FetchBaseQueryError, QueryReturnValue } from "@reduxjs/toolkit/query";
import {
  CARD_MANAGEMENT_TAGS,
  MISSING_AUTHORIZATION_GRANT,
  MISSING_REFRESH_TOKEN,
  OAUTH2_TOKEN_PATH,
} from "./constants";
import {
  PayCardFreezeStateResponseSchema,
  PayCardInternalWalletsResponseSchema,
  PayCardLinkedWalletsResponseSchema,
  PayCardLogoutResponseSchema,
  PayCardOnboardingStatusResponseSchema,
  PayCardOrderResponseSchema,
  PayCardSessionReceiptSchema,
  PayCardSessionResponseSchema,
  PayCardStatusResponseSchema,
  PayCardUserResponseSchema,
} from "./schema";
import { transformPayCardSessionResponse } from "./transforms";
import type {
  PayCardFreezeStateResult,
  PayCardInternalWallet,
  PayCardLinkedWallet,
  PayCardLogoutResult,
  PayCardOnboardingStatus,
  PayCardOrderResult,
  PayCardSessionReceipt,
  PayCardStatus,
  PayCardUser,
} from "./types";

type GrantAnswer = QueryReturnValue<unknown, FetchBaseQueryError, CardBaseQueryMeta>;
type ReceiptAnswer = QueryReturnValue<
  PayCardSessionReceipt,
  FetchBaseQueryError,
  CardBaseQueryMeta
>;

/** Turns a transport failure into the shape `queryFn` must answer with. */
function grantError(error: unknown): { error: FetchBaseQueryError } {
  return {
    error: {
      status: "CUSTOM_ERROR",
      error: error instanceof Error ? error.message : String(error),
    },
  };
}

/**
 * Validates a token response, hands the session to its owner, and answers with the handle.
 *
 * The session never becomes the endpoint's data. RTK Query puts every answer into a redux action,
 * and both grants answer with two credentials: the desktop log export and the mobile DevTools relay
 * would each serialize them. `receiveCardSession` takes the session out of band and returns a handle
 * the caller reads it back with.
 */
function toSessionReceipt(api: { extra: unknown }, response: GrantAnswer): ReceiptAnswer {
  if (response.error) {
    return { error: response.error, meta: response.meta };
  }

  const parsed = PayCardSessionResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    // The body is dropped here, exactly as `catchSchemaFailure` drops it elsewhere.
    return { error: toSchemaFailureError("PayCardSessionResponseSchema"), meta: response.meta };
  }

  const session = transformPayCardSessionResponse(parsed.data);
  return {
    data: { sessionHandle: getCardExtra(api).receiveCardSession(session) },
    meta: response.meta,
  };
}

export const cardManagementApi = cardApi
  .enhanceEndpoints({ addTagTypes: CARD_MANAGEMENT_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      /**
       * The `authorization_code` grant. It takes no argument: the login flow puts the code and the
       * PKCE verifier into the hand-off slot on `api.extra`, and this takes them. An argument would
       * land in `meta.arg.originalArgs` of every pending action, which the desktop redux logger
       * copies into the file users attach to support tickets, in production.
       *
       * It answers with a handle rather than the session. See {@link toSessionReceipt}.
       */
      exchangeAuthorizationCode: build.mutation<PayCardSessionReceipt, void>({
        // A token grant carries its own proof. Bypassing also keeps a dead session from looping
        // through `401 -> refreshCardSession -> refreshSession -> 401`.
        extraOptions: { authenticated: false },
        async queryFn(_arg, api, _extraOptions, baseQuery) {
          const grant = getCardExtra(api).takeCardAuthorizationGrant();
          if (!grant) {
            return { error: { status: "CUSTOM_ERROR", error: MISSING_AUTHORIZATION_GRANT } };
          }

          return toSessionReceipt(
            api,
            await baseQuery({
              url: OAUTH2_TOKEN_PATH,
              method: "POST",
              body: {
                grant_type: "authorization_code",
                code: grant.code,
                code_verifier: grant.codeVerifier,
              },
            }),
          );
        },
        responseSchema: PayCardSessionReceiptSchema,
      }),

      /**
       * The `refresh_token` grant: the same endpoint, separated by `grant_type`.
       *
       * It reads the refresh token off `api.extra` for the reason above, and it is the only read of
       * that key in a renewal. It answers with a handle rather than the session.
       *
       * `transformResponse` does not run on a `queryFn`, so the wire body is validated and mapped by
       * hand in {@link toSessionReceipt}. `responseSchema` still runs on what this returns.
       */
      refreshSession: build.mutation<PayCardSessionReceipt, void>({
        extraOptions: { authenticated: false },
        async queryFn(_arg, api, _extraOptions, baseQuery) {
          let refreshToken: string | null | undefined;
          try {
            refreshToken = await getCardExtra(api).getCardRefreshToken();
          } catch (error) {
            // Nonterminal: a secure-store read that failed says nothing about the session.
            return grantError(error);
          }

          if (!refreshToken) {
            return {
              error: { status: UNAUTHORIZED_STATUS, data: { message: MISSING_REFRESH_TOKEN } },
            };
          }

          return toSessionReceipt(
            api,
            await baseQuery({
              url: OAUTH2_TOKEN_PATH,
              method: "POST",
              body: { grant_type: "refresh_token", refresh_token: refreshToken },
            }),
          );
        },
        responseSchema: PayCardSessionReceiptSchema,
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
 * Neither token grant has a hook.
 *
 * A renewal is the base query's decision, and a component that triggered one would rotate the
 * refresh token behind its back. The code exchange belongs to the login machine, which puts the
 * grant into the hand-off slot first; a component that called it would run it with nothing there.
 */
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

import { cardApi } from "@shared/api-services";
import { CARD_MANAGEMENT_TAGS, OAUTH2_TOKEN_PATH } from "./constants";
import {
  PayCardFreezeStateResponseSchema,
  PayCardInternalWalletsResponseSchema,
  PayCardRewardWalletResponseSchema,
  PayCardLinkWalletRequestSchema,
  PayCardLinkWalletResponseSchema,
  PayCardLinkedWalletsResponseSchema,
  PayCardLinkedWalletsCanonicalSchema,
  PayCardWalletPrioritiesRequestSchema,
  PayCardWalletPrioritiesResponseSchema,
  PayCardLogoutResponseSchema,
  PayCardOrderResponseSchema,
  PayCardSessionResponseSchema,
  PayCardSessionSchema,
  PayCardDetailsCssSchema,
  PayCardDetailsTokenResponseSchema,
  PayCardPinCssSchema,
  PayCardPinTokenResponseSchema,
  PayCardSetPinTokenRequestSchema,
  PayCardSetPinTokenResponseSchema,
  PayCardStatusResponseSchema,
  PayCardTransactionsRequestSchema,
  PayCardTransactionsResponseSchema,
  PayCardWalletHistoryRequestSchema,
  PayCardWalletHistoryResponseSchema,
  PayCardUserResponseSchema,
} from "./schema";
import { transformPayCardLinkedWallets, transformPayCardSessionResponse } from "./transforms";
import type {
  PayCardAuthorizationCodeRequest,
  PayCardFreezeStateResult,
  PayCardInternalWallet,
  PayCardLinkWalletRequest,
  PayCardLinkWalletResult,
  PayCardLinkedWallet,
  PayCardWalletPrioritiesRequest,
  PayCardWalletPrioritiesResult,
  PayCardLogoutResult,
  PayCardOrderResult,
  PayCardRefreshSessionRequest,
  PayCardRewardWallet,
  PayCardSession,
  PayCardDetailsCss,
  PayCardDetailsToken,
  PayCardPinCss,
  PayCardPinToken,
  PayCardSetPinToken,
  PayCardSetPinTokenRequest,
  PayCardStatus,
  PayCardTransaction,
  PayCardTransactionsRequest,
  PayCardWalletHistoryEntry,
  PayCardWalletHistoryRequest,
  PayCardUser,
} from "./types";

const GRANT = { authenticated: false } as const;

type PayCardLogoutRequest = Readonly<Record<string, never>>;

const logoutAccessTokens = new WeakMap<PayCardLogoutRequest, string | null>();

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

      logout: build.mutation<PayCardLogoutResult, PayCardLogoutRequest>({
        query: request => {
          const accessToken = logoutAccessTokens.get(request) ?? null;
          logoutAccessTokens.delete(request);
          return {
            url: "/v1/auth/logout",
            method: "POST",
            headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined,
            signal: null,
          };
        },
        extraOptions: { authenticated: false },
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
       * The card's own transactions, newest first.
       *
       * Paged by number and nothing else: the provider answers with a bare array, so a short page
       * is how a caller learns it has reached the end.
       */
      getCardTransactions: build.query<PayCardTransaction[], PayCardTransactionsRequest>({
        query: filters => ({
          url: "/v1/card/transactions",
          method: "GET",
          params: filters,
        }),
        argSchema: PayCardTransactionsRequestSchema,
        responseSchema: PayCardTransactionsResponseSchema,
        providesTags: ["CardTransactions"],
      }),

      /**
       * One wallet's own history, newest first, ten to a page.
       *
       * Asked for a single wallet: a card has several linked, so a caller that wants them all asks
       * once per wallet.
       */
      getWalletHistory: build.query<PayCardWalletHistoryEntry[], PayCardWalletHistoryRequest>({
        query: filters => ({
          url: "/v1/wallet/history",
          method: "GET",
          params: filters,
        }),
        argSchema: PayCardWalletHistoryRequestSchema,
        responseSchema: PayCardWalletHistoryResponseSchema,
        providesTags: ["WalletHistory"],
      }),

      /**
       * A mutation, though it reads: the provider spends the token on first use, so the answer must
       * never be served from a cache, and a mutation is never cached.
       *
       * It is still **retained**: RTK Query holds a tracked mutation result in
       * `state.cardApi.mutations`. Dispatch this one with `{ track: false }`, or reset it as soon
       * as the URL has been used — the answer is a credential, not data.
       */
      createCardDetailsToken: build.mutation<PayCardDetailsToken, PayCardDetailsCss | void>({
        query: customCss => ({
          url: "/v1/card/details/token",
          method: "POST",
          ...(customCss ? { body: { customCss } } : {}),
        }),
        argSchema: PayCardDetailsCssSchema.optional(),
        responseSchema: PayCardDetailsTokenResponseSchema,
      }),

      /**
       * The card's PIN, rendered by the provider as an image: the digits never reach the app as a
       * value, so nothing here can log or store them.
       *
       * A mutation, and retained, for the same reasons as `createCardDetailsToken`: the token is
       * spent once the image has been read, so the answer must never come from a cache, and
       * `state.cardApi.mutations` keeps a tracked result. Dispatch with `{ track: false }`, or
       * reset as soon as the image has loaded.
       */
      createCardPinToken: build.mutation<PayCardPinToken, PayCardPinCss | void>({
        query: customCss => ({
          url: "/v1/card/pin/token",
          method: "POST",
          ...(customCss ? { body: { customCss } } : {}),
        }),
        argSchema: PayCardPinCssSchema.optional(),
        responseSchema: PayCardPinTokenResponseSchema,
      }),

      /**
       * Mints the URL of the provider's hosted page for setting or changing the card's PIN.
       *
       * A mutation for the same reasons as `createCardDetailsToken`: the token is spent when the
       * page is opened, so the answer must never be served from a cache. The URL carries the token,
       * so dispatch with `{ track: false }` or reset once the page has been opened.
       */
      createCardSetPinToken: build.mutation<PayCardSetPinToken, PayCardSetPinTokenRequest | void>({
        query: request => ({
          url: "/v1/card/set-pin/token",
          method: "POST",
          ...(request ? { body: request } : {}),
        }),
        argSchema: PayCardSetPinTokenRequestSchema,
        responseSchema: PayCardSetPinTokenResponseSchema,
      }),

      freezeCard: build.mutation<PayCardFreezeStateResult, void>({
        query: () => ({
          url: "/v1/card/freeze",
          method: "POST",
        }),
        async onQueryStarted(_, { dispatch, queryFulfilled }) {
          await patchCardStatus(dispatch, queryFulfilled, "FROZEN");
        },
        responseSchema: PayCardFreezeStateResponseSchema,
        invalidatesTags: ["CardStatus"],
      }),

      unfreezeCard: build.mutation<PayCardFreezeStateResult, void>({
        query: () => ({
          url: "/v1/card/unfreeze",
          method: "POST",
        }),
        async onQueryStarted(_, { dispatch, queryFulfilled }) {
          await patchCardStatus(dispatch, queryFulfilled, "ACTIVE");
        },
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

      getRewardWallet: build.query<PayCardRewardWallet, void>({
        query: () => ({
          url: "/v1/wallet/reward",
          method: "GET",
        }),
        responseSchema: PayCardRewardWalletResponseSchema,
      }),

      getCardLinkedWallets: build.query<PayCardLinkedWallet[], void>({
        query: () => ({
          url: "/v1/wallet/internal/card_linked",
          method: "GET",
        }),
        rawResponseSchema: PayCardLinkedWalletsResponseSchema,
        transformResponse: transformPayCardLinkedWallets,
        responseSchema: PayCardLinkedWalletsCanonicalSchema,
        providesTags: ["CardLinkedWallets"],
      }),

      /**
       * Links one custodial wallet to the card as a funding source.
       *
       * Answers a `success` flag, which a caller has to read: a refusal arrives as
       * `success: false` on a 200 rather than as an error.
       */
      linkWalletToCard: build.mutation<PayCardLinkWalletResult, PayCardLinkWalletRequest>({
        query: request => ({
          url: "/v1/wallet/internal/card_linked",
          method: "POST",
          body: request,
        }),
        argSchema: PayCardLinkWalletRequestSchema,
        responseSchema: PayCardLinkWalletResponseSchema,
        // Only a made link invalidates. RTK Query invalidates a rejected mutation's tags too,
        // and a `success: false` answer is not rejected at all, yet neither changed the linked
        // set. `result` is undefined on an error, so this covers both. Unlike the freeze pair,
        // nothing here was patched optimistically, so there is no local guess to resync.
        invalidatesTags: result => (result?.success ? ["CardLinkedWallets"] : []),
      }),

      /**
       * Rewrites the order the linked wallets are charged in.
       *
       * Takes every linked wallet, not the ones being moved: the provider expects a priority for
       * each, and this package holds no linked set to check that against, so a partial order is
       * refused only once it is sent.
       *
       * Answers a `success` flag, which a caller has to read: a refusal arrives as
       * `success: false` on a 200 rather than as an error.
       */
      updateCardWalletPriorities: build.mutation<
        PayCardWalletPrioritiesResult,
        PayCardWalletPrioritiesRequest
      >({
        query: request => ({
          url: "/v1/wallet/internal/card_linked/priority",
          method: "PUT",
          body: request,
        }),
        argSchema: PayCardWalletPrioritiesRequestSchema,
        responseSchema: PayCardWalletPrioritiesResponseSchema,
        // Only a written order invalidates. RTK Query invalidates a rejected mutation's tags
        // too, and a `success: false` answer is not rejected at all, yet neither changed the
        // order. `result` is undefined on an error, so this covers both. The freeze pair
        // invalidates unconditionally on purpose: both patch the status optimistically, so a
        // refetch is what resyncs that guess. Nothing is patched here.
        invalidatesTags: result => (result?.success ? ["CardLinkedWallets"] : []),
      }),
    }),
  });

export function initiatePayCardLogout(accessToken: string | null) {
  const request = {};
  logoutAccessTokens.set(request, accessToken);
  return cardManagementApi.endpoints.logout.initiate(request, {
    track: false,
  });
}

export type CardManagementApi = typeof cardManagementApi;

export const {
  useGetUserQuery,
  useOrderCardMutation,
  useGetCardStatusQuery,
  useGetCardTransactionsQuery,
  useLazyGetCardTransactionsQuery,
  useGetWalletHistoryQuery,
  useLazyGetWalletHistoryQuery,
  useCreateCardDetailsTokenMutation,
  useCreateCardPinTokenMutation,
  useCreateCardSetPinTokenMutation,
  useLazyGetCardStatusQuery,
  useFreezeCardMutation,
  useUnfreezeCardMutation,
  useGetInternalWalletsQuery,
  useGetRewardWalletQuery,
  useGetCardLinkedWalletsQuery,
  useLinkWalletToCardMutation,
  useUpdateCardWalletPrioritiesMutation,
} = cardManagementApi;

async function patchCardStatus(
  dispatch: (action: ReturnType<(typeof cardManagementApi.util)["updateQueryData"]>) => {
    undo: () => void;
  },
  queryFulfilled: Promise<unknown>,
  status: PayCardStatus["status"],
) {
  const patch = dispatch(
    cardManagementApi.util.updateQueryData("getCardStatus", undefined, draft => {
      if (!draft) return;

      draft.status = status;
    }),
  );

  try {
    await queryFulfilled;
  } catch {
    patch.undo();
  }
}

import { z } from "zod";
import {
  PayCardErrorResponseSchema,
  PayCardFreezeStateResponseSchema,
  PayCardInternalWalletSchema,
  PayCardRewardWalletResponseSchema,
  PayCardLinkWalletRequestSchema,
  PayCardLinkWalletResponseSchema,
  PayCardLinkedWalletSchema,
  PayCardLinkedWalletCanonicalSchema,
  PayCardLogoutResponseSchema,
  PayCardOrderResponseSchema,
  PayCardSessionResponseSchema,
  PayCardSessionSchema,
  PayCardDetailsCssSchema,
  PayCardDetailsTokenResponseSchema,
  PayCardPinCssSchema,
  PayCardPinTokenResponseSchema,
  PayCardSetPinCssSchema,
  PayCardSetPinTokenRequestSchema,
  PayCardSetPinTokenResponseSchema,
  PayCardStatusResponseSchema,
  PayCardTransactionCashbackSchema,
  PayCardTransactionCategorySchema,
  PayCardTransactionFundingSourceSchema,
  PayCardTransactionSchema,
  PayCardTransactionsRequestSchema,
  PayCardWalletHistoryEntrySchema,
  PayCardWalletHistoryRequestSchema,
  PayCardWalletPrioritiesRequestSchema,
  PayCardWalletPrioritiesResponseSchema,
  PayCardUserResponseSchema,
} from "./schema";

/** Wire shape of a token response, before it is mapped onto {@link PayCardSession}. */
export type PayCardSessionResponse = z.infer<typeof PayCardSessionResponseSchema>;

export type PayCardSession = z.infer<typeof PayCardSessionSchema>;

export type PayCardLogoutResult = z.infer<typeof PayCardLogoutResponseSchema>;

export type PayCardUser = z.infer<typeof PayCardUserResponseSchema>;

export type PayCardOrderResult = z.infer<typeof PayCardOrderResponseSchema>;

export type PayCardFreezeStateResult = z.infer<typeof PayCardFreezeStateResponseSchema>;

export type PayCardErrorResponse = z.infer<typeof PayCardErrorResponseSchema>;

export type PayCardStatus = z.infer<typeof PayCardStatusResponseSchema>;

export type PayCardDetailsCss = z.infer<typeof PayCardDetailsCssSchema>;

export type PayCardTransactionCategory = z.infer<typeof PayCardTransactionCategorySchema>;

export type PayCardTransactionFundingSource = z.infer<typeof PayCardTransactionFundingSourceSchema>;

export type PayCardTransactionCashback = z.infer<typeof PayCardTransactionCashbackSchema>;

export type PayCardTransaction = z.infer<typeof PayCardTransactionSchema>;

/** Every filter the provider takes. The dates go together; the rest stand alone. */
export type PayCardTransactionsRequest = z.infer<typeof PayCardTransactionsRequestSchema>;

export type PayCardWalletHistoryEntry = z.infer<typeof PayCardWalletHistoryEntrySchema>;

/** Which wallet's history to read, and which page of it. */
export type PayCardWalletHistoryRequest = z.infer<typeof PayCardWalletHistoryRequestSchema>;

/**
 * Single use, and short-lived: the provider invalidates the token once the image has been read.
 *
 * Neither field may be logged or stored. RTK Query does not enforce that: it holds a tracked
 * mutation result in `state.cardApi.mutations`, so the caller has to dispatch with
 * `{ track: false }` or reset as soon as the URL has been used.
 */
export type PayCardDetailsToken = z.infer<typeof PayCardDetailsTokenResponseSchema>;

export type PayCardPinCss = z.infer<typeof PayCardPinCssSchema>;

/**
 * The card's PIN as an image, so the digits never reach the app as a value.
 *
 * Single use and short-lived, like {@link PayCardDetailsToken}: the provider spends the token once
 * the image has been read. Neither field may be logged or stored, so dispatch with
 * `{ track: false }` or reset as soon as the image has loaded.
 */
export type PayCardPinToken = z.infer<typeof PayCardPinTokenResponseSchema>;

export type PayCardSetPinCss = z.infer<typeof PayCardSetPinCssSchema>;

/** How the hosted PIN page should end, and how it should look. */
export type PayCardSetPinTokenRequest = z.infer<typeof PayCardSetPinTokenRequestSchema>;

/**
 * Single use, and short-lived: the provider spends the token when the hosted page is opened.
 *
 * `hostedPageUrl` carries the token in its query string, so neither field may be logged or stored.
 * The same caution as {@link PayCardDetailsToken}: dispatch with `{ track: false }`, or reset as
 * soon as the page has been opened.
 */
export type PayCardSetPinToken = z.infer<typeof PayCardSetPinTokenResponseSchema>;

export type PayCardAuthorizationCodeRequest = {
  readonly code: string;
  readonly codeVerifier: string;
};

export type PayCardRefreshSessionRequest = {
  readonly refreshToken: string;
};

export type PayCardInternalWallet = z.infer<typeof PayCardInternalWalletSchema>;

/** Which custodial wallet to link to, or unlink from, the card. */
export type PayCardLinkWalletRequest = z.infer<typeof PayCardLinkWalletRequestSchema>;

export type PayCardLinkWalletResult = z.infer<typeof PayCardLinkWalletResponseSchema>;

/** The wallet the card's rewards are paid into. */
export type PayCardRewardWallet = z.infer<typeof PayCardRewardWalletResponseSchema>;

/** One card-linked wallet exactly as the wire sent it. */
export type PayCardLinkedWalletResponse = z.infer<typeof PayCardLinkedWalletSchema>;

/** The same wallet, resolved to its Ledger currency once so every consumer reads one answer. */
export type PayCardLinkedWallet = z.infer<typeof PayCardLinkedWalletCanonicalSchema>;

/** The charging order to write: every linked wallet, each with a priority of its own. */
export type PayCardWalletPrioritiesRequest = z.infer<typeof PayCardWalletPrioritiesRequestSchema>;

export type PayCardWalletPrioritiesResult = z.infer<typeof PayCardWalletPrioritiesResponseSchema>;

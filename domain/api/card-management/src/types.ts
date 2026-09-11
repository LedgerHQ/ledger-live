import { z } from "zod";
import {
  PayCardErrorResponseSchema,
  PayCardFreezeStateResponseSchema,
  PayCardInternalWalletSchema,
  PayCardLinkedWalletSchema,
  PayCardLogoutResponseSchema,
  PayCardOnboardingStatusResponseSchema,
  PayCardOnboardingStepSchema,
  PayCardOrderResponseSchema,
  PayCardSessionResponseSchema,
  PayCardSessionSchema,
  PayCardDetailsCssSchema,
  PayCardDetailsTokenResponseSchema,
  PayCardStatusResponseSchema,
  PayCardTransactionSchema,
  PayCardTransactionsRequestSchema,
  PayCardWalletHistoryEntrySchema,
  PayCardWalletHistoryRequestSchema,
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

export type PayCardAuthorizationCodeRequest = {
  readonly code: string;
  readonly codeVerifier: string;
};

export type PayCardRefreshSessionRequest = {
  readonly refreshToken: string;
};

export type PayCardInternalWallet = z.infer<typeof PayCardInternalWalletSchema>;

export type PayCardLinkedWallet = z.infer<typeof PayCardLinkedWalletSchema>;

export type PayCardOnboardingStep = z.infer<typeof PayCardOnboardingStepSchema>;

export type PayCardOnboardingStatus = z.infer<typeof PayCardOnboardingStatusResponseSchema>;

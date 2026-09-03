import { z } from "zod";
import {
  PayCardErrorResponseSchema,
  PayCardFreezeStateResponseSchema,
  PayCardInternalWalletSchema,
  PayCardLinkedWalletSchema,
  PayCardLogoutResponseSchema,
  PayCardOrderResponseSchema,
  PayCardSessionResponseSchema,
  PayCardSessionSchema,
  PayCardStatusResponseSchema,
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

export type PayCardAuthorizationCodeRequest = {
  readonly code: string;
  readonly codeVerifier: string;
};

export type PayCardRefreshSessionRequest = {
  readonly refreshToken: string;
};

export type PayCardInternalWallet = z.infer<typeof PayCardInternalWalletSchema>;

export type PayCardLinkedWallet = z.infer<typeof PayCardLinkedWalletSchema>;

import type { PayCardProvider } from "@domain/entity-pay-card";
import type { z } from "zod";
import {
  PayCardAuthResponseSchema,
  PayCardLogoutResponseSchema,
  PayCardPreAuthResponseSchema,
  PayCardUserResponseSchema,
} from "./schema";

export type PayCardPreAuthRequest = {
  readonly provider?: PayCardProvider;
};

export type PayCardPreAuthResponse = Readonly<
  z.infer<typeof PayCardPreAuthResponseSchema>
>;

export type PayCardAuthRequest = {
  readonly state: string;
  readonly code: string;
};

export type PayCardAuthResponse = Readonly<z.infer<typeof PayCardAuthResponseSchema>>;

export type PayCardUserResponse = Readonly<z.infer<typeof PayCardUserResponseSchema>>;

export type PayCardLogoutResponse = Readonly<
  z.infer<typeof PayCardLogoutResponseSchema>
>;

export type PayCardApiErrorCode =
  | "invalid_provider"
  | "invalid_state"
  | "unauthorized"
  | "session_expired"
  | "provider_auth_rejected"
  | "refresh_in_progress"
  | "provider_error"
  | "unknown_provider"
  | "internal_error";

export type PayCardApiError = {
  readonly code: PayCardApiErrorCode;
  readonly message: string;
};

export enum PayCardApiTags {
  Session = "Session",
}

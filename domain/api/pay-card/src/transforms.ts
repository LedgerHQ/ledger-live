import {
  PayCardPreAuthSchema,
  PayCardSessionSchema,
  PayCardUserSchema,
  type PayCardPreAuth,
  type PayCardSession,
  type PayCardUser,
} from "@domain/entity-pay-card";
import {
  PayCardAuthResponseSchema,
  PayCardPreAuthResponseSchema,
  PayCardUserResponseSchema,
} from "./schema";

export function transformPayCardPreAuthResponse(response: unknown): PayCardPreAuth {
  return PayCardPreAuthSchema.parse(PayCardPreAuthResponseSchema.parse(response));
}

export function transformPayCardAuthResponse(response: unknown): PayCardSession {
  return PayCardSessionSchema.parse(PayCardAuthResponseSchema.parse(response));
}

export function transformPayCardUserResponse(response: unknown): PayCardUser {
  return PayCardUserSchema.parse(PayCardUserResponseSchema.parse(response));
}

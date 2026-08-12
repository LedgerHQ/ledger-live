import type { z } from "zod";
import type {
  PayCardAuthorizeInitiateResponseSchema,
  PayCardLogoutResponseSchema,
  PayCardProviderSchema,
  PayCardSessionResponseSchema,
  PayCardSessionSchema,
  PayCardUserResponseSchema,
} from "./schema";

export type PayCardProvider = z.infer<typeof PayCardProviderSchema>;

export type PayCardAuthorizeInitiate = z.infer<typeof PayCardAuthorizeInitiateResponseSchema>;

/** Wire shape of a token response, before it is mapped onto {@link PayCardSession}. */
export type PayCardSessionResponse = z.infer<typeof PayCardSessionResponseSchema>;

export type PayCardSession = z.infer<typeof PayCardSessionSchema>;

export type PayCardLogoutResult = z.infer<typeof PayCardLogoutResponseSchema>;

export type PayCardUser = z.infer<typeof PayCardUserResponseSchema>;

export type PayCardAuthState = Readonly<{
  hasCard: boolean;
}>;

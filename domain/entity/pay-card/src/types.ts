import type { z } from "zod";
import {
  PayCardLogoutResultSchema,
  PayCardPhaseSchema,
  PayCardPreAuthSchema,
  PayCardProviderSchema,
  PayCardSessionSchema,
  PayCardUserSchema,
  PayCardVerificationStateSchema,
} from "./schema";

export type PayCardProvider = z.infer<typeof PayCardProviderSchema>;

export type PayCardPreAuth = z.infer<typeof PayCardPreAuthSchema>;

export type PayCardSession = z.infer<typeof PayCardSessionSchema>;

export type PayCardVerificationState = z.infer<typeof PayCardVerificationStateSchema>;

export type PayCardPhase = z.infer<typeof PayCardPhaseSchema>;

export type PayCardUser = z.infer<typeof PayCardUserSchema>;

export type PayCardLogoutResult = z.infer<typeof PayCardLogoutResultSchema>;

export type PayCardState = Readonly<{
  loginUrl: string | null;
}>;

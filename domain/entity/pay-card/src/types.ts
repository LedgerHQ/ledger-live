import type { z } from "zod";
import {
  PayCardLogoutResultSchema,
  PayCardParamsSchema,
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

export type PayCardParams = z.infer<typeof PayCardParamsSchema>;

export type PayCardState = Readonly<{
  isOpen: boolean;
  params: PayCardParams | null;
  hasSeenFeatureTour: boolean;
}>;

export type PayCardPersistedState = Readonly<{
  hasSeenFeatureTour: boolean;
}>;

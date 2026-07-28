import type { z } from "zod";
import {
  PayCardCardStatusSchema,
  PayCardParamsSchema,
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

export type PayCardCardStatus = z.infer<typeof PayCardCardStatusSchema>;

export type PayCardUser = z.infer<typeof PayCardUserSchema>;

export type PayCardParams = z.infer<typeof PayCardParamsSchema>;

export type PayCardState = Readonly<{
  isOpen: boolean;
  params: PayCardParams | null;
  hasSeenFeatureTour: boolean;
}>;

/** Subset of {@link PayCardState} that is persisted across app restarts. */
export type PayCardPersistedState = Readonly<{
  hasSeenFeatureTour: boolean;
}>;

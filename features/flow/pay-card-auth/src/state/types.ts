import type { z } from "zod";
import type {
  PayCardParamsSchema,
  PayCardPreAuthResponseSchema,
  PayCardProviderSchema,
} from "./schema";

export type PayCardProvider = z.infer<typeof PayCardProviderSchema>;

export type PayCardPreAuth = z.infer<typeof PayCardPreAuthResponseSchema>;

export type PayCardParams = z.infer<typeof PayCardParamsSchema>;

export type PayCardState = Readonly<{
  params: PayCardParams | null;
  hasSeenFeatureTour: boolean;
}>;

/** Subset of {@link PayCardState} that is persisted across app restarts. */
export type PayCardPersistedState = Readonly<{
  hasSeenFeatureTour: boolean;
}>;

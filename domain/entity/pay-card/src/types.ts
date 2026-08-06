import type { z } from "zod";
import { PayCardParamsSchema } from "./schema";

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

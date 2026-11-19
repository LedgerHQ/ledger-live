import type { z } from "zod";
import type {
  ApyFractionSchema,
  BaseUnitAmountSchema,
  EarnPositionIdSchema,
  EarnPositionSchema,
  EarnPositionStatusSchema,
  EarnPositionsFailureSchema,
  EarnPositionsSchema,
} from "./schema";

export type EarnPositionStatus = z.infer<typeof EarnPositionStatusSchema>;
export type BaseUnitAmount = z.infer<typeof BaseUnitAmountSchema>;
export type ApyFraction = z.infer<typeof ApyFractionSchema>;
export type EarnPositionId = z.infer<typeof EarnPositionIdSchema>;
export type EarnPosition = z.infer<typeof EarnPositionSchema>;
export type EarnPositionsFailure = z.infer<typeof EarnPositionsFailureSchema>;
export type EarnPositions = z.infer<typeof EarnPositionsSchema>;
